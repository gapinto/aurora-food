import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { StatusPedido } from "@/lib/types/database";

const TRANSICOES_VALIDAS: Record<StatusPedido, StatusPedido[]> = {
  aguardando_pagamento_pix: ["pago"],
  aguardando_pagamento_caixa: ["pago"],
  pago: ["preparando"],
  preparando: ["pronto"],
  pronto: ["retirado"],
  retirado: [],
};

// Usado pelo painel do caixa (confirmar pagamento manual) e pelo painel da
// cozinha (avançar preparando → pronto → retirado). O cliente vê a mudança
// em tempo real via Supabase Realtime (ver pedido-client.tsx).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const { pedidoId } = await params;
  const { status: proximoStatus } = (await request.json()) as { status: StatusPedido };

  const supabase = createServiceRoleClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("status")
    .eq("id", pedidoId)
    .single();

  if (!pedido) {
    return NextResponse.json({ error: "pedido não encontrado" }, { status: 404 });
  }

  if (!TRANSICOES_VALIDAS[pedido.status as StatusPedido].includes(proximoStatus)) {
    return NextResponse.json(
      { error: `transição inválida de ${pedido.status} para ${proximoStatus}` },
      { status: 422 },
    );
  }

  const { error } = await supabase.from("pedidos").update({ status: proximoStatus }).eq("id", pedidoId);
  if (error) {
    return NextResponse.json({ error: "falha ao atualizar status" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
