import type { PedidosRepository } from "./repository";

export interface EventoWebhookAsaas {
  event?: string;
  payment?: { id?: string };
}

export interface ConfirmarPagamentoPixDeps {
  repositorio: PedidosRepository;
}

export type ConfirmarPagamentoPixResultado =
  | { ok: true; ignorado?: true }
  | { ok: false; erro: string; codigo: 400 | 500 };

const EVENTOS_DE_PAGAMENTO_CONFIRMADO = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];

// Webhook do Asaas: confirma pagamento Pix e libera a cozinha automaticamente
// (spec seções 2 e 3).
export async function confirmarPagamentoPix(
  evento: EventoWebhookAsaas,
  deps: ConfirmarPagamentoPixDeps,
): Promise<ConfirmarPagamentoPixResultado> {
  if (!evento.event || !EVENTOS_DE_PAGAMENTO_CONFIRMADO.includes(evento.event)) {
    return { ok: true, ignorado: true };
  }

  const chargeId = evento.payment?.id;
  if (!chargeId) {
    return { ok: false, erro: "payload sem payment.id", codigo: 400 };
  }

  const atualizado = await deps.repositorio.confirmarPagamentoPix(chargeId);
  if (!atualizado) {
    return { ok: false, erro: "falha ao atualizar pedido", codigo: 500 };
  }

  return { ok: true };
}
