import { NextResponse } from "next/server";

import { atualizarStatusPedido } from "@/lib/pedidos/atualizar-status";
import { supabasePedidosRepository } from "@/lib/pedidos/supabase-repository";
import type { StatusPedido } from "@/lib/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const { pedidoId } = await params;
  const { status } = (await request.json()) as { status: StatusPedido };

  const resultado = await atualizarStatusPedido(pedidoId, status, {
    repositorio: supabasePedidosRepository,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: resultado.codigo });
  }

  return NextResponse.json({ ok: true });
}
