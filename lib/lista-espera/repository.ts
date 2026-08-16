export interface InscreverInput {
  nome: string;
  email: string;
  nomeRestaurante?: string;
}

export type InscreverResultado = "inscrito" | "ja_inscrito" | "erro";

// Programado contra interface, mesmo padrão de lib/pedidos/. Fake em
// memória em test/fakes/lista-espera-repository.fake.ts.
export interface ListaEsperaRepository {
  inscrever(input: InscreverInput): Promise<InscreverResultado>;
}
