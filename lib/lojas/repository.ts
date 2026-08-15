export interface CriarLojaInput {
  cnpj: string;
}

export interface LojaCriada {
  id: string;
  nome: string;
}

export interface LojasRepository {
  criarLoja(input: CriarLojaInput): Promise<LojaCriada | null>;
  atualizarWalletId(lojaId: string, walletId: string): Promise<void>;
}
