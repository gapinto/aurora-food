"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Pedido, StatusPedido } from "@/lib/types/database";

const PROXIMO_STATUS: Partial<Record<StatusPedido, StatusPedido>> = {
  pago: "preparando",
  preparando: "pronto",
};

const RUBRICA_BOTAO: Partial<Record<StatusPedido, string>> = {
  pago: "Iniciar preparo",
  preparando: "Marcar pronto",
};

export function FilaCozinha({ lojaId, pedidosIniciais }: { lojaId: string; pedidosIniciais: Pedido[] }) {
  const [pedidos, setPedidos] = useState(pedidosIniciais);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`cozinha-${lojaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos", filter: `loja_id=eq.${lojaId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const pedidoAtualizado = payload.new as Pedido;
          setPedidos((atual) => {
            const semEsteId = atual.filter((pedido) => pedido.id !== pedidoAtualizado.id);
            const relevante = pedidoAtualizado.status === "pago" || pedidoAtualizado.status === "preparando";
            return relevante ? [...semEsteId, pedidoAtualizado] : semEsteId;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [lojaId]);

  async function avancar(pedido: Pedido) {
    const proximo = PROXIMO_STATUS[pedido.status];
    if (!proximo) return;
    await fetch(`/api/pedidos/${pedido.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: proximo }),
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {pedidos.map((pedido) => (
        <article key={pedido.id} className="rounded-xl border border-white/10 p-4">
          <p className="text-3xl font-bold">{pedido.senha}</p>
          <p className="mb-3 text-sm text-neutral-400">
            {pedido.status === "pago" ? "Aguardando início" : "Em preparo"}
          </p>
          {PROXIMO_STATUS[pedido.status] && (
            <button
              type="button"
              onClick={() => avancar(pedido)}
              className="w-full rounded-full bg-aurora-glow px-4 py-2 font-semibold text-aurora-night"
            >
              {RUBRICA_BOTAO[pedido.status]}
            </button>
          )}
        </article>
      ))}
      {pedidos.length === 0 && <p className="text-neutral-400">Nenhum pedido na fila.</p>}
    </div>
  );
}
