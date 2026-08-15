import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Pedido } from "@/lib/types/database";

import { PedidoClient } from "./pedido-client";

type CallbackRealtime = (payload: { new: Pedido }) => void;

let callbackCapturado: CallbackRealtime | null = null;
const removeChannel = vi.fn();
const subscribe = vi.fn();
const on = vi.fn((_evento: string, _filtro: unknown, callback: CallbackRealtime) => {
  callbackCapturado = callback;
  return { subscribe };
});
const channel = vi.fn(() => ({ on }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ channel, removeChannel }),
}));

function pedido(overrides: Partial<Pedido>): Pedido {
  return {
    id: "pedido-1",
    loja_id: "loja-1",
    valor_total: 24.9,
    forma_pagamento: "pix_online",
    status: "aguardando_pagamento_pix",
    asaas_charge_id: null,
    senha: "123",
    pago_por: null,
    criado_em: new Date().toISOString(),
    ...overrides,
  };
}

describe("PedidoClient", () => {
  beforeEach(() => {
    callbackCapturado = null;
  });

  it("mostra 'aguardando confirmação' enquanto o status é de pagamento pendente", () => {
    render(<PedidoClient pedidoInicial={pedido({ status: "aguardando_pagamento_caixa" })} />);

    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("Aguardando confirmação do pagamento…")).toBeInTheDocument();
    expect(screen.queryByText("Pagamento confirmado")).not.toBeInTheDocument();
  });

  it("mostra as etapas quando o pedido já está pago", () => {
    render(<PedidoClient pedidoInicial={pedido({ status: "preparando" })} />);

    expect(screen.getByText("Pagamento confirmado")).toBeInTheDocument();
    expect(screen.getByText("Preparando")).toBeInTheDocument();
    expect(screen.getByText("Pronto para retirar")).toBeInTheDocument();
    expect(screen.getByText("Retirado")).toBeInTheDocument();
  });

  it("atualiza a tela em tempo real quando o Realtime emite uma mudança de status", () => {
    render(<PedidoClient pedidoInicial={pedido({ status: "aguardando_pagamento_pix" })} />);
    expect(screen.getByText("Aguardando confirmação do pagamento…")).toBeInTheDocument();

    expect(callbackCapturado).not.toBeNull();
    act(() => {
      callbackCapturado!({ new: pedido({ status: "pronto" }) });
    });

    expect(screen.getByText("Pagamento confirmado")).toBeInTheDocument();
    expect(screen.queryByText("Aguardando confirmação do pagamento…")).not.toBeInTheDocument();
  });

  it("se inscreve no canal do pedido e cancela ao desmontar", () => {
    const { unmount } = render(<PedidoClient pedidoInicial={pedido({ id: "pedido-42" })} />);

    expect(channel).toHaveBeenCalledWith("pedido-pedido-42");
    unmount();
    expect(removeChannel).toHaveBeenCalled();
  });
});
