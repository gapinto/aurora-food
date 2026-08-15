import { NextResponse } from "next/server";

import { criarSubconta } from "@/lib/asaas/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface OnboardingBody {
  cnpj: string;
  email: string;
}

// Função serverless assíncrona do onboarding via IA (spec seção 4):
// CNPJ → Receita Federal → cardápio importado → subconta Asaas → QR code.
// Aqui só o passo "criar subconta" está implementado; os demais (consulta
// à Receita, import de cardápio, sugestão de NCM) entram na Fase 1/2 e
// sempre passam por confirmação humana antes de aplicar qualquer dado.
export async function POST(request: Request) {
  const body = (await request.json()) as OnboardingBody;

  if (!body.cnpj || !body.email) {
    return NextResponse.json({ error: "cnpj e email são obrigatórios" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: loja, error } = await supabase
    .from("lojas")
    .insert({ cnpj: body.cnpj, nome: "", regime_fiscal: "simples_nacional" })
    .select()
    .single();

  if (error || !loja) {
    return NextResponse.json({ error: "não foi possível iniciar o onboarding" }, { status: 500 });
  }

  try {
    const subconta = await criarSubconta({ nome: loja.nome, cnpj: body.cnpj, email: body.email });
    await supabase.from("lojas").update({ asaas_wallet_id: subconta.walletId }).eq("id", loja.id);
  } catch {
    // Subconta pode ser criada depois manualmente — onboarding não trava aqui.
  }

  return NextResponse.json({ lojaId: loja.id });
}
