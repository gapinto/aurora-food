import { describe, expect, it } from "vitest";

import { criarListaEsperaRepositoryFake } from "@/test/fakes/lista-espera-repository.fake";

import { inscreverListaEspera } from "./inscrever-lista-espera";

describe("inscreverListaEspera", () => {
  it("rejeita sem nome", async () => {
    const { repositorio } = criarListaEsperaRepositoryFake();

    const resultado = await inscreverListaEspera(
      { nome: "  ", email: "dono@exemplo.com" },
      { repositorio },
    );

    expect(resultado).toEqual({ ok: false, erro: "nome e e-mail são obrigatórios" });
  });

  it("rejeita e-mail inválido", async () => {
    const { repositorio } = criarListaEsperaRepositoryFake();

    const resultado = await inscreverListaEspera(
      { nome: "Dono", email: "não-é-email" },
      { repositorio },
    );

    expect(resultado).toEqual({ ok: false, erro: "e-mail inválido" });
  });

  it("inscreve com nome do restaurante opcional", async () => {
    const { repositorio, inscritos } = criarListaEsperaRepositoryFake();

    const resultado = await inscreverListaEspera(
      { nome: "Dono", email: "dono@exemplo.com" },
      { repositorio },
    );

    expect(resultado).toEqual({ ok: true, jaInscrito: false });
    expect(inscritos).toEqual([{ nome: "Dono", email: "dono@exemplo.com", nomeRestaurante: undefined }]);
  });

  it("normaliza e-mail pra minúsculas antes de checar duplicidade", async () => {
    const { repositorio } = criarListaEsperaRepositoryFake();

    await inscreverListaEspera({ nome: "Dono", email: "Dono@Exemplo.com" }, { repositorio });
    const segunda = await inscreverListaEspera(
      { nome: "Dono de novo", email: "dono@exemplo.com" },
      { repositorio },
    );

    expect(segunda).toEqual({ ok: true, jaInscrito: true });
  });

  it("trata e-mail já inscrito como sucesso idempotente, não erro", async () => {
    const { repositorio } = criarListaEsperaRepositoryFake();

    await inscreverListaEspera({ nome: "Dono", email: "dono@exemplo.com" }, { repositorio });
    const resultado = await inscreverListaEspera(
      { nome: "Dono", email: "dono@exemplo.com" },
      { repositorio },
    );

    expect(resultado).toEqual({ ok: true, jaInscrito: true });
  });

  it("propaga falha do repositório", async () => {
    const { repositorio } = criarListaEsperaRepositoryFake({ falhar: true });

    const resultado = await inscreverListaEspera(
      { nome: "Dono", email: "dono@exemplo.com" },
      { repositorio },
    );

    expect(resultado).toEqual({ ok: false, erro: "não foi possível concluir a inscrição" });
  });
});
