import { beforeEach, describe, expect, it, vi } from "vitest";

import { asaasMockProvider } from "./mock-client";

describe("asaasMockProvider", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("criarSubconta retorna walletId e apiKey plausíveis, claramente marcados como mock", async () => {
    const resultado = await asaasMockProvider.criarSubconta({
      nome: "Loja Teste",
      cnpj: "00.000.000/0001-00",
      email: "dono@exemplo.com",
    });

    expect(resultado.walletId).toMatch(/^mock-wallet-/);
    expect(resultado.apiKey).toMatch(/^\$aact_mock_/);
  });

  it("criarCobrancaPix retorna chargeId único e payload no formato Pix (prefixo EMV)", async () => {
    const resultado = await asaasMockProvider.criarCobrancaPix({
      walletId: "mock-wallet-x",
      valor: 24.9,
      comissaoPercentual: 1.5,
      descricao: "Pedido Aurora Food #123",
      pedidoId: "pedido-1",
    });

    expect(resultado.chargeId).toMatch(/^mock-pay-/);
    expect(resultado.qrCodePayload).toContain(resultado.chargeId);
    expect(resultado.qrCodePayload.startsWith("00020126")).toBe(true);
  });

  it("gera chargeId diferente a cada chamada", async () => {
    const a = await asaasMockProvider.criarCobrancaPix({
      walletId: "w",
      valor: 1,
      comissaoPercentual: 1,
      descricao: "a",
      pedidoId: "p1",
    });
    const b = await asaasMockProvider.criarCobrancaPix({
      walletId: "w",
      valor: 1,
      comissaoPercentual: 1,
      descricao: "a",
      pedidoId: "p2",
    });

    expect(a.chargeId).not.toBe(b.chargeId);
  });
});
