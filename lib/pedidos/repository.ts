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

export interface ItemDisponivel {
  id: string;
  preco: number;
}

// Programado contra interface: os casos de uso em lib/pedidos/*.ts (a
// lógica de negócio testada em TDD) nunca falam com o Supabase direto —
// só com este contrato. Em teste, um fake em memória implementa a mesma
// interface (ver lib/pedidos/criar-pedido.test.ts); em produção,
// supabase-repository.ts.
export interface PedidosRepository {
  criarPedido(input: NovoPedidoInput): Promise<PedidoCriado | null>;
  criarItensPedido(pedidoId: string, linhas: LinhaPedidoInput[]): Promise<boolean>;
  // Preço vem sempre daqui, nunca do client — ver achado de segurança
  // "price tampering" na revisão OWASP (CLAUDE.md, seção Backlog).
  buscarItensDisponiveis(lojaId: string, itemIds: string[]): Promise<ItemDisponivel[]>;
  buscarLojaParaPagamento(lojaId: string): Promise<LojaResumoPagamento | null>;
  atualizarChargeId(pedidoId: string, chargeId: string): Promise<void>;
  // Usado pra autorização (exigirAcessoALoja) antes de aceitar uma mudança
  // de status — ver app/api/pedidos/[pedidoId]/status/route.ts.
  buscarLojaDoPedido(pedidoId: string): Promise<string | null>;
  // Usado só pela rota dev de simulação de pagamento (modo mock do Asaas) —
  // ver app/api/dev/simular-pagamento-pix/route.ts.
  buscarChargeIdDoPedido(pedidoId: string): Promise<string | null>;
  buscarStatusAtual(pedidoId: string): Promise<StatusPedido | null>;
  atualizarStatus(pedidoId: string, status: StatusPedido): Promise<void>;
  confirmarPagamentoPix(chargeId: string): Promise<boolean>;
}
