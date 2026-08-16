import { exigirAcessoAoPainel } from "@/lib/auth/proteger-pagina-painel";
import { supabaseConfigurado } from "@/lib/supabase/configured";
import { createClient } from "@/lib/supabase/server";

import { LogoutButton } from "../../logout-button";
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

  // Sem Supabase real conectado ainda, não há sessão possível — cai no
  // modo demo (lista vazia) em vez de exigir login que não pode funcionar.
  if (supabaseConfigurado()) {
    const protecao = await exigirAcessoAoPainel(loja, `/caixa/${loja}`);
    if (!protecao.autorizado) {
      return <p className="p-4 text-neutral-400">Você não tem acesso a esta loja.</p>;
    }
  }

  const data = supabaseConfigurado() ? await buscarPedidos(loja) : [];

  return (
    <>
      <header className="flex items-center justify-between border-b border-white/10 p-4">
        <h1 className="text-xl font-semibold">Painel do caixa</h1>
        {supabaseConfigurado() && <LogoutButton />}
      </header>
      <FilaCaixa lojaId={loja} pedidosIniciais={data} />
    </>
  );
}
