import { describe, expect, it } from "vitest";

import { criarPedidosRepositoryFake } from "@/test/fakes/pedidos-repository.fake";

import { atualizarStatusPedido } from "./atualizar-status";

async function criarPedidoComStatus(
  repositorio: ReturnType<typeof criarPedidosRepositoryFake>["repositorio"],
  status: Parameters<typeof repositorio.atualizarStatus>[1],
) {
  const pedido = await repositorio.criarPedido({
    lojaId: "loja-1",
    valorTotal: 10,
    formaPagamento: "caixa",
    status,
    senha: "123",
  });
  return pedido!.id;
}

describe("atualizarStatusPedido", () => {
  it("404 quando o pedido não existe", async () => {
    const { repositorio } = criarPedidosRepositoryFake();

    const resultado = await atualizarStatusPedido("inexistente", "pago", { repositorio });

    expect(resultado).toEqual({ ok: false, erro: "pedido não encontrado", codigo: 404 });
  });

  it("422 numa transição inválida (ex.: pular etapa)", async () => {
    const { repositorio } = criarPedidosRepositoryFake();
    const pedidoId = await criarPedidoComStatus(repositorio, "pago");

    const resultado = await atualizarStatusPedido(pedidoId, "pronto", { repositorio });

    expect(resultado).toEqual({
      ok: false,
      erro: "transição inválida de pago para pronto",
      codigo: 422,
    });
  });

  it("aplica a transição quando é válida", async () => {
    const { repositorio, pedidos } = criarPedidosRepositoryFake();
    const pedidoId = await criarPedidoComStatus(repositorio, "pago");

    const resultado = await atualizarStatusPedido(pedidoId, "preparando", { repositorio });

    expect(resultado).toEqual({ ok: true });
    expect(pedidos.get(pedidoId)?.status).toBe("preparando");
  });
});
