import type { StatusPedido } from "@/lib/types/database";

export const TRANSICOES_VALIDAS: Record<StatusPedido, StatusPedido[]> = {
  aguardando_pagamento_pix: ["pago"],
  aguardando_pagamento_caixa: ["pago"],
  pago: ["preparando"],
  preparando: ["pronto"],
  pronto: ["retirado"],
  retirado: [],
};

export function transicaoValida(atual: StatusPedido, proximo: StatusPedido): boolean {
  return TRANSICOES_VALIDAS[atual].includes(proximo);
}
