import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/lista-espera/supabase-repository", () => ({
  supabaseListaEsperaRepository: {
    inscrever: vi.fn(),
  },
}));

function requestComBody(body: unknown): Request {
  return new Request("http://localhost/api/lista-espera", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/lista-espera", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("503 quando o Supabase não está configurado — nunca deixa a rota estourar 500 cru (achado testando na prática)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const { POST } = await import("./route");
    const response = await POST(requestComBody({ nome: "Dono", email: "dono@exemplo.com" }));

    expect(response.status).toBe(503);
  });

  it("400 quando o payload é inválido", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");

    const { POST } = await import("./route");
    const response = await POST(requestComBody({ nome: "", email: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "nome e e-mail são obrigatórios" });
  });

  it("200 com jaInscrito=false numa inscrição nova", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    const { supabaseListaEsperaRepository } = await import("@/lib/lista-espera/supabase-repository");
    vi.mocked(supabaseListaEsperaRepository.inscrever).mockResolvedValue("inscrito");

    const { POST } = await import("./route");
    const response = await POST(requestComBody({ nome: "Dono", email: "dono@exemplo.com" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ jaInscrito: false });
  });

  it("200 com jaInscrito=true quando o e-mail já estava na lista", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    const { supabaseListaEsperaRepository } = await import("@/lib/lista-espera/supabase-repository");
    vi.mocked(supabaseListaEsperaRepository.inscrever).mockResolvedValue("ja_inscrito");

    const { POST } = await import("./route");
    const response = await POST(requestComBody({ nome: "Dono", email: "dono@exemplo.com" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ jaInscrito: true });
  });
});
