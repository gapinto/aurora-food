import { describe, expect, it } from "vitest";

import { criarAutorizacaoRepositoryFake } from "@/test/fakes/autorizacao-repository.fake";

import { exigirAcessoALoja } from "./exigir-acesso-loja";

describe("exigirAcessoALoja", () => {
  it("401 quando não há usuário autenticado", async () => {
    const { repositorio } = criarAutorizacaoRepositoryFake({ usuarioAutenticado: null });

    const resultado = await exigirAcessoALoja("loja-1", { autorizacao: repositorio });

    expect(resultado).toEqual({ ok: false, erro: "não autenticado", codigo: 401 });
  });

  it("403 quando o usuário está autenticado mas não pertence à loja", async () => {
    const { repositorio } = criarAutorizacaoRepositoryFake({
      usuarioAutenticado: "user-1",
      lojasDoUsuario: ["loja-2"],
    });

    const resultado = await exigirAcessoALoja("loja-1", { autorizacao: repositorio });

    expect(resultado).toEqual({ ok: false, erro: "sem acesso a essa loja", codigo: 403 });
  });

  it("ok quando o usuário pertence à loja", async () => {
    const { repositorio } = criarAutorizacaoRepositoryFake({
      usuarioAutenticado: "user-1",
      lojasDoUsuario: ["loja-1", "loja-2"],
    });

    const resultado = await exigirAcessoALoja("loja-1", { autorizacao: repositorio });

    expect(resultado).toEqual({ ok: true, userId: "user-1" });
  });
});
