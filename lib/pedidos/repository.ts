import type { FormaPagamento, StatusPedido } from "@/lib/types/database";

export interface LinhaPedidoInput {
  itemId: string;
  preco: number;
  quantidade: number;
}

export interface NovoPedidoInput {
  lojaId: string;
  valorTotal: number;
  formaPagamento: FormaPagamento;
  status: StatusPedido;
  senha: string;
}

export interface PedidoCriado {
  id: string;
  senha: string;
}

export interface LojaResumoPagamento {
  asaasWalletId: string | null;
  comissaoPercentual: number;
}

// Programado contra interface: os casos de uso em lib/pedidos/*.ts (a
// lógica de negócio testada em TDD) nunca falam com o Supabase direto —
// só com este contrato. Em teste, um fake em memória implementa a mesma
// interface (ver lib/pedidos/criar-pedido.test.ts); em produção,
// supabase-repository.ts.
export interface PedidosRepository {
  criarPedido(input: NovoPedidoInput): Promise<PedidoCriado | null>;
  criarItensPedido(pedidoId: string, linhas: LinhaPedidoInput[]): Promise<boolean>;
  buscarLojaParaPagamento(lojaId: string): Promise<LojaResumoPagamento | null>;
  atualizarChargeId(pedidoId: string, chargeId: string): Promise<void>;
  buscarStatusAtual(pedidoId: string): Promise<StatusPedido | null>;
  atualizarStatus(pedidoId: string, status: StatusPedido): Promise<void>;
  confirmarPagamentoPix(chargeId: string): Promise<boolean>;
}
