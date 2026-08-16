import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Pedido } from "@/lib/types/database";

import { FilaCozinha } from "./fila-cozinha";

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
    forma_pagamento: "pix_online",
    status: "pago",
    asaas_charge_id: null,
    senha: "123",
    pago_por: null,
    criado_em: new Date().toISOString(),
    ...overrides,
  };
}

describe("FilaCozinha", () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it("mostra mensagem de fila vazia quando não há pedidos", () => {
    render(<FilaCozinha lojaId="loja-1" pedidosIniciais={[]} />);
    expect(screen.getByText("Nenhum pedido na fila.")).toBeInTheDocument();
  });

  it("pedido 'pago' mostra botão 'Iniciar preparo'", () => {
    render(<FilaCozinha lojaId="loja-1" pedidosIniciais={[pedido({ status: "pago" })]} />);
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar preparo" })).toBeInTheDocument();
  });

  it("pedido 'preparando' mostra botão 'Marcar pronto'", () => {
    render(<FilaCozinha lojaId="loja-1" pedidosIniciais={[pedido({ status: "preparando" })]} />);
    expect(screen.getByRole("button", { name: "Marcar pronto" })).toBeInTheDocument();
  });

  it("pedido 'pronto' mostra botão 'Marcar retirado' — fecha o ciclo que antes travava em 'pronto'", () => {
    render(<FilaCozinha lojaId="loja-1" pedidosIniciais={[pedido({ status: "pronto" })]} />);
    expect(screen.getByText("Pronto para retirada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar retirado" })).toBeInTheDocument();
  });

  it("marcar retirado faz PATCH pra 'retirado'", async () => {
    const user = userEvent.setup();
    render(<FilaCozinha lojaId="loja-1" pedidosIniciais={[pedido({ id: "pedido-3", status: "pronto" })]} />);

    await user.click(screen.getByRole("button", { name: "Marcar retirado" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pedidos/pedido-3/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "retirado" }),
      }),
    );
  });

  it("clicar em avançar faz PATCH pro próximo status da máquina de estados", async () => {
    const user = userEvent.setup();
    render(<FilaCozinha lojaId="loja-1" pedidosIniciais={[pedido({ id: "pedido-9", status: "pago" })]} />);

    await user.click(screen.getByRole("button", { name: "Iniciar preparo" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pedidos/pedido-9/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "preparando" }),
      }),
    );
  });

  it("se inscreve no canal Realtime da loja ao montar e cancela ao desmontar", () => {
    const { unmount } = render(<FilaCozinha lojaId="loja-77" pedidosIniciais={[]} />);

    expect(channel).toHaveBeenCalledWith("cozinha-loja-77");
    expect(subscribe).toHaveBeenCalled();

    unmount();
    expect(removeChannel).toHaveBeenCalled();
  });
});
