import type { ListaEsperaRepository } from "./repository";

export interface InscreverListaEsperaInput {
  nome: string;
  email: string;
  nomeRestaurante?: string;
}

export interface InscreverListaEsperaDeps {
  repositorio: ListaEsperaRepository;
}

export type InscreverListaEsperaResultado =
  | { ok: true; jaInscrito: boolean }
  | { ok: false; erro: string };

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Caso de uso puro (mesmo padrão de lib/pedidos/*.ts): formulário público
// da landing (playbook Nubank de early access por convite) — sem exigir
// nada além de nome/e-mail, nome do restaurante é opcional pra não
// derrubar a taxa de conversão do formulário.
export async function inscreverListaEspera(
  input: InscreverListaEsperaInput,
  deps: InscreverListaEsperaDeps,
): Promise<InscreverListaEsperaResultado> {
  const nome = input.nome?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!nome || !email) {
    return { ok: false, erro: "nome e e-mail são obrigatórios" };
  }
  if (!EMAIL_VALIDO.test(email)) {
    return { ok: false, erro: "e-mail inválido" };
  }

  const nomeRestaurante = input.nomeRestaurante?.trim();
  const resultado = await deps.repositorio.inscrever({
    nome,
    email,
    nomeRestaurante: nomeRestaurante || undefined,
  });

  if (resultado === "erro") {
    return { ok: false, erro: "não foi possível concluir a inscrição" };
  }

  return { ok: true, jaInscrito: resultado === "ja_inscrito" };
}
