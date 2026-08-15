import { describe, expect, it } from "vitest";

import { transicaoValida } from "./status";

describe("transicaoValida", () => {
  it.each([
    ["aguardando_pagamento_pix", "pago"],
    ["aguardando_pagamento_caixa", "pago"],
    ["pago", "preparando"],
    ["preparando", "pronto"],
    ["pronto", "retirado"],
  ] as const)("permite %s → %s", (atual, proximo) => {
    expect(transicaoValida(atual, proximo)).toBe(true);
  });

  it.each([
    ["aguardando_pagamento_pix", "preparando"],
    ["pago", "pronto"],
    ["retirado", "pago"],
    ["pronto", "preparando"],
  ] as const)("bloqueia %s → %s (pula etapa ou anda pra trás)", (atual, proximo) => {
    expect(transicaoValida(atual, proximo)).toBe(false);
  });

  it("retirado é estado terminal — nenhuma transição sai dele", () => {
    expect(transicaoValida("retirado", "pago")).toBe(false);
    expect(transicaoValida("retirado", "preparando")).toBe(false);
  });
});
