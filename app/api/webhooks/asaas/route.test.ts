import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pedidos/supabase-repository", () => ({
  supabasePedidosRepository: {
    confirmarPagamentoPix: vi.fn(),
  },
}));

function requestComToken(token: string | null): Request {
  const headers = new Headers();
  if (token !== null) headers.set("asaas-access-token", token);
  return new Request("http://localhost/api/webhooks/asaas", {
    method: "POST",
    headers,
    body: JSON.stringify({ event: "PAYMENT_RECEIVED", payment: { id: "charge-1" } }),
  });
}

describe("POST /api/webhooks/asaas — autenticação", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("500 (fail closed) quando ASAAS_WEBHOOK_TOKEN não está configurada — não aceita a request sem token", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "");

    const { POST } = await import("./route");
    const response = await POST(requestComToken(null));

    expect(response.status).toBe(500);
  });

  it("401 quando o token recebido não bate com o configurado", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "token-correto");

    const { POST } = await import("./route");
    const response = await POST(requestComToken("token-errado"));

    expect(response.status).toBe(401);
  });

  it("401 quando nenhum token é enviado, mas um está configurado", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "token-correto");

    const { POST } = await import("./route");
    const response = await POST(requestComToken(null));

    expect(response.status).toBe(401);
  });

  it("processa o evento quando o token bate", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "token-correto");
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.confirmarPagamentoPix).mockResolvedValue(true);

    const { POST } = await import("./route");
    const response = await POST(requestComToken("token-correto"));

    expect(response.status).toBe(200);
    expect(supabasePedidosRepository.confirmarPagamentoPix).toHaveBeenCalledWith("charge-1");
  });
});
