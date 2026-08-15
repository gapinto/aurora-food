import { NextResponse } from "next/server";

import { criarCobrancaPix } from "@/lib/asaas/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { FormaPagamento } from "@/lib/types/database";

interface CriarPedidoBody {
  lojaId: string;
  linhas: { itemId: string; preco: number; quantidade: number }[];
  formaPagamento: FormaPagamento;
}

function gerarSenha(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as CriarPedidoBody;

  if (!body.lojaId || !body.linhas?.length || !body.formaPagamento) {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const valorTotal = body.linhas.reduce((soma, linha) => soma + linha.preco * linha.quantidade, 0);
  const supabase = createServiceRoleClient();

  const { data: pedido, error: erroPedido } = await supabase
    .from("pedidos")
    .insert({
      loja_id: body.lojaId,
      valor_total: valorTotal,
      forma_pagamento: body.formaPagamento,
      status: body.formaPagamento === "pix_online" ? "aguardando_pagamento_pix" : "aguardando_pagamento_caixa",
      senha: gerarSenha(),
    })
    .select()
    .single();

  if (erroPedido || !pedido) {
    return NextResponse.json({ error: "não foi possível criar o pedido" }, { status: 500 });
  }

  const { error: erroItens } = await supabase.from("pedido_itens").insert(
    body.linhas.map((linha) => ({
      pedido_id: pedido.id,
      item_id: linha.itemId,
      quantidade: linha.quantidade,
      preco_unitario: linha.preco,
    })),
  );

  if (erroItens) {
    return NextResponse.json({ error: "não foi possível registrar os itens" }, { status: 500 });
  }

  // Pix online: cria a cobrança agora. A cozinha só é liberada quando o
  // webhook do Asaas confirmar o pagamento (ver app/api/webhooks/asaas).
  if (body.formaPagamento === "pix_online") {
    try {
      const { data: loja } = await supabase
        .from("lojas")
        .select("asaas_wallet_id, comissao_percentual")
        .eq("id", body.lojaId)
        .single();

      if (loja?.asaas_wallet_id) {
        const cobranca = await criarCobrancaPix({
          walletId: loja.asaas_wallet_id,
          valor: valorTotal,
          comissaoPercentual: loja.comissao_percentual,
          descricao: `Pedido Aurora Food #${pedido.senha}`,
          pedidoId: pedido.id,
        });
        await supabase
          .from("pedidos")
          .update({ asaas_charge_id: cobranca.chargeId })
          .eq("id", pedido.id);
      }
    } catch {
      // Loja ainda sem subconta Asaas configurada (onboarding incompleto) —
      // o pedido continua criado, mas sem cobrança Pix gerada.
    }
  }

  return NextResponse.json({ pedidoId: pedido.id, senha: pedido.senha });
}
