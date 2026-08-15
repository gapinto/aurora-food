import { describe, expect, it } from "vitest";

import { criarPagamentoProviderFake } from "@/test/fakes/pagamento-provider.fake";
import { criarPedidosRepositoryFake } from "@/test/fakes/pedidos-repository.fake";

import { criarPedido } from "./criar-pedido";

const linhaValida = { itemId: "item-1", quantidade: 2 };
const catalogoPadrao = { "loja-1": [{ id: "item-1", preco: 24.9 }] };

describe("criarPedido", () => {
  it("rejeita payload sem loja, itens ou forma de pagamento", async () => {
    const { repositorio } = criarPedidosRepositoryFake();
    const { provider } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "", linhas: [linhaValida], formaPagamento: "pix_online" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "payload inválido" });
  });

  it("rejeita carrinho vazio", async () => {
    const { repositorio } = criarPedidosRepositoryFake();
    const { provider } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [], formaPagamento: "pix_online" },
      { repositorio, pagamento: provider },
    );

    expect(resultado.ok).toBe(false);
  });

  it.each([0, -1, 1.5])("rejeita quantidade inválida (%s)", async (quantidade) => {
    const { repositorio } = criarPedidosRepositoryFake({ itensPorLoja: catalogoPadrao });
    const { provider } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [{ itemId: "item-1", quantidade }], formaPagamento: "caixa" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "quantidade inválida" });
  });

  it("resolve o preço sempre pelo catálogo do servidor — ignora qualquer 'preco' enviado no payload (price tampering)", async () => {
    const { repositorio, pedidos } = criarPedidosRepositoryFake({ itensPorLoja: catalogoPadrao });
    const { provider } = criarPagamentoProviderFake();

    // Simula um client malicioso batendo direto na API com preço adulterado
    // — o tipo público não expõe `preco`, mas nada impede um payload bruto.
    const payloadAdulterado = {
      lojaId: "loja-1",
      linhas: [{ itemId: "item-1", quantidade: 1, preco: 0.01 }],
      formaPagamento: "caixa" as const,
    };

    const resultado = await criarPedido(payloadAdulterado, { repositorio, pagamento: provider });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      // preço real do catálogo (24.90), não o 0.01 injetado no payload.
      expect(pedidos.get(resultado.pedidoId)?.valorTotal).toBeCloseTo(24.9);
      expect(pedidos.get(resultado.pedidoId)?.itens).toEqual([
        { itemId: "item-1", preco: 24.9, quantidade: 1 },
      ]);
    }
  });

  it("rejeita item que não existe ou está indisponível na loja", async () => {
    const { repositorio } = criarPedidosRepositoryFake({ itensPorLoja: catalogoPadrao });
    const { provider } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [{ itemId: "item-inexistente", quantidade: 1 }], formaPagamento: "caixa" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "item item-inexistente indisponível" });
  });

  it("rejeita item que pertence a outra loja (não filtra só por id global)", async () => {
    const { repositorio } = criarPedidosRepositoryFake({
      itensPorLoja: { "loja-2": [{ id: "item-1", preco: 24.9 }] }, // item existe, mas em loja-2
    });
    const { provider } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [linhaValida], formaPagamento: "caixa" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "item item-1 indisponível" });
  });

  it("cria pedido 'pagar no caixa' com status aguardando_pagamento_caixa, sem chamar o provedor de pagamento", async () => {
    const { repositorio, pedidos } = criarPedidosRepositoryFake({ itensPorLoja: catalogoPadrao });
    const { provider, cobrancasCriadas } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [linhaValida], formaPagamento: "caixa" },
      { repositorio, pagamento: provider, gerarSenha: () => "321" },
    );

    expect(resultado).toEqual({ ok: true, pedidoId: "pedido-1", senha: "321" });
    expect(pedidos.get("pedido-1")?.status).toBe("aguardando_pagamento_caixa");
    expect(pedidos.get("pedido-1")?.itens).toEqual([{ itemId: "item-1", preco: 24.9, quantidade: 2 }]);
    expect(cobrancasCriadas).toHaveLength(0);
  });

  it("cria pedido Pix e gera cobrança quando a loja já tem subconta Asaas", async () => {
    const { repositorio, pedidos } = criarPedidosRepositoryFake({
      itensPorLoja: catalogoPadrao,
      lojas: { "loja-1": { asaasWalletId: "wallet-loja-1", comissaoPercentual: 1.5 } },
    });
    const { provider, cobrancasCriadas } = criarPagamentoProviderFake({ chargeIdGerado: "charge-123" });

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [linhaValida], formaPagamento: "pix_online" },
      { repositorio, pagamento: provider, gerarSenha: () => "777" },
    );

    expect(resultado).toEqual({ ok: true, pedidoId: "pedido-1", senha: "777" });
    expect(pedidos.get("pedido-1")?.status).toBe("aguardando_pagamento_pix");
    expect(pedidos.get("pedido-1")?.asaasChargeId).toBe("charge-123");
    expect(cobrancasCriadas).toEqual([
      {
        walletId: "wallet-loja-1",
        valor: 49.8,
        comissaoPercentual: 1.5,
        descricao: "Pedido Aurora Food #777",
        pedidoId: "pedido-1",
      },
    ]);
  });

  it("cria o pedido Pix mesmo sem subconta Asaas configurada (onboarding incompleto)", async () => {
    const { repositorio, pedidos } = criarPedidosRepositoryFake({ itensPorLoja: catalogoPadrao }); // sem lojas cadastradas
    const { provider, cobrancasCriadas } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [linhaValida], formaPagamento: "pix_online" },
      { repositorio, pagamento: provider },
    );

    expect(resultado.ok).toBe(true);
    expect(cobrancasCriadas).toHaveLength(0);
    if (resultado.ok) {
      expect(pedidos.get(resultado.pedidoId)?.asaasChargeId).toBeNull();
    }
  });

  it("mantém o pedido criado mesmo se o provedor de pagamento falhar ao gerar a cobrança", async () => {
    const { repositorio, pedidos } = criarPedidosRepositoryFake({
      itensPorLoja: catalogoPadrao,
      lojas: { "loja-1": { asaasWalletId: "wallet-loja-1", comissaoPercentual: 1.5 } },
    });
    const { provider } = criarPagamentoProviderFake({ falharAoCriarCobranca: true });

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [linhaValida], formaPagamento: "pix_online" },
      { repositorio, pagamento: provider },
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(pedidos.get(resultado.pedidoId)?.asaasChargeId).toBeNull();
    }
  });

  it("propaga falha quando o repositório não consegue criar o pedido", async () => {
    const { repositorio } = criarPedidosRepositoryFake({
      itensPorLoja: catalogoPadrao,
      falharAoCriarPedido: true,
    });
    const { provider } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [linhaValida], formaPagamento: "caixa" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "não foi possível criar o pedido" });
  });

  it("propaga falha quando o repositório não consegue registrar os itens", async () => {
    const { repositorio } = criarPedidosRepositoryFake({
      itensPorLoja: catalogoPadrao,
      falharAoCriarItens: true,
    });
    const { provider } = criarPagamentoProviderFake();

    const resultado = await criarPedido(
      { lojaId: "loja-1", linhas: [linhaValida], formaPagamento: "caixa" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "não foi possível registrar os itens" });
  });
});
