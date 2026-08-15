import { notFound } from "next/navigation";

import { supabaseConfigurado } from "@/lib/supabase/configured";
import { createClient } from "@/lib/supabase/server";

import { PedidoClient } from "./pedido-client";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ pedidoId: string }>;
}) {
  const { pedidoId } = await params;

  if (!supabaseConfigurado()) {
    return (
      <p className="flex flex-1 items-center justify-center px-4 text-center text-neutral-500">
        Supabase ainda não configurado — configure `.env.local` para acompanhar pedidos reais.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: pedido } = await supabase.from("pedidos").select("*").eq("id", pedidoId).single();

  if (!pedido) notFound();

  return <PedidoClient pedidoInicial={pedido} />;
}
