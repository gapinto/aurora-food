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

Aplicar o schema no projeto Supabase (roda as duas migrations em ordem):

```bash
supabase db push  # ou rodar supabase/migrations/*.sql manualmente, em ordem
```

Os painéis (`/cozinha/[loja]`, `/caixa/[loja]`) exigem login via Supabase
Auth (e-mail/senha, em `/login`) e uma linha em `loja_usuarios` associando
o usuário à loja — sem isso, `/api/pedidos/[pedidoId]/status` responde
401/403. Cadastro de operador ainda é manual (dashboard do Supabase ou
service role) — não há fluxo de convite ainda.

## Testes

```bash
npm test              # roda a suíte uma vez
npm run test:watch    # modo watch
npm run test:coverage # com relatório de cobertura (thresholds em vitest.config.mts)
```

Lógica de negócio (`lib/**/criar-pedido.ts`, `atualizar-status.ts`,
`onboarding.ts` etc.) é testada com fakes em memória das interfaces
(`test/fakes/`), sem tocar Supabase/Asaas de verdade. Ver "Práticas de
engenharia" em `CLAUDE.md` antes de adicionar código novo — o padrão é
sempre caso de uso + interface + teste com fake, TDD.

## Estrutura

- `app/(cliente)/[loja]/**` — cardápio, checkout e acompanhamento do pedido (tema claro).
- `app/(painel)/{cozinha,caixa}/[loja]/**` — painéis internos em tempo real.
- `app/api/**` — adapters HTTP finos: parseiam a request, injetam as implementações reais e chamam o caso de uso correspondente.
- `lib/pedidos/`, `lib/lojas/` — casos de uso (lógica de negócio pura) + interfaces de repositório + implementações Supabase.
- `lib/auth/` — autorização de painel via Supabase Auth (interface `AutorizacaoRepository` + caso de uso `exigirAcessoALoja`); `proxy.ts` (convenção Next 16 — antigo middleware.ts) refresca a sessão.
- `lib/asaas/` — interface `PagamentoProvider` + implementação real via fetch.
- `lib/carrinho/`, `lib/supabase/`, `lib/agente/` — cálculos compartilhados e outras integrações.
- `test/fakes/` — implementações em memória das interfaces, usadas nos testes dos casos de uso.
- `supabase/migrations/` — schema (fonte de verdade); `lib/types/database.ts` é o espelho TypeScript.

## Deploy

Vercel (serverless) — sem VPS/Terraform, por decisão de arquitetura (ver `CLAUDE.md`).
