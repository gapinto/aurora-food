import { beforeEach, describe, expect, it, vi } from "vitest";

import { criarAutorizacaoRepositoryFake } from "@/test/fakes/autorizacao-repository.fake";

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({ redirect }));

describe("exigirAcessoAoPainel", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it("autorizado quando o usuário pertence à loja", async () => {
    const { exigirAcessoAoPainel } = await import("./proteger-pagina-painel");
    const { repositorio } = criarAutorizacaoRepositoryFake({
      usuarioAutenticado: "user-1",
      lojasDoUsuario: ["loja-1"],
    });

    const resultado = await exigirAcessoAoPainel("loja-1", "/cozinha/loja-1", {
      autorizacao: repositorio,
    });

    expect(resultado).toEqual({ autorizado: true });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("manda pro login (com next) quando não há sessão", async () => {
    const { exigirAcessoAoPainel } = await import("./proteger-pagina-painel");
    const { repositorio } = criarAutorizacaoRepositoryFake({ usuarioAutenticado: null });

    await expect(
      exigirAcessoAoPainel("loja-1", "/cozinha/loja-1", { autorizacao: repositorio }),
    ).rejects.toThrow("REDIRECT:/login?next=%2Fcozinha%2Floja-1");
  });

  it("não redireciona (deixa a página decidir) quando autenticado mas sem acesso à loja", async () => {
    const { exigirAcessoAoPainel } = await import("./proteger-pagina-painel");
    const { repositorio } = criarAutorizacaoRepositoryFake({
      usuarioAutenticado: "user-1",
      lojasDoUsuario: ["loja-2"],
    });

    const resultado = await exigirAcessoAoPainel("loja-1", "/cozinha/loja-1", {
      autorizacao: repositorio,
    });

    expect(resultado).toEqual({ autorizado: false });
    expect(redirect).not.toHaveBeenCalled();
  });
});
