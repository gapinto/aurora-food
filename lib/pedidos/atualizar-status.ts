import type { StatusPedido } from "@/lib/types/database";

import type { PedidosRepository } from "./repository";
import { transicaoValida } from "./status";

export interface AtualizarStatusDeps {
  repositorio: PedidosRepository;
}

export type AtualizarStatusResultado =
  | { ok: true }
  | { ok: false; erro: string; codigo: 404 | 422 };

// Usado pelo painel do caixa (confirmar pagamento manual) e pelo painel da
// cozinha (avançar preparando → pronto → retirado).
export async function atualizarStatusPedido(
  pedidoId: string,
  proximoStatus: StatusPedido,
  deps: AtualizarStatusDeps,
): Promise<AtualizarStatusResultado> {
  const statusAtual = await deps.repositorio.buscarStatusAtual(pedidoId);
  if (!statusAtual) {
    return { ok: false, erro: "pedido não encontrado", codigo: 404 };
  }

  if (!transicaoValida(statusAtual, proximoStatus)) {
    return {
      ok: false,
      erro: `transição inválida de ${statusAtual} para ${proximoStatus}`,
      codigo: 422,
    };
  }

  await deps.repositorio.atualizarStatus(pedidoId, proximoStatus);
  return { ok: true };
}
