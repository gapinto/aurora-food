export interface CriarSubcontaInput {
  nome: string;
  cnpj: string;
  email: string;
}

export interface CriarSubcontaResultado {
  walletId: string;
  apiKey: string;
}

export interface CriarCobrancaPixInput {
  walletId: string;
  valor: number;
  comissaoPercentual: number;
  descricao: string;
  pedidoId: string;
}

export interface CriarCobrancaPixResultado {
  chargeId: string;
  qrCodePayload: string;
  qrCodeImageBase64: string;
}

// Programado contra interface: as rotas de API e os casos de uso em
// lib/pedidos/lib/lojas dependem só disso, nunca de app/api chamando o
// Asaas direto — permite trocar por um provider fake em teste sem tocar
// rede (ver lib/pedidos/criar-pedido.test.ts).
export interface PagamentoProvider {
  criarSubconta(input: CriarSubcontaInput): Promise<CriarSubcontaResultado>;
  criarCobrancaPix(input: CriarCobrancaPixInput): Promise<CriarCobrancaPixResultado>;
}
