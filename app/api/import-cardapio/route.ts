import { NextResponse } from "next/server";

interface ImportarCardapioBody {
  lojaId: string;
  linkCardapio: string;
}

// Import via link de cardápio existente (MenuDino, Consumer, Goomer) —
// primeira fonte a implementar por não depender de aprovação de API
// (spec seção 4). Scraping de HTML, sem parceria formal.
//
// TODO Fase 1: implementar o scraper real por provedor e o parsing pra
// categorias/itens/preços. Preço, NCM e split continuam sempre confirmados
// pelo humano antes de aplicar (spec seção 4) — este endpoint deve devolver
// uma prévia, nunca gravar direto no cardápio publicado.
export async function POST(request: Request) {
  const body = (await request.json()) as ImportarCardapioBody;

  if (!body.lojaId || !body.linkCardapio) {
    return NextResponse.json({ error: "lojaId e linkCardapio são obrigatórios" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "import de cardápio ainda não implementado" },
    { status: 501 },
  );
}
