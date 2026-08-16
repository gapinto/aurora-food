import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const push = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(searchParamsAtual),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword } }),
}));

let searchParamsAtual = "";

describe("LoginForm", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    signInWithPassword.mockReset();
    searchParamsAtual = "";
  });

  it("mostra erro quando as credenciais são inválidas, sem navegar", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "invalid" } });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "dono@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha-errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("navega pra '/' quando o login dá certo e não há 'next' na URL", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "dono@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha-certa");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("navega pro caminho de 'next' quando presente na URL (volta pra onde o usuário veio)", async () => {
    searchParamsAtual = "next=%2Fcozinha%2Floja-1";
    signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "dono@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha-certa");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(push).toHaveBeenCalledWith("/cozinha/loja-1");
  });
});
