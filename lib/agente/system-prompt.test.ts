import { describe, expect, it } from "vitest";

import type { Item } from "@/lib/types/database";

import { buildSystemPrompt } from "./system-prompt";

const item: Item = {
  id: "item-1",
  loja_id: "loja-1",
  categoria: "Lanches",
  nome: "X-Salada",
  preco: 24.9,
  foto_url: "https://exemplo.com/foto.jpg",
  ncm: "2106.90.90",
  disponivel: true,
  preco_atualizado_em: "2026-08-01T00:00:00.000Z",
};

describe("buildSystemPrompt", () => {
  it("inclui o nome da loja", () => {
    expect(buildSystemPrompt("Aurora Burger", [])).toContain("Aurora Burger");
  });

  it("injeta o cardápio inteiro como JSON, sem RAG (spec seção 5)", () => {
    const prompt = buildSystemPrompt("Aurora Burger", [item]);
    const cardapio = JSON.parse(prompt.split("Cardápio (JSON):\n")[1]);

    expect(cardapio).toEqual([
      { id: "item-1", categoria: "Lanches", nome: "X-Salada", preco: 24.9, disponivel: true },
    ]);
  });

  it("não vaza campos internos do item (foto_url, ncm) no prompt", () => {
    const prompt = buildSystemPrompt("Aurora Burger", [item]);
    expect(prompt).not.toContain("foto_url");
    expect(prompt).not.toContain("2106.90.90");
  });

  it("mantém as regras de tom da spec seção 5", () => {
    const prompt = buildSystemPrompt("Aurora Burger", []);
    expect(prompt).toContain("Respostas curtas");
    expect(prompt).toContain('Sem abertura padronizada ("Claro!", "Perfeito!")');
  });
});
