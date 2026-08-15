import type { LojaCriada, LojasRepository } from "@/lib/lojas/repository";

export function criarLojasRepositoryFake(options?: { falharAoCriarLoja?: boolean }) {
  const lojas = new Map<string, LojaCriada & { walletId: string | null }>();
  let proximoId = 1;

  const repositorio: LojasRepository = {
    async criarLoja(): Promise<LojaCriada | null> {
      if (options?.falharAoCriarLoja) return null;
      const id = `loja-${proximoId++}`;
      const loja = { id, nome: "", walletId: null };
      lojas.set(id, loja);
      return { id, nome: loja.nome };
    },

    async atualizarWalletId(lojaId: string, walletId: string): Promise<void> {
      const loja = lojas.get(lojaId);
      if (loja) loja.walletId = walletId;
    },
  };

  return { repositorio, lojas };
}
