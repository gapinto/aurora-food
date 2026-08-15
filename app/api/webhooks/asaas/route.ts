import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { confirmarPagamentoPix, type EventoWebhookAsaas } from "@/lib/pedidos/confirmar-pagamento-pix";
import { supabasePedidosRepository } from "@/lib/pedidos/supabase-repository";

// Comparação em tempo constante — evita vazar quantos caracteres do token
// bateram via timing (ataque de baixo risco aqui, mas trivial de evitar).
function tokensIguais(recebido: string, esperado: string): boolean {
  const bufRecebido = Buffer.from(recebido);
  const bufEsperado = Buffer.from(esperado);
  if (bufRecebido.length !== bufEsperado.length) return false;
  return timingSafeEqual(bufRecebido, bufEsperado);
}

// Webhook do Asaas: confirma pagamento Pix e libera a cozinha automaticamente
// (spec seções 2 e 3). Configurar a URL no painel Asaas de cada subconta.
export async function POST(request: Request) {
  const tokenEsperado = process.env.ASAAS_WEBHOOK_TOKEN;
  // Fail closed: sem token configurado, a rota rejeita tudo em vez de
  // aceitar qualquer request sem autenticação (achado da revisão OWASP
  // A01/A04 — ver CLAUDE.md/Backlog).
  if (!tokenEsperado) {
    return NextResponse.json({ error: "ASAAS_WEBHOOK_TOKEN não configurada" }, { status: 500 });
  }

  const tokenRecebido = request.headers.get("asaas-access-token") ?? "";
  if (!tokensIguais(tokenRecebido, tokenEsperado)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const evento = (await request.json()) as EventoWebhookAsaas;

  const resultado = await confirmarPagamentoPix(evento, { repositorio: supabasePedidosRepository });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: resultado.codigo });
  }

  return NextResponse.json({ ok: true, ignorado: resultado.ignorado });
}
