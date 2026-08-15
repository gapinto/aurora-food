import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";

// Webhook do Asaas: confirma pagamento Pix e libera a cozinha automaticamente
// (spec seções 2 e 3). Configurar a URL no painel Asaas de cada subconta.
export async function POST(request: Request) {
  const assinaturaEsperada = process.env.ASAAS_WEBHOOK_TOKEN;
  const assinaturaRecebida = request.headers.get("asaas-access-token");
  if (assinaturaEsperada && assinaturaRecebida !== assinaturaEsperada) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const evento = await request.json();

  // TODO Fase 1: validar contra o payload real do Asaas (PAYMENT_RECEIVED /
  // PAYMENT_CONFIRMED) — estrutura abaixo é a documentada, mas não testada
  // contra sandbox ainda.
  if (evento.event !== "PAYMENT_RECEIVED" && evento.event !== "PAYMENT_CONFIRMED") {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const chargeId = evento.payment?.id as string | undefined;
  if (!chargeId) {
    return NextResponse.json({ error: "payload sem payment.id" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ status: "pago" })
    .eq("asaas_charge_id", chargeId)
    .eq("status", "aguardando_pagamento_pix");

  if (error) {
    return NextResponse.json({ error: "falha ao atualizar pedido" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
