"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { salvarCarrinho, type CartLine } from "@/lib/types/cart";
import type { Item } from "@/lib/types/database";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Sem tela de detalhe/modal por item: toque no "+" já adiciona, e o botão
// vira contador inline (−/+) no lugar — sem navegar pra carrinho separado
// (spec seção 2).
export function CardapioClient({ lojaSlug, itens }: { lojaSlug: string; itens: Item[] }) {
  const router = useRouter();
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  const categorias = useMemo(() => {
    const grupos = new Map<string, Item[]>();
    for (const item of itens) {
      const lista = grupos.get(item.categoria) ?? [];
      lista.push(item);
      grupos.set(item.categoria, lista);
    }
    return grupos;
  }, [itens]);

  const linhas: CartLine[] = itens
    .filter((item) => quantidades[item.id] > 0)
    .map((item) => ({
      itemId: item.id,
      nome: item.nome,
      preco: item.preco,
      quantidade: quantidades[item.id],
    }));

  const total = linhas.reduce((soma, linha) => soma + linha.preco * linha.quantidade, 0);
  const totalItens = linhas.reduce((soma, linha) => soma + linha.quantidade, 0);

  function ajustar(itemId: string, delta: number) {
    setQuantidades((atual) => {
      const proxima = Math.max(0, (atual[itemId] ?? 0) + delta);
      return { ...atual, [itemId]: proxima };
    });
  }

  function irParaCheckout() {
    salvarCarrinho({ lojaSlug, linhas });
    router.push(`/${lojaSlug}/checkout`);
  }

  return (
    <div className="flex flex-1 flex-col pb-28">
      {Array.from(categorias.entries()).map(([categoria, itensDaCategoria]) => (
        <section key={categoria} className="px-4 py-4">
          <h2 className="mb-2 text-lg font-semibold">{categoria}</h2>
          <ul className="flex flex-col gap-3">
            {itensDaCategoria.map((item) => {
              const quantidade = quantidades[item.id] ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-black/10 p-3"
                >
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-neutral-500">{formatoMoeda.format(item.preco)}</p>
                    {/* Transparência de preço — spec seção 9 */}
                    <p className="text-xs text-neutral-400">
                      Preço atualizado em{" "}
                      {new Date(item.preco_atualizado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {quantidade === 0 ? (
                    <button
                      type="button"
                      onClick={() => ajustar(item.id, 1)}
                      className="h-11 w-11 shrink-0 rounded-full bg-neutral-900 text-xl font-semibold text-white"
                      aria-label={`Adicionar ${item.nome}`}
                    >
                      +
                    </button>
                  ) : (
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => ajustar(item.id, -1)}
                        className="h-11 w-11 rounded-full border border-neutral-900 text-xl font-semibold"
                        aria-label={`Remover ${item.nome}`}
                      >
                        −
                      </button>
                      <span className="w-4 text-center font-semibold">{quantidade}</span>
                      <button
                        type="button"
                        onClick={() => ajustar(item.id, 1)}
                        className="h-11 w-11 rounded-full bg-neutral-900 text-xl font-semibold text-white"
                        aria-label={`Adicionar ${item.nome}`}
                      >
                        +
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Barra de resumo sempre visível e fixa, atualiza ao vivo — spec seção 2 */}
      {totalItens > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white p-4">
          <button
            type="button"
            onClick={irParaCheckout}
            className="flex w-full items-center justify-between rounded-full bg-neutral-900 px-6 py-4 font-semibold text-white"
          >
            <span>
              {totalItens} {totalItens === 1 ? "item" : "itens"}
            </span>
            <span>{formatoMoeda.format(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
