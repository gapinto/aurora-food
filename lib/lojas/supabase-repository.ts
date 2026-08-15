import { createServiceRoleClient } from "@/lib/supabase/server";

import type { CriarLojaInput, LojaCriada, LojasRepository } from "./repository";

export const supabaseLojasRepository: LojasRepository = {
  async criarLoja(input: CriarLojaInput): Promise<LojaCriada | null> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("lojas")
      .insert({ cnpj: input.cnpj, nome: "", regime_fiscal: "simples_nacional" })
      .select()
      .single();

    if (error || !data) return null;
    return { id: data.id, nome: data.nome };
  },

  async atualizarWalletId(lojaId: string, walletId: string): Promise<void> {
    const supabase = createServiceRoleClient();
    await supabase.from("lojas").update({ asaas_wallet_id: walletId }).eq("id", lojaId);
  },
};
