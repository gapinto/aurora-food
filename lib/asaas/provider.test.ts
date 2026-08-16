import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("asaasMockAtivo / asaasPagamentoProvider", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("false / provider http quando NEXT_PUBLIC_ASAAS_MOCK não é 'true'", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASAAS_MOCK", "");
    const { asaasMockAtivo, asaasPagamentoProvider } = await import("./provider");
    const { asaasHttpProvider } = await import("./client");

    expect(asaasMockAtivo()).toBe(false);
    expect(asaasPagamentoProvider).toBe(asaasHttpProvider);
  });

  it("true / provider mock quando NEXT_PUBLIC_ASAAS_MOCK=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASAAS_MOCK", "true");
    const { asaasMockAtivo, asaasPagamentoProvider } = await import("./provider");
    const { asaasMockProvider } = await import("./mock-client");

    expect(asaasMockAtivo()).toBe(true);
    expect(asaasPagamentoProvider).toBe(asaasMockProvider);
  });
});
