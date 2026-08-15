import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Pedido } from "@/lib/types/database";

import { FilaCaixa } from "./fila-caixa";

const removeChannel = vi.fn();
const subscribe = vi.fn();
const on = vi.fn(() => ({ subscribe }));
const channel = vi.fn(() => ({ on }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ channel, removeChannel }),
}));

const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
vi.stubGlobal("fetch", fetchMock);

function pedido(overrides: Partial<Pedido>): Pedido {
  return {
    id: "pedido-1",
    loja_id: "loja-1",
    valor_total: 24.9,
    forma_pagamento: "caixa",
    status: "aguardando_pagamento_caixa",
    asaas_charge_id: null,
    senha: "456",
    pago_por: null,
    criado_em: new Date().toISOString(),
    ...overrides,
  };
}

describe("FilaCaixa", () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it("mostra mensagem de fila vazia quando não há pedidos aguardando", () => {
    render(<FilaCaixa lojaId="loja-1" pedidosIniciais={[]} />);
    expect(screen.getByText("Nenhum pedido aguardando no caixa.")).toBeInTheDocument();
  });

  it("mostra senha e valor formatado em reais", () => {
    render(<FilaCaixa lojaId="loja-1" pedidosIniciais={[pedido({ senha: "456", valor_total: 24.9 })]} />);
    expect(screen.getByText("Senha 456")).toBeInTheDocument();
    expect(screen.getByText("R$ 24,90")).toBeInTheDocument();
  });

  it("confirmar pagamento faz PATCH pra status 'pago'", async () => {
    const user = userEvent.setup();
    render(<FilaCaixa lojaId="loja-1" pedidosIniciais={[pedido({ id: "pedido-5" })]} />);

    await user.click(screen.getByRole("button", { name: "Confirmar pagamento" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pedidos/pedido-5/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "pago" }),
      }),
    );
  });

  it("se inscreve no canal Realtime da loja ao montar e cancela ao desmontar", () => {
    const { unmount } = render(<FilaCaixa lojaId="loja-9" pedidosIniciais={[]} />);

    expect(channel).toHaveBeenCalledWith("caixa-loja-9");
    unmount();
    expect(removeChannel).toHaveBeenCalled();
  });
});
