import { NextResponse } from "next/server";

import { confirmarPagamentoPix, type EventoWebhookAsaas } from "@/lib/pedidos/confirmar-pagamento-pix";
import { supabasePedidosRepository } from "@/lib/pedidos/supabase-repository";

// Webhook do Asaas: confirma pagamento Pix e libera a cozinha automaticamente
// (spec seções 2 e 3). Configurar a URL no painel Asaas de cada subconta.
export async function POST(request: Request) {
  const assinaturaEsperada = process.env.ASAAS_WEBHOOK_TOKEN;
  const assinaturaRecebida = request.headers.get("asaas-access-token");
  if (assinaturaEsperada && assinaturaRecebida !== assinaturaEsperada) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const evento = (await request.json()) as EventoWebhookAsaas;

  const resultado = await confirmarPagamentoPix(evento, { repositorio: supabasePedidosRepository });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: resultado.codigo });
  }

  return NextResponse.json({ ok: true, ignorado: resultado.ignorado });
}
