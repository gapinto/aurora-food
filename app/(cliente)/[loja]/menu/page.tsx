import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types/database";

import { CardapioClient } from "./cardapio-client";

// Dados de exemplo usados enquanto não há uma loja real cadastrada — TODO
// Fase 1: remover assim que a query ao Supabase abaixo estiver validada
// contra dados reais de onboarding.
const ITENS_EXEMPLO: Item[] = [
  {
    id: "exemplo-1",
    loja_id: "exemplo",
    categoria: "Lanches",
    nome: "X-Salada",
    preco: 24.9,
    foto_url: null,
    ncm: null,
    disponivel: true,
    preco_atualizado_em: new Date().toISOString(),
  },
  {
    id: "exemplo-2",
    loja_id: "exemplo",
    categoria: "Lanches",
    nome: "X-Bacon",
    preco: 28.9,
    foto_url: null,
    ncm: null,
    disponivel: true,
    preco_atualizado_em: new Date().toISOString(),
  },
  {
    id: "exemplo-3",
    loja_id: "exemplo",
    categoria: "Bebidas",
    nome: "Suco natural",
    preco: 9.5,
    foto_url: null,
    ncm: null,
    disponivel: true,
    preco_atualizado_em: new Date().toISOString(),
  },
];

async function buscarItensDaLoja(lojaId: string): Promise<Item[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return ITENS_EXEMPLO;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itens")
    .select("*")
    .eq("loja_id", lojaId)
    .eq("disponivel", true)
    .order("categoria");

  if (error || !data || data.length === 0) {
    return ITENS_EXEMPLO;
  }

  return data;
}

// [loja] é o id da loja (uuid) — o QR code do balcão aponta direto pra essa
// URL, sem necessidade de busca/slug.
export default async function MenuPage({
  params,
}: {
  params: Promise<{ loja: string }>;
}) {
  const { loja } = await params;
  const itens = await buscarItensDaLoja(loja);

  return <CardapioClient lojaSlug={loja} itens={itens} />;
}
