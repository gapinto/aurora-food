import { NextResponse } from "next/server";

import { asaasPagamentoProvider } from "@/lib/asaas/client";
import { criarPedido, type CriarPedidoInput } from "@/lib/pedidos/criar-pedido";
import { supabasePedidosRepository } from "@/lib/pedidos/supabase-repository";

export async function POST(request: Request) {
  const body = (await request.json()) as CriarPedidoInput;

  const resultado = await criarPedido(body, {
    repositorio: supabasePedidosRepository,
    pagamento: asaasPagamentoProvider,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({ pedidoId: resultado.pedidoId, senha: resultado.senha });
}
