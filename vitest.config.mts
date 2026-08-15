import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      // Fora do gate: adaptadores finos de I/O (implementações concretas de
      // Supabase/Asaas, componentes de página do Next) — o contrato deles é
      // coberto indiretamente pelos testes dos casos de uso via fakes (ver
      // test/fakes/) e pelos testes dos handlers de API que já têm lógica
      // própria. Rotas ainda não migradas pro padrão caso-de-uso+interface
      // (agente, import-cardapio, onboarding, webhook) ficam de fora até
      // ganharem essa refatoração — ver CLAUDE.md, seção de engenharia.
      exclude: [
        "**/*.d.ts",
        "app/**/page.tsx",
        "app/**/layout.tsx",
        "**/supabase-repository.ts",
        "lib/asaas/client.ts",
        "lib/supabase/client.ts",
        "lib/supabase/server.ts",
        "app/api/agente/route.ts",
        "app/api/import-cardapio/route.ts",
        "app/api/onboarding/route.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
