import type {
  LinhaPedidoInput,
  LojaResumoPagamento,
  NovoPedidoInput,
  PedidoCriado,
  PedidosRepository,
} from "@/lib/pedidos/repository";
import type { StatusPedido } from "@/lib/types/database";

interface PedidoArmazenado extends NovoPedidoInput {
  id: string;
  asaasChargeId: string | null;
  itens: LinhaPedidoInput[];
}

// Implementação em memória de PedidosRepository — usada nos testes dos
// casos de uso em lib/pedidos/*.test.ts pra não depender de rede/Supabase.
export function criarPedidosRepositoryFake(options?: {
  lojas?: Record<string, LojaResumoPagamento>;
  falharAoCriarPedido?: boolean;
  falharAoCriarItens?: boolean;
}) {
  const pedidos = new Map<string, PedidoArmazenado>();
  let proximoId = 1;

  const repositorio: PedidosRepository = {
    async criarPedido(input: NovoPedidoInput): Promise<PedidoCriado | null> {
      if (options?.falharAoCriarPedido) return null;
      const id = `pedido-${proximoId++}`;
      pedidos.set(id, { ...input, id, asaasChargeId: null, itens: [] });
      return { id, senha: input.senha };
    },

    async criarItensPedido(pedidoId: string, linhas: LinhaPedidoInput[]): Promise<boolean> {
      if (options?.falharAoCriarItens) return false;
      const pedido = pedidos.get(pedidoId);
      if (!pedido) return false;
      pedido.itens = linhas;
      return true;
    },

    async buscarLojaParaPagamento(lojaId: string): Promise<LojaResumoPagamento | null> {
      return options?.lojas?.[lojaId] ?? null;
    },

    async atualizarChargeId(pedidoId: string, chargeId: string): Promise<void> {
      const pedido = pedidos.get(pedidoId);
      if (pedido) pedido.asaasChargeId = chargeId;
    },

    async buscarStatusAtual(pedidoId: string): Promise<StatusPedido | null> {
      return pedidos.get(pedidoId)?.status ?? null;
    },

    async atualizarStatus(pedidoId: string, status: StatusPedido): Promise<void> {
      const pedido = pedidos.get(pedidoId);
      if (pedido) pedido.status = status;
    },

    async confirmarPagamentoPix(chargeId: string): Promise<boolean> {
      const pedido = [...pedidos.values()].find(
        (p) => p.asaasChargeId === chargeId && p.status === "aguardando_pagamento_pix",
      );
      if (!pedido) return false;
      pedido.status = "pago";
      return true;
    },
  };

  return { repositorio, pedidos };
}
