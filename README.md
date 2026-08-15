# Aurora Food

Autoatendimento "escolha, pague, pegue" para restaurantes e food service —
cardápio digital, pagamento Pix com split via Asaas, painel de cozinha/caixa
em tempo real. Ver `CLAUDE.md` para a especificação de produto condensada.

## Rodando localmente

```bash
npm install
cp .env.example .env.local  # preencher Supabase + Asaas
npm run dev
```

Sem `.env.local` preenchido, as páginas do cliente caem em dados de
exemplo (ver `app/(cliente)/[loja]/menu/page.tsx`) e as rotas de API que
dependem de Supabase/Asaas retornam erro — suficiente pra navegar a UI, não
pra fluxo de pagamento real.

Aplicar o schema no projeto Supabase:

```bash
supabase db push  # ou rodar supabase/migrations/0001_init.sql manualmente
```

## Estrutura

- `app/(cliente)/[loja]/**` — cardápio, checkout e acompanhamento do pedido (tema claro).
- `app/(painel)/{cozinha,caixa}/[loja]/**` — painéis internos em tempo real.
- `app/api/**` — webhook Asaas, criação de pedidos, onboarding, import de cardápio, agente de IA.
- `lib/supabase/`, `lib/asaas/`, `lib/agente/` — integrações.
- `supabase/migrations/` — schema (fonte de verdade); `lib/types/database.ts` é o espelho TypeScript.

## Deploy

Vercel (serverless) — sem VPS/Terraform, por decisão de arquitetura (ver `CLAUDE.md`).
