import { NextResponse } from "next/server";

import { exigirAcessoALoja } from "@/lib/auth/exigir-acesso-loja";
import { supabaseAutorizacaoRepository } from "@/lib/auth/supabase-repository";
import { atualizarStatusPedido } from "@/lib/pedidos/atualizar-status";
import { supabasePedidosRepository } from "@/lib/pedidos/supabase-repository";
import type { StatusPedido } from "@/lib/types/database";

// Só dono/operador da loja pode avançar status — achado A01/A07 da revisão
// OWASP (CLAUDE.md/Backlog): sem isso, o próprio cliente conseguia marcar
// o pedido "pagar no caixa" como pago via fetch direto, sem pagar nada.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const { pedidoId } = await params;

  const lojaId = await supabasePedidosRepository.buscarLojaDoPedido(pedidoId);
  if (!lojaId) {
    return NextResponse.json({ error: "pedido não encontrado" }, { status: 404 });
  }

  const acesso = await exigirAcessoALoja(lojaId, { autorizacao: supabaseAutorizacaoRepository });
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.erro }, { status: acesso.codigo });
  }

  const { status } = (await request.json()) as { status: StatusPedido };

  const resultado = await atualizarStatusPedido(pedidoId, status, {
    repositorio: supabasePedidosRepository,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: resultado.codigo });
  }

  return NextResponse.json({ ok: true });
}
