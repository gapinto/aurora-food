import { describe, expect, it } from "vitest";

import { criarPedidosRepositoryFake } from "@/test/fakes/pedidos-repository.fake";

import { confirmarPagamentoPix } from "./confirmar-pagamento-pix";

describe("confirmarPagamentoPix", () => {
  it("ignora eventos que não são de pagamento confirmado", async () => {
    const { repositorio } = criarPedidosRepositoryFake();

    const resultado = await confirmarPagamentoPix({ event: "PAYMENT_CREATED" }, { repositorio });

    expect(resultado).toEqual({ ok: true, ignorado: true });
  });

  it("rejeita payload sem payment.id", async () => {
    const { repositorio } = criarPedidosRepositoryFake();

    const resultado = await confirmarPagamentoPix({ event: "PAYMENT_RECEIVED" }, { repositorio });

    expect(resultado).toEqual({ ok: false, erro: "payload sem payment.id", codigo: 400 });
  });

  it("confirma o pedido correspondente ao charge id e libera a cozinha", async () => {
    const { repositorio, pedidos } = criarPedidosRepositoryFake();
    const pedido = await repositorio.criarPedido({
      lojaId: "loja-1",
      valorTotal: 24.9,
      formaPagamento: "pix_online",
      status: "aguardando_pagamento_pix",
      senha: "123",
    });
    await repositorio.atualizarChargeId(pedido!.id, "charge-abc");

    const resultado = await confirmarPagamentoPix(
      { event: "PAYMENT_RECEIVED", payment: { id: "charge-abc" } },
      { repositorio },
    );

    expect(resultado).toEqual({ ok: true });
    expect(pedidos.get(pedido!.id)?.status).toBe("pago");
  });

  it("500 quando não encontra pedido aguardando pagamento pra esse charge id", async () => {
    const { repositorio } = criarPedidosRepositoryFake();

    const resultado = await confirmarPagamentoPix(
      { event: "PAYMENT_CONFIRMED", payment: { id: "charge-desconhecido" } },
      { repositorio },
    );

    expect(resultado).toEqual({ ok: false, erro: "falha ao atualizar pedido", codigo: 500 });
  });
});
