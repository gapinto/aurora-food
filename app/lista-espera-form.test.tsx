import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListaEsperaForm } from "./lista-espera-form";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("ListaEsperaForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("envia nome, e-mail e nome do restaurante, mostra confirmação em caso de sucesso", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ jaInscrito: false }), { status: 200 }));
    const user = userEvent.setup();
    render(<ListaEsperaForm />);

    await user.type(screen.getByPlaceholderText("Seu nome"), "Dono do Restaurante");
    await user.type(screen.getByPlaceholderText("Seu e-mail"), "dono@exemplo.com");
    await user.type(screen.getByPlaceholderText("Nome do restaurante (opcional)"), "Aurora Burger");
    await user.click(screen.getByRole("button", { name: "Entrar na lista de espera" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lista-espera",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          nome: "Dono do Restaurante",
          email: "dono@exemplo.com",
          nomeRestaurante: "Aurora Burger",
        }),
      }),
    );
    expect(await screen.findByText("Você está na lista.")).toBeInTheDocument();
  });

  it("funciona sem preencher o nome do restaurante (campo opcional)", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ jaInscrito: false }), { status: 200 }));
    const user = userEvent.setup();
    render(<ListaEsperaForm />);

    await user.type(screen.getByPlaceholderText("Seu nome"), "Dono");
    await user.type(screen.getByPlaceholderText("Seu e-mail"), "dono@exemplo.com");
    await user.click(screen.getByRole("button", { name: "Entrar na lista de espera" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lista-espera",
      expect.objectContaining({
        body: JSON.stringify({ nome: "Dono", email: "dono@exemplo.com", nomeRestaurante: undefined }),
      }),
    );
  });

  it("mostra a mensagem de erro devolvida pela API sem trocar pra tela de sucesso", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "e-mail inválido" }), { status: 400 }));
    const user = userEvent.setup();
    render(<ListaEsperaForm />);

    await user.type(screen.getByPlaceholderText("Seu nome"), "Dono");
    await user.type(screen.getByPlaceholderText("Seu e-mail"), "dono@exemplo.com");
    await user.click(screen.getByRole("button", { name: "Entrar na lista de espera" }));

    expect(await screen.findByText("e-mail inválido")).toBeInTheDocument();
    expect(screen.queryByText("Você está na lista.")).not.toBeInTheDocument();
  });
});
