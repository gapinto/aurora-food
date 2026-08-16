import type { AutorizacaoRepository } from "./repository";

export interface ExigirAcessoLojaDeps {
  autorizacao: AutorizacaoRepository;
}

export type AcessoLojaResultado =
  | { ok: true; userId: string }
  | { ok: false; erro: string; codigo: 401 | 403 };

// Caso de uso puro (mesmo padrão de lib/pedidos/*.ts): recebe a dependência
// por interface, testável com fake em memória. Usado tanto pelas rotas de
// API quanto pelas páginas de painel antes de qualquer ação que só faça
// sentido pra dono/operador da loja (nunca pro cliente).
export async function exigirAcessoALoja(
  lojaId: string,
  deps: ExigirAcessoLojaDeps,
): Promise<AcessoLojaResultado> {
  const userId = await deps.autorizacao.usuarioAutenticadoId();
  if (!userId) {
    return { ok: false, erro: "não autenticado", codigo: 401 };
  }

  const pertence = await deps.autorizacao.usuarioPertenceALoja(userId, lojaId);
  if (!pertence) {
    return { ok: false, erro: "sem acesso a essa loja", codigo: 403 };
  }

  return { ok: true, userId };
}
