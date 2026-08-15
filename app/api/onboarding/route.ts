import { NextResponse } from "next/server";

import { asaasPagamentoProvider } from "@/lib/asaas/client";
import { iniciarOnboarding, type IniciarOnboardingInput } from "@/lib/lojas/onboarding";
import { supabaseLojasRepository } from "@/lib/lojas/supabase-repository";

export async function POST(request: Request) {
  const body = (await request.json()) as IniciarOnboardingInput;

  const resultado = await iniciarOnboarding(body, {
    repositorio: supabaseLojasRepository,
    pagamento: asaasPagamentoProvider,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({ lojaId: resultado.lojaId });
}
