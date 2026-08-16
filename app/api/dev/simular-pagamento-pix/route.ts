import { NextResponse } from "next/server";

import { asaasMockAtivo } from "@/lib/asaas/provider";
import { confirmarPagamentoPix } from "@/lib/pedidos/confirmar-pagamento-pix";
import { supabasePedidosRepository } from "@/lib/pedidos/supabase-repository";

// Só existe em modo mock (NEXT_PUBLIC_ASAAS_MOCK=true) — reusa o mesmo
// caso de uso do webhook real (lib/pedidos/confirmar-pagamento-pix.ts) em
// vez de fazer UPDATE direto, então exercita exatamente o código que roda
// em produção quando o Asaas de verdade chama o webhook. Fora do modo
// mock, 404 — não pode existir jeito de "confirmar pagamento" sem token do
// Asaas em produção (achado A01/A04 da revisão OWASP, CLAUDE.md/Backlog).
export async function POST(request: Request) {
  if (!asaasMockAtivo()) {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }

  const { pedidoId } = (await request.json()) as { pedidoId?: string };
  if (!pedidoId) {
    return NextResponse.json({ error: "pedidoId é obrigatório" }, { status: 400 });
  }

  const chargeId = await supabasePedidosRepository.buscarChargeIdDoPedido(pedidoId);
  if (!chargeId) {
    return NextResponse.json({ error: "pedido sem cobrança Pix associada" }, { status: 404 });
  }

  const resultado = await confirmarPagamentoPix(
    { event: "PAYMENT_RECEIVED", payment: { id: chargeId } },
    { repositorio: supabasePedidosRepository },
  );

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: resultado.codigo });
  }

  return NextResponse.json({ ok: true });
}
