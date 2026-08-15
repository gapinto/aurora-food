import { NextResponse } from "next/server";

import { buildSystemPrompt } from "@/lib/agente/system-prompt";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface AgenteBody {
  lojaId: string;
  mensagem: string;
}

// Agente de texto embutido no cardápio (spec seção 5). Contexto = cardápio
// inteiro injetado como JSON, sem RAG/base vetorial.
export async function POST(request: Request) {
  const body = (await request.json()) as AgenteBody;

  if (!body.lojaId || !body.mensagem) {
    return NextResponse.json({ error: "lojaId e mensagem são obrigatórios" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 501 });
  }

  const supabase = createServiceRoleClient();
  const [{ data: loja }, { data: itens }] = await Promise.all([
    supabase.from("lojas").select("nome").eq("id", body.lojaId).single(),
    supabase.from("itens").select("*").eq("loja_id", body.lojaId).eq("disponivel", true),
  ]);

  const systemPrompt = buildSystemPrompt(loja?.nome ?? "", itens ?? []);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: body.mensagem }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "falha ao consultar o agente" }, { status: 502 });
  }

  const data = await response.json();
  const resposta = data.content?.[0]?.text ?? "";
  return NextResponse.json({ resposta });
}
