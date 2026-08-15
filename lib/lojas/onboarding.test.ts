import { describe, expect, it } from "vitest";

import { criarLojasRepositoryFake } from "@/test/fakes/lojas-repository.fake";
import { criarPagamentoProviderFake } from "@/test/fakes/pagamento-provider.fake";

import { iniciarOnboarding } from "./onboarding";

describe("iniciarOnboarding", () => {
  it("rejeita payload sem cnpj ou email", async () => {
    const { repositorio } = criarLojasRepositoryFake();
    const { provider } = criarPagamentoProviderFake();

    const resultado = await iniciarOnboarding(
      { cnpj: "", email: "dono@exemplo.com" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "cnpj e email são obrigatórios" });
  });

  it("cria a loja e a subconta Asaas, salvando o wallet id", async () => {
    const { repositorio, lojas } = criarLojasRepositoryFake();
    const { provider, subcontasCriadas } = criarPagamentoProviderFake({ walletIdGerado: "wallet-nova" });

    const resultado = await iniciarOnboarding(
      { cnpj: "00.000.000/0001-00", email: "dono@exemplo.com" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: true, lojaId: "loja-1" });
    expect(lojas.get("loja-1")?.walletId).toBe("wallet-nova");
    expect(subcontasCriadas).toEqual([
      { nome: "", cnpj: "00.000.000/0001-00", email: "dono@exemplo.com" },
    ]);
  });

  it("mantém a loja criada mesmo se a criação da subconta Asaas falhar", async () => {
    const { repositorio, lojas } = criarLojasRepositoryFake();
    const { provider } = criarPagamentoProviderFake();
    provider.criarSubconta = async () => {
      throw new Error("Asaas fora do ar");
    };

    const resultado = await iniciarOnboarding(
      { cnpj: "00.000.000/0001-00", email: "dono@exemplo.com" },
      { repositorio, pagamento: provider },
    );

    expect(resultado.ok).toBe(true);
    expect(lojas.get("loja-1")?.walletId).toBeNull();
  });

  it("propaga falha quando o repositório não consegue criar a loja", async () => {
    const { repositorio } = criarLojasRepositoryFake({ falharAoCriarLoja: true });
    const { provider } = criarPagamentoProviderFake();

    const resultado = await iniciarOnboarding(
      { cnpj: "00.000.000/0001-00", email: "dono@exemplo.com" },
      { repositorio, pagamento: provider },
    );

    expect(resultado).toEqual({ ok: false, erro: "não foi possível iniciar o onboarding" });
  });
});
