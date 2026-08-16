import { asaasHttpProvider } from "./client";
import { asaasMockProvider } from "./mock-client";
import type { PagamentoProvider } from "./types";

// `NEXT_PUBLIC_` de propósito: além de escolher o provider aqui (uso
// server-side), o client component da tela de acompanhamento do pedido
// (app/(cliente)/[loja]/pedido/[pedidoId]/pedido-client.tsx) precisa saber
// se está em modo mock pra mostrar o botão "simular pagamento" — uma flag
// só, em vez de duas variáveis que podem sair de sincronia.
export function asaasMockAtivo(): boolean {
  return process.env.NEXT_PUBLIC_ASAAS_MOCK === "true";
}

// Ponto único de entrada pras rotas de API — nunca importar
// asaasHttpProvider/asaasMockProvider direto fora daqui.
export const asaasPagamentoProvider: PagamentoProvider = asaasMockAtivo()
  ? asaasMockProvider
  : asaasHttpProvider;
