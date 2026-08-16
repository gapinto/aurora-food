import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const asaasMockAtivo = vi.fn(() => false);
vi.mock("@/lib/asaas/provider", () => ({
  asaasMockAtivo: () => asaasMockAtivo(),
}));

const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
vi.stubGlobal("fetch", fetchMock);

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
    asaasMockAtivo.mockReturnValue(false);
    fetchMock.mockClear();
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

  it("não mostra o botão de simular pagamento fora do modo mock", () => {
    asaasMockAtivo.mockReturnValue(false);
    render(<PedidoClient pedidoInicial={pedido({ status: "aguardando_pagamento_pix" })} />);

    expect(screen.queryByRole("button", { name: /Simular pagamento/ })).not.toBeInTheDocument();
  });

  it("não mostra o botão de simular pagamento pra pedido 'pagar no caixa', mesmo em modo mock (é só do fluxo Pix)", () => {
    asaasMockAtivo.mockReturnValue(true);
    render(
      <PedidoClient
        pedidoInicial={pedido({ status: "aguardando_pagamento_caixa", forma_pagamento: "caixa" })}
      />,
    );

    expect(screen.queryByRole("button", { name: /Simular pagamento/ })).not.toBeInTheDocument();
  });

  it("em modo mock, clicar em 'simular pagamento' chama a rota dev com o id do pedido", async () => {
    asaasMockAtivo.mockReturnValue(true);
    const user = userEvent.setup();
    render(<PedidoClient pedidoInicial={pedido({ id: "pedido-7", status: "aguardando_pagamento_pix" })} />);

    await user.click(screen.getByRole("button", { name: /Simular pagamento/ }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dev/simular-pagamento-pix",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ pedidoId: "pedido-7" }),
      }),
    );
  });
});
