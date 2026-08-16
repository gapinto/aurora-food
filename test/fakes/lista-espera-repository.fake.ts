import type {
  InscreverInput,
  InscreverResultado,
  ListaEsperaRepository,
} from "@/lib/lista-espera/repository";

export function criarListaEsperaRepositoryFake(options?: { falhar?: boolean }) {
  const inscritos: InscreverInput[] = [];
  const emails = new Set<string>();

  const repositorio: ListaEsperaRepository = {
    async inscrever(input: InscreverInput): Promise<InscreverResultado> {
      if (options?.falhar) return "erro";
      if (emails.has(input.email)) return "ja_inscrito";
      emails.add(input.email);
      inscritos.push(input);
      return "inscrito";
    },
  };

  return { repositorio, inscritos };
}
