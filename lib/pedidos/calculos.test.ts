import { describe, expect, it } from "vitest";

import { calcularValorTotal, gerarSenha } from "./calculos";

describe("calcularValorTotal", () => {
  it("soma preço × quantidade das linhas do pedido", () => {
    expect(calcularValorTotal([{ preco: 28.9, quantidade: 2 }])).toBeCloseTo(57.8);
  });
});

describe("gerarSenha", () => {
  it("gera um número de 3 dígitos entre 100 e 999", () => {
    for (let i = 0; i < 50; i++) {
      const senha = gerarSenha();
      expect(senha).toMatch(/^\d{3}$/);
      expect(Number(senha)).toBeGreaterThanOrEqual(100);
      expect(Number(senha)).toBeLessThanOrEqual(999);
    }
  });

  it("é determinística quando a fonte aleatória é injetada", () => {
    expect(gerarSenha(() => 0)).toBe("100");
    expect(gerarSenha(() => 0.999)).toBe("999");
  });
});
