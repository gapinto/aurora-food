import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Item } from "@/lib/types/database";

import { CardapioClient } from "./cardapio-client";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const itens: Item[] = [
  {
    id: "item-1",
    loja_id: "loja-1",
    categoria: "Lanches",
    nome: "X-Salada",
    preco: 24.9,
    foto_url: null,
    ncm: null,
    disponivel: true,
    preco_atualizado_em: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "item-2",
    loja_id: "loja-1",
    categoria: "Bebidas",
    nome: "Suco natural",
    preco: 9.5,
    foto_url: null,
    ncm: null,
    disponivel: true,
    preco_atualizado_em: "2026-08-01T00:00:00.000Z",
  },
];

describe("CardapioClient", () => {
  beforeEach(() => {
    sessionStorage.clear();
    push.mockClear();
  });

  it("agrupa itens por categoria", () => {
    render(<CardapioClient lojaSlug="loja-1" itens={itens} />);

    expect(screen.getByRole("heading", { name: "Lanches" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bebidas" })).toBeInTheDocument();
  });

  it("não mostra a barra de resumo enquanto o carrinho está vazio", () => {
    render(<CardapioClient lojaSlug="loja-1" itens={itens} />);
    expect(screen.queryByRole("button", { name: /item/ })).not.toBeInTheDocument();
  });

  it("toque no '+' adiciona o item direto, sem tela de detalhe (spec seção 2)", async () => {
    const user = userEvent.setup();
    render(<CardapioClient lojaSlug="loja-1" itens={itens} />);

    await user.click(screen.getByRole("button", { name: "Adicionar X-Salada" }));

    expect(screen.getByRole("button", { name: "Remover X-Salada" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("1 item")).toBeInTheDocument();
    // "R$ 24,90" aparece duas vezes: no preço do item e na barra de resumo.
    expect(screen.getAllByText("R$ 24,90")).toHaveLength(2);
  });

  it("o botão vira contador inline (−/+) e a barra de resumo atualiza ao vivo", async () => {
    const user = userEvent.setup();
    render(<CardapioClient lojaSlug="loja-1" itens={itens} />);

    await user.click(screen.getByRole("button", { name: "Adicionar X-Salada" }));
    await user.click(screen.getByRole("button", { name: "Adicionar X-Salada" }));

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("2 itens")).toBeInTheDocument();
    expect(screen.getByText("R$ 49,80")).toBeInTheDocument();
  });

  it("remover até zero volta a mostrar o botão '+' e some da barra de resumo", async () => {
    const user = userEvent.setup();
    render(<CardapioClient lojaSlug="loja-1" itens={itens} />);

    await user.click(screen.getByRole("button", { name: "Adicionar X-Salada" }));
    await user.click(screen.getByRole("button", { name: "Remover X-Salada" }));

    expect(screen.getByRole("button", { name: "Adicionar X-Salada" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /item/ })).not.toBeInTheDocument();
  });

  it("ao confirmar o resumo, salva o carrinho e navega pro checkout da loja", async () => {
    const user = userEvent.setup();
    render(<CardapioClient lojaSlug="loja-42" itens={itens} />);

    await user.click(screen.getByRole("button", { name: "Adicionar Suco natural" }));
    await user.click(screen.getByRole("button", { name: /1 item/ }));

    expect(push).toHaveBeenCalledWith("/loja-42/checkout");
    expect(sessionStorage.getItem("aurora-food:carrinho")).toContain("item-2");
  });
});
