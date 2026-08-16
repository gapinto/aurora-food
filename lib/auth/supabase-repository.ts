import { createClient } from "@/lib/supabase/server";

import type { AutorizacaoRepository } from "./repository";

// Usa o client RLS-aware (cookies da sessão), não a service role — a
// própria policy "usuario_ve_suas_proprias_associacoes" de
// supabase/migrations/0002_loja_usuarios.sql já restringe a leitura ao
// usuário autenticado, então nem precisa filtrar user_id explicitamente
// além do que a query já faz.
export const supabaseAutorizacaoRepository: AutorizacaoRepository = {
  async usuarioAutenticadoId(): Promise<string | null> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  },

  async usuarioPertenceALoja(userId: string, lojaId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("loja_usuarios")
      .select("loja_id")
      .eq("user_id", userId)
      .eq("loja_id", lojaId)
      .maybeSingle();

    return data !== null;
  },
};
