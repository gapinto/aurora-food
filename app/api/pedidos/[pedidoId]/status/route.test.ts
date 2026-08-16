import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pedidos/supabase-repository", () => ({
  supabasePedidosRepository: {
    buscarLojaDoPedido: vi.fn(),
    buscarStatusAtual: vi.fn(),
    atualizarStatus: vi.fn(),
  },
}));

vi.mock("@/lib/auth/supabase-repository", () => ({
  supabaseAutorizacaoRepository: {
    usuarioAutenticadoId: vi.fn(),
    usuarioPertenceALoja: vi.fn(),
  },
}));

function patchRequest(status: string): Request {
  return new Request("http://localhost/api/pedidos/pedido-1/status", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Todo teste que passa da checagem de acesso precisa desse setup — só o
// teste de "não autenticado"/"sem acesso" mexe nele de propósito.
async function autorizarComoOperadorDaLoja(lojaId: string) {
  const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
  const { supabaseAutorizacaoRepository } = await import("@/lib/auth/supabase-repository");
  vi.mocked(supabasePedidosRepository.buscarLojaDoPedido).mockResolvedValue(lojaId);
  vi.mocked(supabaseAutorizacaoRepository.usuarioAutenticadoId).mockResolvedValue("user-1");
  vi.mocked(supabaseAutorizacaoRepository.usuarioPertenceALoja).mockResolvedValue(true);
}

describe("PATCH /api/pedidos/[pedidoId]/status", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("404 quando o pedido não existe (nem chega a checar autorização)", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarLojaDoPedido).mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest("pago"), { params: Promise.resolve({ pedidoId: "x" }) });

    expect(response.status).toBe(404);
  });

  it("401 quando não há usuário autenticado — acesso trivial ao PATCH do próprio cliente é o achado de segurança corrigido aqui", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    const { supabaseAutorizacaoRepository } = await import("@/lib/auth/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarLojaDoPedido).mockResolvedValue("loja-1");
    vi.mocked(supabaseAutorizacaoRepository.usuarioAutenticadoId).mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest("pago"), {
      params: Promise.resolve({ pedidoId: "pedido-1" }),
    });

    expect(response.status).toBe(401);
    expect(supabasePedidosRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("403 quando o usuário está autenticado mas não pertence à loja do pedido", async () => {
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    const { supabaseAutorizacaoRepository } = await import("@/lib/auth/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarLojaDoPedido).mockResolvedValue("loja-1");
    vi.mocked(supabaseAutorizacaoRepository.usuarioAutenticadoId).mockResolvedValue("user-1");
    vi.mocked(supabaseAutorizacaoRepository.usuarioPertenceALoja).mockResolvedValue(false);

    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest("pago"), {
      params: Promise.resolve({ pedidoId: "pedido-1" }),
    });

    expect(response.status).toBe(403);
    expect(supabasePedidosRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("422 numa transição inválida", async () => {
    await autorizarComoOperadorDaLoja("loja-1");
    const { supabasePedidosRepository } = await import("@/lib/pedidos/supabase-repository");
    vi.mocked(supabasePedidosRepository.buscarStatusAtual).mockResolvedValue("pago");

    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest("retirado"), {
      params: Promise.resolve({ pedidoId: "pedido-1" }),
    });

    expect(response.status).toBe(422);
  });

  it("200 e persiste a transição quando é válida e o operador tem acesso à loja", async () => {
    await autorizarComoOperadorDaLoja("loja-1");
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
