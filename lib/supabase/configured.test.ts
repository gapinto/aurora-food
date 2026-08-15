import { afterEach, describe, expect, it, vi } from "vitest";

import { supabaseConfigurado } from "./configured";

describe("supabaseConfigurado", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("false quando NEXT_PUBLIC_SUPABASE_URL não está definida", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(supabaseConfigurado()).toBe(false);
  });

  it("true quando NEXT_PUBLIC_SUPABASE_URL está definida", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    expect(supabaseConfigurado()).toBe(true);
  });
});
