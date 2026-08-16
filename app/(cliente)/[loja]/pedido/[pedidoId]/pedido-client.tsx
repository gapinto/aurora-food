"use client";

import { useEffect, useState } from "react";

import { asaasMockAtivo } from "@/lib/asaas/provider";
import { createClient } from "@/lib/supabase/client";
import type { Pedido, StatusPedido } from "@/lib/types/database";

const ETAPAS: { status: StatusPedido; rotulo: string }[] = [
  { status: "pago", rotulo: "Pagamento confirmado" },
  { status: "preparando", rotulo: "Preparando" },
  { status: "pronto", rotulo: "Pronto para retirar" },
  { status: "retirado", rotulo: "Retirado" },
];

export function PedidoClient({ pedidoInicial }: { pedidoInicial: Pedido }) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [simulando, setSimulando] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`pedido-${pedido.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${pedido.id}` },
        (payload) => setPedido(payload.new as Pedido),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [pedido.id]);

  const aguardandoPagamento =
    pedido.status === "aguardando_pagamento_pix" || pedido.status === "aguardando_pagamento_caixa";
  const indiceAtual = ETAPAS.findIndex((etapa) => etapa.status === pedido.status);

  async function simularPagamento() {
    setSimulando(true);
    try {
      await fetch("/api/dev/simular-pagamento-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedido.id }),
      });
      // A tela atualiza sozinha via Realtime quando o status virar "pago" —
      // não precisa fazer setPedido aqui.
    } finally {
      setSimulando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-10 text-center">
      <p className="text-sm text-neutral-500">Sua senha</p>
      <p className="text-6xl font-bold tracking-wide">{pedido.senha}</p>

      {aguardandoPagamento ? (
        <>
          <p className="text-neutral-500">Aguardando confirmação do pagamento…</p>
          {pedido.status === "aguardando_pagamento_pix" && asaasMockAtivo() && (
            <button
              type="button"
              onClick={simularPagamento}
              disabled={simulando}
              className="rounded-full border border-dashed border-neutral-400 px-4 py-2 text-sm text-neutral-500 disabled:opacity-50"
            >
              {simulando ? "Simulando…" : "Simular pagamento Pix (modo mock)"}
            </button>
          )}
        </>
      ) : (
        <ol className="flex w-full max-w-sm flex-col gap-3 text-left">
          {ETAPAS.map((etapa, indice) => (
            <li
              key={etapa.status}
              className={`rounded-xl border p-3 ${
                indice <= indiceAtual
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-black/10 text-neutral-400"
              }`}
            >
              {etapa.rotulo}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
