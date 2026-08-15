import { supabaseConfigurado } from "@/lib/supabase/configured";
import { createClient } from "@/lib/supabase/server";

import { FilaCaixa } from "./fila-caixa";

async function buscarPedidos(lojaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .eq("loja_id", lojaId)
    .eq("status", "aguardando_pagamento_caixa")
    .order("criado_em");
  return data ?? [];
}

export default async function CaixaPage({
  params,
}: {
  params: Promise<{ loja: string }>;
}) {
  const { loja } = await params;
  const data = supabaseConfigurado() ? await buscarPedidos(loja) : [];

  return (
    <>
      <header className="border-b border-white/10 p-4">
        <h1 className="text-xl font-semibold">Painel do caixa</h1>
      </header>
      <FilaCaixa lojaId={loja} pedidosIniciais={data} />
    </>
  );
}
