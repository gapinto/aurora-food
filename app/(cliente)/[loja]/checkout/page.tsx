"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { calcularTotalCarrinho } from "@/lib/carrinho/calculos";
import { lerCarrinho } from "@/lib/types/cart";
import type { FormaPagamento } from "@/lib/types/database";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// sessionStorage é lida via useSyncExternalStore (não useEffect+setState):
// é o jeito que o React recomenda pra ler estado externo síncrono sem
// mismatch de hidratação — o carrinho não muda fora desta aba, então a
// função de subscribe não precisa notificar nada.
function inscreverCarrinho() {
  return () => {};
}

function getServerSnapshotCarrinho() {
  return null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams<{ loja: string }>();
  const carrinho = useSyncExternalStore(inscreverCarrinho, lerCarrinho, getServerSnapshotCarrinho);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix_online");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!carrinho || carrinho.linhas.length === 0) {
      router.replace(`/${params.loja}/menu`);
    }
  }, [carrinho, params.loja, router]);

  if (!carrinho || carrinho.linhas.length === 0) return null;

  const total = calcularTotalCarrinho(carrinho.linhas);

  async function finalizarPedido() {
    setEnviando(true);
    setErro(null);
    try {
      // Só itemId + quantidade — o preço é sempre resolvido no servidor a
      // partir do cardápio real, nunca confiado do client (ver
      // lib/pedidos/criar-pedido.ts).
      const linhas = carrinho!.linhas.map(({ itemId, quantidade }) => ({ itemId, quantidade }));
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lojaId: params.loja, linhas, formaPagamento }),
      });
      if (!response.ok) throw new Error(await response.text());
      const { pedidoId } = await response.json();
      router.push(`/${params.loja}/pedido/${pedidoId}`);
    } catch {
      setErro("Não foi possível criar o pedido. Chame o atendente se persistir.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-semibold">Seu pedido</h1>

      <ul className="flex flex-col gap-2">
        {carrinho.linhas.map((linha) => (
          <li key={linha.itemId} className="flex justify-between">
            <span>
              {linha.quantidade}× {linha.nome}
            </span>
            <span>{formatoMoeda.format(linha.preco * linha.quantidade)}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between border-t border-black/10 pt-3 font-semibold">
        <span>Total</span>
        <span>{formatoMoeda.format(total)}</span>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Forma de pagamento</legend>
        <label className="flex items-center gap-3 rounded-xl border border-black/10 p-3">
          <input
            type="radio"
            name="forma-pagamento"
            checked={formaPagamento === "pix_online"}
            onChange={() => setFormaPagamento("pix_online")}
          />
          <span>
            <span className="block font-medium">Pix agora</span>
            <span className="block text-sm text-neutral-500">
              A cozinha começa assim que o pagamento é confirmado.
            </span>
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-black/10 p-3">
          <input
            type="radio"
            name="forma-pagamento"
            checked={formaPagamento === "caixa"}
            onChange={() => setFormaPagamento("caixa")}
          />
          <span>
            <span className="block font-medium">Pagar no caixa</span>
            <span className="block text-sm text-neutral-500">
              Pix manual, dinheiro, cartão ou VR/VA. Gera uma senha para retirada.
            </span>
          </span>
        </label>
      </fieldset>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={finalizarPedido}
        disabled={enviando}
        className="mt-auto rounded-full bg-neutral-900 px-6 py-4 font-semibold text-white disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Confirmar pedido"}
      </button>
    </div>
  );
}
