import type { PagamentoProvider } from "@/lib/asaas/types";

import type { LojasRepository } from "./repository";

export interface IniciarOnboardingInput {
  cnpj: string;
  email: string;
}

export interface IniciarOnboardingDeps {
  repositorio: LojasRepository;
  pagamento: PagamentoProvider;
}

export type IniciarOnboardingResultado =
  | { ok: true; lojaId: string }
  | { ok: false; erro: string };

// Função serverless assíncrona do onboarding via IA (spec seção 4):
// CNPJ → Receita Federal → cardápio importado → subconta Asaas → QR code.
// Aqui só o passo "criar subconta" está implementado; os demais (consulta
// à Receita, import de cardápio, sugestão de NCM) entram na Fase 1/2 e
// sempre passam por confirmação humana antes de aplicar qualquer dado.
export async function iniciarOnboarding(
  input: IniciarOnboardingInput,
  deps: IniciarOnboardingDeps,
): Promise<IniciarOnboardingResultado> {
  if (!input.cnpj || !input.email) {
    return { ok: false, erro: "cnpj e email são obrigatórios" };
  }

  const loja = await deps.repositorio.criarLoja({ cnpj: input.cnpj });
  if (!loja) {
    return { ok: false, erro: "não foi possível iniciar o onboarding" };
  }

  try {
    const subconta = await deps.pagamento.criarSubconta({
      nome: loja.nome,
      cnpj: input.cnpj,
      email: input.email,
    });
    await deps.repositorio.atualizarWalletId(loja.id, subconta.walletId);
  } catch {
    // Subconta pode ser criada depois manualmente — onboarding não trava aqui.
  }

  return { ok: true, lojaId: loja.id };
}
