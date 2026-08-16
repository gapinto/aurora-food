import type { AutorizacaoRepository } from "@/lib/auth/repository";

export function criarAutorizacaoRepositoryFake(options?: {
  usuarioAutenticado?: string | null;
  lojasDoUsuario?: string[];
}) {
  const repositorio: AutorizacaoRepository = {
    async usuarioAutenticadoId(): Promise<string | null> {
      return options?.usuarioAutenticado ?? null;
    },

    async usuarioPertenceALoja(userId: string, lojaId: string): Promise<boolean> {
      if (userId !== options?.usuarioAutenticado) return false;
      return (options?.lojasDoUsuario ?? []).includes(lojaId);
    },
  };

  return { repositorio };
}
