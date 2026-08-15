import { supabaseConfigurado } from "@/lib/supabase/configured";
import { createClient } from "@/lib/supabase/server";

import { FilaCozinha } from "./fila-cozinha";

async function buscarPedidos(lojaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .eq("loja_id", lojaId)
    .in("status", ["pago", "preparando"])
    .order("criado_em");
  return data ?? [];
}

export default async function CozinhaPage({
  params,
}: {
  params: Promise<{ loja: string }>;
}) {
  const { loja } = await params;
  const data = supabaseConfigurado() ? await buscarPedidos(loja) : [];

  return (
    <>
      <header className="border-b border-white/10 p-4">
        <h1 className="text-xl font-semibold">Painel da cozinha</h1>
      </header>
      <FilaCozinha lojaId={loja} pedidosIniciais={data ?? []} />
    </>
  );
}
