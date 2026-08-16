import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "./logout-button";

const push = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn(async () => ({ error: null }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut } }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    signOut.mockClear();
  });

  it("encerra a sessão e manda pro login", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });
});
