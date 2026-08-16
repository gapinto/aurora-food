import { NextResponse } from "next/server";

import { inscreverListaEspera, type InscreverListaEsperaInput } from "@/lib/lista-espera/inscrever-lista-espera";
import { supabaseListaEsperaRepository } from "@/lib/lista-espera/supabase-repository";
import { supabaseConfigurado } from "@/lib/supabase/configured";

export async function POST(request: Request) {
  // Sem isso, createServiceRoleClient() lança direto na construção (URL/key
  // undefined) e a rota devolve 500 cru sem corpo — achado testando o
  // formulário na prática sem Supabase configurado. Mesmo padrão usado no
  // resto do app (menu/page.tsx, páginas de painel).
  if (!supabaseConfigurado()) {
    return NextResponse.json(
      { error: "Lista de espera indisponível no momento — tente de novo mais tarde." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as InscreverListaEsperaInput;

  const resultado = await inscreverListaEspera(body, { repositorio: supabaseListaEsperaRepository });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({ jaInscrito: resultado.jaInscrito });
}
