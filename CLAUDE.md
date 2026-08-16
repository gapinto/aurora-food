@AGENTS.md

# Aurora Food

Sistema de autoatendimento **"escolha, pague, pegue"** para restaurantes e
food service em geral, focado no cenário de balcão físico com fila de
retirada (nenhum concorrente mapeado — MenuDino, Consumer, Brendi, OlaClick,
Anota Aí, Goomer — é desenhado pra isso; todos são delivery-first).

Fluxo: QR code → cardápio web (PWA) → cliente monta pedido → paga (Pix
online ou no caixa) → cozinha começa a preparar assim que o pagamento é
confirmado, não quando o cliente chega no caixa.

Este documento é a fonte de verdade condensada do produto para sessões de
desenvolvimento. A especificação completa, com todo o raciocínio por trás de
cada decisão, está no anexo do projeto (`aurora-food-especificacao.md`) —
consulte-o para contexto histórico; este arquivo é o que deve ficar
atualizado conforme o código evolui.

## Regras de fluxo do cliente (não regredir)

Validadas contra pesquisa de campo (Reddit r/opiniaoimpopular) — ver
`app/(cliente)/[loja]/menu/cardapio-client.tsx` para a implementação:

- Sem tela de detalhe/modal por item — toque no "+" já adiciona.
- O botão "+" vira contador inline (−/+) no lugar, sem navegar para carrinho separado.
- Barra de resumo sempre visível e fixa na base, atualiza ao vivo.
- Cardápio é app web nativo — nunca PDF ou link para rede social.
- "Chamar atendente" sempre visível, mesmo peso do botão principal.
- Wifi liberado é requisito de onboarding, não opcional.

## Arquitetura

Serverless, não VPS/Terraform — alinhado com operação enxuta.

| Componente | Solução | Onde no repo |
|---|---|---|
| Cardápio + checkout (cliente) | Next.js PWA, Vercel | `app/(cliente)/[loja]/**` |
| Painel cozinha / caixa | Mesmo app, telas separadas, Supabase Realtime | `app/(painel)/**` |
| Webhook Asaas | Vercel Function | `app/api/webhooks/asaas/route.ts` |
| Banco de dados | Supabase (Postgres) | `supabase/migrations/`, `lib/types/database.ts` |
| Onboarding via IA | Função serverless assíncrona | `app/api/onboarding/route.ts` |
| Import de cardápio | Scraping / API de parceiro | `app/api/import-cardapio/route.ts` |
| Agente de texto do cardápio | Sem RAG, cardápio inteiro no prompt | `app/api/agente/route.ts`, `lib/agente/` |

`[loja]` nas rotas é o `id` (uuid) da loja — o QR code do balcão aponta
direto pra URL, sem slug/busca.

Diagramas de fluxo (pedido Pix online, pedido pago no caixa, mapa de
dependências) ficam em `docs/diagramas/` — YAML como fonte de verdade,
`.excalidraw` sempre gerado, nunca editado à mão. Ver
`docs/diagramas/README.md` pra regenerar depois de mudar o fluxo.

## Pagamento (Asaas)

- Cada restaurante tem subconta Asaas própria (`lojas.asaas_wallet_id`),
  criada via API durante o onboarding — exige CNPJ.
- Cobrança Pix em nome da loja, com split automático de comissão para a
  Aurora. Dinheiro cai direto na subconta do lojista — a Aurora nunca fica
  no meio do fluxo financeiro (evita bitributação e licença de instituição
  de pagamento).
- Duas opções no checkout: **Pix online** (libera cozinha via webhook) ou
  **pagar no caixa** (Pix manual, dinheiro, cartão, VR/VA — confirmação
  manual pelo operador do caixa).
- Nota fiscal emitida via API do Asaas, usando CNPJ/certificado A1 da
  subconta do lojista — sem provedor separado.
- **Nunca implementar** fluxo que centraliza dinheiro numa conta única da
  Aurora para repasse manual (ver decisões descartadas).

## Onboarding (AI-first)

Ordem de implementação das fontes de importação de cardápio:
1. Link de cardápio existente (scraping) — **Fase 1**, já com stub em `app/api/import-cardapio/`.
2. iFood (token do Portal do Parceiro) — Fase 2.
3. 99Food / Keeta — Fase 2.
4. Foto/PDF via OCR — Fase 2.

**Preço, NCM e split são sempre confirmados por um humano** antes de
aplicados — nenhuma rota deve gravar esses campos direto no cardápio
publicado sem esse passo.

## Agente de IA do cardápio

- Texto, não voz (custo de TTS/STT não compensa; ElevenLabs reservado pra branding).
- Contexto = cardápio inteiro injetado como JSON no prompt — sem RAG/base vetorial.
- Tom: respostas curtas (1-2 frases), sem "Claro!"/"Perfeito!", não repete a
  pergunta, admite quando não sabe. Ver `lib/agente/system-prompt.ts` — o
  prompt completo do anexo de prompts do projeto ainda precisa substituir o
  stub atual.
- Vetorial só faria sentido para: casar itens de import de concorrente
  (embeddings), busca cross-restaurante futura, base de conhecimento de
  suporte grande. Não implementar antes disso ser necessário.

## Schema (núcleo)

Ver `supabase/migrations/0001_init.sql` (fonte de verdade) e
`lib/types/database.ts` (espelho TS — manter os dois sincronizados).

Tabelas: `lojas`, `itens` (com `preco_atualizado_em` — ver seção de
confiança abaixo), `pedidos`, `pedido_itens`, `eventos_funil`.

Status do pedido: `aguardando_pagamento_pix | aguardando_pagamento_caixa |
pago | preparando | pronto | retirado`. Transições válidas estão
centralizadas em `lib/pedidos/status.ts` (`transicaoValida`) — não avançar
status fora dessa máquina de estados nem duplicar a tabela em outro lugar.

## Confiança e transparência

Pesquisa de campo revelou desconfiança de consumidores com alteração de
preço não avisada. Todo item exibe `preco_atualizado_em` de forma visível —
diferencial que nenhum concorrente mapeado oferece. Não remover essa
informação da UI do cardápio.

## Marca — paleta "Aurora Boreal"

Definida em `app/globals.css` como tokens Tailwind (`aurora-night`,
`aurora-night-2`, `aurora-violet`, `aurora-glow`, `aurora-magenta`,
`aurora-ice`, `aurora-mist`).

**Regra de acessibilidade — não violar:** a paleta escura é para
marca/marketing/landing. O fluxo real de pedido (`app/(cliente)/**`) usa a
classe `.fluxo-pedido` (fundo claro, texto escuro, fonte maior) definida no
mesmo arquivo — legibilidade prioriza sobre identidade visual nessa camada.
Qualquer nova tela de pedido do cliente deve herdar esse layout, não o tema
escuro.

## Práticas de engenharia (convenção permanente — sempre seguir)

Instrução permanente do fundador: clean code, TDD e boa cobertura de teste,
programando contra interfaces. Vale para todo código novo neste repo, não só
para o que já existe.

**Programar para interface, não para implementação concreta.** Lógica de
negócio nunca importa Supabase/Asaas direto — depende de uma interface
TypeScript, e quem decide a implementação real é a borda mais fina possível
(a rota de API). Padrão do repo:

- `lib/<domínio>/repository.ts` — interface de acesso a dados (ex.:
  `PedidosRepository`, `LojasRepository`).
- `lib/<domínio>/supabase-repository.ts` — implementação real, só chamada
  pela rota de API.
- `lib/asaas/types.ts` — interface `PagamentoProvider`; `lib/asaas/client.ts`
  implementa e exporta `asaasPagamentoProvider`.
- `lib/<domínio>/<caso-de-uso>.ts` — função pura de caso de uso, recebe as
  dependências (repositório, provider) por parâmetro (`deps`), nunca as
  importa direto. Ex.: `criarPedido`, `atualizarStatusPedido`,
  `iniciarOnboarding`.
- `app/api/**/route.ts` — adapter fino: parseia `Request`, injeta as
  implementações reais, chama o caso de uso, mapeia o resultado pra
  `NextResponse`. Não deve conter lógica de negócio.

Exemplo de referência completo: `lib/pedidos/criar-pedido.ts` +
`lib/pedidos/repository.ts` + `lib/pedidos/supabase-repository.ts` +
`app/api/pedidos/route.ts`.

**TDD.** Escrever o teste do caso de uso (ou da função pura) antes ou junto
da implementação, usando fakes em memória das interfaces — não mocks de
framework, não uma instância real de Supabase. Fakes reutilizáveis ficam em
`test/fakes/*.fake.ts` (`criarPedidosRepositoryFake`,
`criarPagamentoProviderFake`, `criarLojasRepositoryFake`); crie um fake novo
lá quando surgir uma interface nova, em vez de mockar o módulo inteiro
inline em cada teste.

**Cobertura.** `npm run test:coverage` roda com `vitest.config.mts` —
thresholds de 80% linhas/statements/functions, 75% branches. O `include` do
coverage cobre `lib/**` e `app/**`, mas o `exclude` tira do gate os
adaptadores finos de I/O que não carregam lógica própria: implementações
`*-supabase-repository.ts`, `lib/asaas/client.ts`, `lib/supabase/client.ts` e
`server.ts`, `app/**/page.tsx`, `app/**/layout.tsx`, e as rotas que ainda
não foram migradas pro padrão caso-de-uso+interface (`app/api/agente`,
`app/api/import-cardapio`, `app/api/onboarding`, `app/api/webhooks/asaas`).
Ao migrar uma dessas rotas pro padrão (extrair caso de uso testável), tire a
exclusão dela do `vitest.config.mts` e escreva os testes correspondentes —
não deixe a exclusão como padrão permanente pra rota nova.

Componentes React com lógica real (não só markup) — interação de carrinho,
assinatura Realtime, cálculo — têm teste com Testing Library
(`@testing-library/react` + `@testing-library/user-event`). `page.tsx` e
`layout.tsx` (Server Components com `params` assíncrono, sem lógica própria
além de buscar dados e delegar pro componente client) ficam fora do gate,
mas ganham cobertura indireta pelo teste do componente client que renderizam.

**Clean code.** Funções pequenas e com um motivo pra existir; nomes em
português consistentes com o resto do domínio (`criarPedido`, não
`createOrder`); sem duplicação — cálculo de total/contagem de carrinho vive
uma vez em `lib/carrinho/calculos.ts` e é reusado tanto no cardápio quanto
no checkout, não recalculado inline em cada componente.

## Modelo de negócio

Direção decidida: migrar de mensalidade fixa para **% sobre volume
processado via Pix** (referência inicial 1,5–2%, campo
`lojas.comissao_percentual`), viabilizado pelo split automático do Asaas.
Plano de preços fixo da landing (Grátis / Balcão R$89,90 / Rede sob
consulta) está pendente de validação contra esse modelo — não tratar como
definitivo ao implementar cobrança.

## Decisões explicitamente descartadas — não reintroduzir

- VPS + Terraform como infra principal.
- Base vetorial para o cardápio do agente de IA.
- ElevenLabs (voz) para utilidade do agente — só cogitar para branding.
- Split via AbacatePay (sem marketplace split disponível).
- Processar 100% do dinheiro numa conta central da Aurora com repasse manual.
- Wallet como cartão real via NFC (tap-to-pay) — exige licenciamento de emissor/BaaS.

## Roadmap

- **Fase 1 (MVP, em andamento neste harness):** cardápio + checkout PWA,
  Pix via Asaas, painel cozinha, pagar no caixa, import via link, agente de
  texto, nota fiscal via Asaas.
- **Fase 2:** import iFood/99Food/Keeta, import por foto/OCR, painel caixa dedicado.
- **Fase 3:** por peso (balança gera ticket com QR próprio).
- **Fase 4:** fidelidade (Wallet Pass, saldo pré-pago via QR).
- **Fase 5 (exploratório):** fila-zero preditiva, praça de alimentação
  unificada, agente autônomo de operação, preço dinâmico.

## Backlog

- **Revisão de segurança OWASP Top 10** — antes de sair do MVP pra produção
  com dinheiro de verdade fluindo (Pix, split, subconta do lojista). A skill
  `security-review` não roda no ambiente deste harness (precisa de cwd fixo
  em raiz de repo git, que este runner não garante entre chamadas) — a
  revisão abaixo foi feita manualmente lendo o código, seguindo a mesma
  estrutura. Reavaliar com a skill quando o ambiente permitir.

  **Já corrigido nesta revisão:**
  - **A01/A04 — price tampering em `POST /api/pedidos`:** o payload aceitava
    `preco` vindo direto do client, sem validar contra o cardápio real —
    dava pra criar pedido com qualquer valor. Corrigido em
    `lib/pedidos/criar-pedido.ts`: o caso de uso agora só aceita
    `{itemId, quantidade}` do client e resolve o preço real via
    `PedidosRepository.buscarItensDisponiveis(lojaId, itemIds)`, que também
    valida que o item pertence à loja e está disponível. Teste de regressão
    em `criar-pedido.test.ts` ("ignora qualquer 'preco' enviado no
    payload").
  - **A01/A04 — webhook do Asaas fail-open:** se `ASAAS_WEBHOOK_TOKEN` não
    estivesse configurada, `app/api/webhooks/asaas/route.ts` pulava a
    checagem inteira e aceitava qualquer POST como pagamento confirmado.
    Corrigido pra fail closed (500 sem token configurada, 401 sem bater) +
    comparação em tempo constante (`timingSafeEqual`). Teste em
    `route.test.ts`.

  **Também corrigido — A01/A07 Broken Access Control / Authentication:**
  `PATCH /api/pedidos/[pedidoId]/status` e as rotas de painel
  (`app/(painel)/cozinha`, `app/(painel)/caixa`) não tinham nenhuma
  autenticação — um cliente mal-intencionado podia chamar `PATCH` direto do
  DevTools (o `pedidoId` fica na própria URL que ele recebe após o
  checkout) e avançar o próprio pedido "pagar no caixa" pra `pago` sem
  pagar nada. Resolvido com Supabase Auth:
  - `supabase/migrations/0002_loja_usuarios.sql` — tabela de associação
    usuário↔loja (RLS: cada usuário só lê as próprias associações).
  - `lib/auth/repository.ts` (interface `AutorizacaoRepository`) +
    `supabase-repository.ts` (implementação via cookies de sessão) +
    `exigir-acesso-loja.ts` (caso de uso puro, testado com fake — mesmo
    padrão de `lib/pedidos/`).
  - `PATCH /api/pedidos/[pedidoId]/status` busca a loja do pedido e chama
    `exigirAcessoALoja` antes de aplicar qualquer transição — 401 sem
    sessão, 403 se a sessão não pertence àquela loja.
  - Páginas de painel usam `lib/auth/proteger-pagina-painel.ts`: sem sessão
    manda pro `/login` (com `next` de volta); com sessão mas sem acesso
    àquela loja, mostra "você não tem acesso" em vez de redirecionar de
    novo pro login.
  - `app/(painel)/login/` (Supabase Auth email/senha) e botão de logout no
    header dos painéis. `proxy.ts` (convenção Next 16 — antigo middleware.ts) refresca o token de sessão a cada
    request (padrão `@supabase/ssr` — sem isso a sessão expira em silêncio
    no meio do uso).
  - **Fora de escopo, de propósito:** cadastro de operador/dono
    (`loja_usuarios`) ainda não tem fluxo de convite — hoje só dá pra
    inserir linha via service role/dashboard do Supabase manualmente. Isso
    entra junto do onboarding de equipe, uma feature própria, não parte
    deste fix de segurança pontual. RLS de `insert`/`update` em
    `itens`/`pedidos` continua dependendo inteiramente da service role
    usada pelas rotas (a autorização acontece na rota, não na policy) —
    aceitável enquanto todo acesso de escrita passa por essas rotas, mas
    vale revisar se algum dia houver acesso direto ao Supabase fora delas.
  - **Modo demo sem Supabase configurado:** quando `NEXT_PUBLIC_SUPABASE_URL`
    não está setada, painéis pulam a checagem de auth (não há sessão
    possível de qualquer forma) e caem no fallback de lista vazia já
    existente — só pra navegar a UI localmente sem projeto Supabase real.

  - **A02 Cryptographic Failures:** conferir que `SUPABASE_SERVICE_ROLE_KEY`,
    `ASAAS_API_KEY` e o certificado A1 do lojista nunca chegam ao client
    (hoje só usados em `lib/*/supabase-repository.ts` e `lib/asaas/client.ts`,
    que rodam server-side — validar que segue assim conforme o código cresce).
  - **A03 Injection:** baixo risco hoje (Supabase client parametriza queries),
    mas o scraper de import de cardápio (`app/api/import-cardapio`, ainda
    não implementado) vai processar HTML de terceiro — tratar como entrada
    não confiável quando for implementado.
  - **A04 Insecure Design (resto):** o webhook valida só o token
    compartilhado, ainda falta validar a assinatura oficial do Asaas quando
    a integração for implementada de verdade contra o sandbox.
  - **A05 Security Misconfiguration:** revisar headers de segurança do Next
    (CSP, HSTS) antes do deploy Vercel — nada configurado ainda.
  - **A08 Software and Data Integrity Failures:** coberto pela máquina de
    estados (`lib/pedidos/status.ts`), mas depende de A01 ser resolvido pra
    valer alguma coisa (ver acima).
  - **A09 Security Logging and Monitoring Failures:** nenhum log estruturado
    de eventos sensíveis (confirmação de pagamento, mudança de status,
    onboarding) — avaliar antes de produção.

- **Corrigido — ciclo do pedido travava em "pronto":** revisando as
  jornadas de ponta a ponta (não é achado de segurança, é gap funcional),
  nenhum painel buscava pedidos com status `pronto` nem tinha ação pra
  `pronto → retirado` — o pedido nunca saía da tela da cozinha depois de
  pronto. Corrigido: `app/(painel)/cozinha/[loja]/page.tsx` busca também
  `pronto`, `fila-cozinha.tsx` ganhou o botão "Marcar retirado".

- **Ainda falta, pra jornadas 100% fechadas localmente:**
  - **Sem tela de cadastro (signup)** — só login
    (`app/(painel)/login/login-form.tsx` usa só `signInWithPassword`). O
    primeiro usuário de cada loja precisa ser criado no dashboard do
    Supabase (Authentication → Users → Add user) e linkado manualmente em
    `loja_usuarios` — ver `supabase/seed.sql` e o passo a passo no README.
  - **Fluxo de convite de operador** — mesma raiz do item acima, mas como
    feature própria (dono convida operador de caixa/cozinha), não só "criar
    o primeiro usuário".
  - **Pix online precisa de túnel público** (ngrok ou similar) apontando
    pra `/api/webhooks/asaas` pra testar localmente — Asaas sandbox não
    alcança `localhost`. A jornada "pagar no caixa" não tem essa
    dependência.

## Estado atual do harness

Scaffold inicial: Next.js 16 (App Router) + Tailwind 4 + TypeScript,
integrações Supabase/Asaas como stubs tipados, schema completo em
migrations (incluindo `loja_usuarios` pra autorização) + `seed.sql` com uma
loja de teste e cardápio, autenticação de painel via Supabase Auth, todas
as telas da Fase 1 com o ciclo do pedido fechado de ponta a ponta (pago →
preparando → pronto → retirado) — dados de exemplo/mocks só entram quando
não há projeto Supabase real conectado.

Testes: Vitest + Testing Library, ~95 testes cobrindo os casos de uso de
pedidos/onboarding/autorização (via fakes das interfaces), os cálculos de
carrinho, a máquina de estados de status, os componentes de
cardápio/painéis/login/acompanhamento de pedido, e três adapters HTTP
(`app/api/pedidos/route.ts`, `.../status/route.ts`,
`.../webhooks/asaas/route.ts`). Rodar com `npm test` ou
`npm run test:coverage`. Ver seção "Práticas de engenharia" acima antes de
adicionar código novo.

Próximos passos naturais: provisionar o projeto Supabase real e seguir o
passo a passo do README ("Rodando com todas as jornadas funcionando") —
migrations, seed, primeiro usuário, `.env.local`; criar conta Asaas
sandbox pra testar Pix online (com túnel); desenhar o fluxo de convite de
operador (hoje `loja_usuarios` só é populável manualmente); e migrar as
rotas ainda sem caso de uso extraído (agente, import-cardapio, webhook
Asaas) pro mesmo padrão de interface — ver a lista de exclusões do
coverage gate em `vitest.config.mts`.
