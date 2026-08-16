import { redirect } from "next/navigation";

import { exigirAcessoALoja } from "./exigir-acesso-loja";
import type { AutorizacaoRepository } from "./repository";
import { supabaseAutorizacaoRepository } from "./supabase-repository";

export type ProtecaoPainelResultado = { autorizado: true } | { autorizado: false };

export interface ExigirAcessoAoPainelDeps {
  autorizacao: AutorizacaoRepository;
}

// Helper compartilhado pelas páginas de painel (cozinha, caixa) — sem
// sessão, manda pro login (com `next` pra voltar depois de autenticar);
// autenticado mas sem acesso a essa loja específica, deixa a página
// decidir o que renderizar (normalmente uma mensagem, não outro redirect —
// mandar de volta pro login não ajudaria nesse caso).
export async function exigirAcessoAoPainel(
  lojaId: string,
  caminhoAtual: string,
  deps: ExigirAcessoAoPainelDeps = { autorizacao: supabaseAutorizacaoRepository },
): Promise<ProtecaoPainelResultado> {
  const acesso = await exigirAcessoALoja(lojaId, deps);
  if (acesso.ok) return { autorizado: true };

  if (acesso.codigo === 401) {
    redirect(`/login?next=${encodeURIComponent(caminhoAtual)}`);
  }

  return { autorizado: false };
}
