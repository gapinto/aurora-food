import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pedidos/supabase-repository", () => ({
  supabasePedidosRepository: {
    buscarChargeIdDoPedido: vi.fn(),
    confirmarPagamentoPix: vi.fn(),
  },
}));

function requestComBody(body: unknown): Request {
  return new Request("http://localhost/api/dev/simular-pagamento-pix", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/dev/simular-pagamento-pix", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("404 fora do modo mock — nunca pode existir jeito de confirmar pagamento sem o token do Asaas em produção", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASAAS_MOCK", "");

    const { POST } = await import("./route");
    const response = await POST(requestComBody({ pedidoId: "pedido-1" }));

    expect(response.status).toBe(404);
  });

  it("400 sem pedidoId, mesmo em modo mock", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASAAS_MOCK", "true");

    const { POST } = await import("./route");
    const response = await POST(requestComBody({}));

    expect(response.status).toBe(400);
  });

  it("404 quando o pedido não tem cobrança Pix associada", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASAAS_MOCK", "true");
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarChargeIdDoPedido).mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(requestComBody({ pedidoId: "pedido-1" }));

    expect(response.status).toBe(404);
    expect(supabasePedidosRepository.confirmarPagamentoPix).not.toHaveBeenCalled();
  });

  it("200 e confirma o pagamento via o mesmo caso de uso do webhook real", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASAAS_MOCK", "true");
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarChargeIdDoPedido).mockResolvedValue("charge-abc");
    vi.mocked(supabasePedidosRepository.confirmarPagamentoPix).mockResolvedValue(true);

    const { POST } = await import("./route");
    const response = await POST(requestComBody({ pedidoId: "pedido-1" }));

    expect(response.status).toBe(200);
    expect(supabasePedidosRepository.confirmarPagamentoPix).toHaveBeenCalledWith("charge-abc");
  });
});
