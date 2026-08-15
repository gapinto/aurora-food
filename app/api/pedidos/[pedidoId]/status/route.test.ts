import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pedidos/supabase-repository", () => ({
  supabasePedidosRepository: {
    buscarStatusAtual: vi.fn(),
    atualizarStatus: vi.fn(),
  },
}));

function patchRequest(status: string): Request {
  return new Request("http://localhost/api/pedidos/pedido-1/status", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

describe("PATCH /api/pedidos/[pedidoId]/status", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("404 quando o pedido não existe", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarStatusAtual).mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest("pago"), { params: Promise.resolve({ pedidoId: "x" }) });

    expect(response.status).toBe(404);
  });

  it("422 numa transição inválida", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarStatusAtual).mockResolvedValue("pago");

    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest("retirado"), {
      params: Promise.resolve({ pedidoId: "pedido-1" }),
    });

    expect(response.status).toBe(422);
  });

  it("200 e persiste a transição quando é válida", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarStatusAtual).mockResolvedValue("pago");

    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest("preparando"), {
      params: Promise.resolve({ pedidoId: "pedido-1" }),
    });

    expect(response.status).toBe(200);
    expect(supabasePedidosRepository.atualizarStatus).toHaveBeenCalledWith("pedido-1", "preparando");
  });
});
