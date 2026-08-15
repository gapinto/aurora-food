import type { PagamentoProvider } from "@/lib/asaas/types";
import type { FormaPagamento } from "@/lib/types/database";

import { calcularValorTotal, gerarSenha as gerarSenhaPadrao } from "./calculos";
import type { LinhaPedidoInput, PedidosRepository } from "./repository";

// Só itemId e quantidade vêm do cliente — o preço é sempre resolvido no
// servidor a partir do cardápio real (ver buscarItensDisponiveis). Aceitar
// `preco` do payload permitiria o cliente montar o próprio valor do pedido
// (price tampering — achado da revisão OWASP, CLAUDE.md/Backlog).
export interface LinhaPedidoRequisitada {
  itemId: string;
  quantidade: number;
}

export interface CriarPedidoInput {
  lojaId: string;
  linhas: LinhaPedidoRequisitada[];
  formaPagamento: FormaPagamento;
}

export interface CriarPedidoDeps {
  repositorio: PedidosRepository;
  pagamento: PagamentoProvider;
  gerarSenha?: () => string;
}

export type CriarPedidoResultado =
  | { ok: true; pedidoId: string; senha: string }
  | { ok: false; erro: string };

// Caso de uso puro: recebe as dependências como interfaces (PedidosRepository,
// PagamentoProvider), nunca importa Supabase/Asaas concretos — é isso que
// deixa testável sem rede/DB (ver criar-pedido.test.ts) e é o adapter em
// app/api/pedidos/route.ts que decide as implementações reais.
export async function criarPedido(
  input: CriarPedidoInput,
  deps: CriarPedidoDeps,
): Promise<CriarPedidoResultado> {
  if (!input.lojaId || !input.linhas?.length || !input.formaPagamento) {
    return { ok: false, erro: "payload inválido" };
  }

  if (input.linhas.some((linha) => !Number.isInteger(linha.quantidade) || linha.quantidade <= 0)) {
    return { ok: false, erro: "quantidade inválida" };
  }

  const linhasComPrecoReal = await resolverPrecosReais(input.lojaId, input.linhas, deps.repositorio);
  if (!linhasComPrecoReal.ok) {
    return linhasComPrecoReal;
  }

  const valorTotal = calcularValorTotal(linhasComPrecoReal.linhas);
  const senha = (deps.gerarSenha ?? gerarSenhaPadrao)();

  const pedido = await deps.repositorio.criarPedido({
    lojaId: input.lojaId,
    valorTotal,
    formaPagamento: input.formaPagamento,
    status: input.formaPagamento === "pix_online" ? "aguardando_pagamento_pix" : "aguardando_pagamento_caixa",
    senha,
  });
  if (!pedido) {
    return { ok: false, erro: "não foi possível criar o pedido" };
  }

  const itensCriados = await deps.repositorio.criarItensPedido(pedido.id, linhasComPrecoReal.linhas);
  if (!itensCriados) {
    return { ok: false, erro: "não foi possível registrar os itens" };
  }

  if (input.formaPagamento === "pix_online") {
    await tentarCriarCobrancaPix(pedido, valorTotal, input.lojaId, deps);
  }

  return { ok: true, pedidoId: pedido.id, senha: pedido.senha };
}

async function resolverPrecosReais(
  lojaId: string,
  linhas: LinhaPedidoRequisitada[],
  repositorio: PedidosRepository,
): Promise<{ ok: true; linhas: LinhaPedidoInput[] } | { ok: false; erro: string }> {
  const itensDisponiveis = await repositorio.buscarItensDisponiveis(
    lojaId,
    linhas.map((linha) => linha.itemId),
  );
  const precoPorItem = new Map(itensDisponiveis.map((item) => [item.id, item.preco]));

  const linhasComPrecoReal: LinhaPedidoInput[] = [];
  for (const linha of linhas) {
    const preco = precoPorItem.get(linha.itemId);
    if (preco === undefined) {
      return { ok: false, erro: `item ${linha.itemId} indisponível` };
    }
    linhasComPrecoReal.push({ itemId: linha.itemId, preco, quantidade: linha.quantidade });
  }

  return { ok: true, linhas: linhasComPrecoReal };
}

async function tentarCriarCobrancaPix(
  pedido: { id: string; senha: string },
  valorTotal: number,
  lojaId: string,
  deps: CriarPedidoDeps,
): Promise<void> {
  const loja = await deps.repositorio.buscarLojaParaPagamento(lojaId);
  if (!loja?.asaasWalletId) return;

  try {
    const cobranca = await deps.pagamento.criarCobrancaPix({
      walletId: loja.asaasWalletId,
      valor: valorTotal,
      comissaoPercentual: loja.comissaoPercentual,
      descricao: `Pedido Aurora Food #${pedido.senha}`,
      pedidoId: pedido.id,
    });
    await deps.repositorio.atualizarChargeId(pedido.id, cobranca.chargeId);
  } catch {
    // Loja ainda sem subconta Asaas configurada (onboarding incompleto) —
    // o pedido continua criado, mas sem cobrança Pix gerada.
  }
}
