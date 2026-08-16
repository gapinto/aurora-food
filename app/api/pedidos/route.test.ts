import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pedidos/supabase-repository", () => ({
  supabasePedidosRepository: {
    criarPedido: vi.fn(),
    criarItensPedido: vi.fn(),
    buscarItensDisponiveis: vi.fn(),
    buscarLojaParaPagamento: vi.fn(),
    atualizarChargeId: vi.fn(),
  },
}));

vi.mock("@/lib/asaas/provider", () => ({
  asaasPagamentoProvider: {
    criarCobrancaPix: vi.fn(),
  },
}));

function requestComBody(body: unknown): Request {
  return new Request("http://localhost/api/pedidos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/pedidos", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("400 quando o payload é inválido", async () => {
    const { POST } = await import("./route");
    const response = await POST(requestComBody({ lojaId: "", linhas: [], formaPagamento: "caixa" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "payload inválido" });
  });

  it("400 quando o item enviado não existe no catálogo real da loja (price tampering / item forjado)", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarItensDisponiveis).mockResolvedValue([]);

    const { POST } = await import("./route");
    const response = await POST(
      requestComBody({
        lojaId: "loja-1",
        linhas: [{ itemId: "item-1", quantidade: 1, preco: 0.01 }],
        formaPagamento: "caixa",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "item item-1 indisponível" });
    expect(supabasePedidosRepository.criarPedido).not.toHaveBeenCalled();
  });

  it("200 com pedidoId e senha quando o pedido é criado, usando o preço real do catálogo", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarItensDisponiveis).mockResolvedValue([
      { id: "item-1", preco: 10 },
    ]);
    vi.mocked(supabasePedidosRepository.criarPedido).mockResolvedValue({ id: "pedido-1", senha: "555" });
    vi.mocked(supabasePedidosRepository.criarItensPedido).mockResolvedValue(true);

    const { POST } = await import("./route");
    const response = await POST(
      requestComBody({
        lojaId: "loja-1",
        linhas: [{ itemId: "item-1", quantidade: 1 }],
        formaPagamento: "caixa",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ pedidoId: "pedido-1", senha: "555" });
    expect(supabasePedidosRepository.criarPedido).toHaveBeenCalledWith(
      expect.objectContaining({ valorTotal: 10 }),
    );
  });
});
