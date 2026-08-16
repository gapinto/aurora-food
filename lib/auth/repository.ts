// Programado contra interface, mesmo padrão de lib/pedidos/repository.ts —
// os casos de uso (ex.: exigirAcessoALoja) nunca falam com Supabase Auth
// direto, só com este contrato. Fake em memória em test/fakes/ pros testes.
export interface AutorizacaoRepository {
  // null quando não há sessão autenticada (cookie ausente/expirado).
  usuarioAutenticadoId(): Promise<string | null>;
  usuarioPertenceALoja(userId: string, lojaId: string): Promise<boolean>;
}
