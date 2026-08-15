import { describe, expect, it } from "vitest";

import { calcularTotalCarrinho, contarItensCarrinho } from "./calculos";

describe("calcularTotalCarrinho", () => {
  it("soma preço × quantidade de cada linha", () => {
    const total = calcularTotalCarrinho([
      { preco: 24.9, quantidade: 2 },
      { preco: 9.5, quantidade: 1 },
    ]);
    expect(total).toBeCloseTo(59.3);
  });

  it("retorna 0 para carrinho vazio", () => {
    expect(calcularTotalCarrinho([])).toBe(0);
  });
});

describe("contarItensCarrinho", () => {
  it("soma as quantidades, não a quantidade de linhas distintas", () => {
    const total = contarItensCarrinho([
      { preco: 10, quantidade: 3 },
      { preco: 5, quantidade: 2 },
    ]);
    expect(total).toBe(5);
  });

  it("retorna 0 para carrinho vazio", () => {
    expect(contarItensCarrinho([])).toBe(0);
  });
});
