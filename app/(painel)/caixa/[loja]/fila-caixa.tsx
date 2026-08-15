"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Pedido } from "@/lib/types/database";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function FilaCaixa({ lojaId, pedidosIniciais }: { lojaId: string; pedidosIniciais: Pedido[] }) {
  const [pedidos, setPedidos] = useState(pedidosIniciais);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`caixa-${lojaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos", filter: `loja_id=eq.${lojaId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const pedidoAtualizado = payload.new as Pedido;
          setPedidos((atual) => {
            const semEsteId = atual.filter((pedido) => pedido.id !== pedidoAtualizado.id);
            return pedidoAtualizado.status === "aguardando_pagamento_caixa"
              ? [...semEsteId, pedidoAtualizado]
              : semEsteId;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [lojaId]);

  async function confirmarPagamento(pedido: Pedido) {
    await fetch(`/api/pedidos/${pedido.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago" }),
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {pedidos.map((pedido) => (
        <article
          key={pedido.id}
          className="flex items-center justify-between rounded-xl border border-white/10 p-4"
        >
          <div>
            <p className="text-2xl font-bold">Senha {pedido.senha}</p>
            <p className="text-sm text-neutral-400">{formatoMoeda.format(pedido.valor_total)}</p>
          </div>
          <button
            type="button"
            onClick={() => confirmarPagamento(pedido)}
            className="rounded-full bg-aurora-glow px-5 py-3 font-semibold text-aurora-night"
          >
            Confirmar pagamento
          </button>
        </article>
      ))}
      {pedidos.length === 0 && <p className="text-neutral-400">Nenhum pedido aguardando no caixa.</p>}
    </div>
  );
}
