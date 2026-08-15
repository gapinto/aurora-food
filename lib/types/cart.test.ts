import { beforeEach, describe, expect, it } from "vitest";

import { lerCarrinho, salvarCarrinho } from "./cart";

describe("carrinho em sessionStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("retorna null quando não há carrinho salvo", () => {
    expect(lerCarrinho()).toBeNull();
  });

  it("recupera exatamente o que foi salvo", () => {
    salvarCarrinho({
      lojaSlug: "loja-1",
      linhas: [{ itemId: "item-1", nome: "X-Salada", preco: 24.9, quantidade: 2 }],
    });

    expect(lerCarrinho()).toEqual({
      lojaSlug: "loja-1",
      linhas: [{ itemId: "item-1", nome: "X-Salada", preco: 24.9, quantidade: 2 }],
    });
  });

  it("retorna a mesma referência em leituras repetidas sem mudança (guarda pra useSyncExternalStore)", () => {
    salvarCarrinho({ lojaSlug: "loja-1", linhas: [] });

    const primeira = lerCarrinho();
    const segunda = lerCarrinho();

    expect(primeira).toBe(segunda);
  });

  it("invalida o cache quando o conteúdo muda", () => {
    salvarCarrinho({ lojaSlug: "loja-1", linhas: [] });
    const primeira = lerCarrinho();

    salvarCarrinho({ lojaSlug: "loja-1", linhas: [{ itemId: "a", nome: "A", preco: 1, quantidade: 1 }] });
    const segunda = lerCarrinho();

    expect(segunda).not.toBe(primeira);
    expect(segunda?.linhas).toHaveLength(1);
  });

  it("retorna null se o conteúdo salvo não for JSON válido", () => {
    sessionStorage.setItem("aurora-food:carrinho", "não é json");
    expect(lerCarrinho()).toBeNull();
  });
});
