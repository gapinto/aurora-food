# Aurora Food

Autoatendimento "escolha, pague, pegue" para restaurantes e food service —
cardápio digital, pagamento Pix com split via Asaas, painel de cozinha/caixa
em tempo real. Ver `CLAUDE.md` para a especificação de produto condensada.

## Rodando localmente (sem Supabase configurado)

```bash
npm install
npm run dev
```

Sem `.env.local`, as páginas do cliente caem em dados de exemplo (ver
`app/(cliente)/[loja]/menu/page.tsx`) e os painéis mostram lista vazia sem
exigir login — dá pra navegar a UI, mas nenhuma jornada fecha de verdade
(não persiste pedido, não faz login).

## Rodando com todas as jornadas funcionando

Precisa de um projeto Supabase real. Passo a passo:

1. **Criar o projeto** em [supabase.com](https://supabase.com) (o plano
   gratuito serve) e pegar `Project URL`, `anon key` e `service_role key`
   em Project Settings → API.
2. **Habilitar login por e-mail/senha**: Authentication → Providers →
   Email. É o único método implementado (`app/(painel)/login/`).
3. **Aplicar as migrations + seed**, na ordem:
   ```bash
   supabase db push   # ou rodar supabase/migrations/*.sql manualmente, em ordem
   ```
   Depois rode `supabase/seed.sql` (`supabase db reset` já roda ele
   sozinho — cria uma loja de teste com id
   `11111111-1111-1111-1111-111111111111` e um cardápio).
4. **Criar o primeiro usuário**: Authentication → Users → Add user (não
   existe tela de cadastro — o app só faz login). Copie o UUID do usuário
   criado.
5. **Linkar o usuário à loja de teste**, via SQL editor do Supabase:
   ```sql
   insert into loja_usuarios (loja_id, user_id)
   values ('11111111-1111-1111-1111-111111111111', '<uuid-do-usuario>');
   ```
6. **Preencher `.env.local`** (`cp .env.example .env.local`) com a URL e
   as duas chaves do passo 1. Deixar as variáveis do Asaas em branco é ok
   pra testar a jornada "pagar no caixa" — só o Pix online precisa delas.
7. `npm run dev`. Fluxos pra testar:
   - **Cliente:** `/11111111-1111-1111-1111-111111111111/menu` → monta
     pedido → "pagar no caixa" → recebe senha e acompanha em
     `/[loja]/pedido/[pedidoId]`.
   - **Caixa:** `/login` (e-mail/senha do passo 4) → `/caixa/11111111-1111-1111-1111-111111111111`
     → confirmar pagamento.
   - **Cozinha:** `/cozinha/11111111-1111-1111-1111-111111111111` → iniciar
     preparo → marcar pronto → marcar retirado. O cliente vê cada mudança
     em tempo real na tela de acompanhamento.

Pra testar **Pix online** de ponta a ponta, ainda precisa de conta Asaas
sandbox e de um túnel (ngrok ou similar) apontando pra
`/api/webhooks/asaas`, já que `localhost` não é alcançável pelo Asaas —
ver `CLAUDE.md`/Backlog.

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
