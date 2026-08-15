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
  com dinheiro de verdade fluindo (Pix, split, subconta do lojista). Pontos
  de atenção já identificados neste harness, por categoria OWASP:
  - **A01 Broken Access Control:** rotas de painel (`app/(painel)/cozinha`,
    `app/(painel)/caixa`) e os endpoints `PATCH /api/pedidos/[pedidoId]/status`
    não têm autenticação/autorização por loja — qualquer um com a URL avança
    status de pedido de qualquer loja. Falta também RLS além do `select`
    público em `supabase/migrations/0001_init.sql` (insert/update ainda
    dependem só da service role usada pelas rotas).
  - **A02 Cryptographic Failures:** conferir que `SUPABASE_SERVICE_ROLE_KEY`,
    `ASAAS_API_KEY` e o certificado A1 do lojista nunca chegam ao client
    (hoje só usados em `lib/*/supabase-repository.ts` e `lib/asaas/client.ts`,
    que rodam server-side — validar que segue assim conforme o código cresce).
  - **A03 Injection:** baixo risco hoje (Supabase client parametriza queries),
    mas o scraper de import de cardápio (`app/api/import-cardapio`, ainda
    não implementado) vai processar HTML de terceiro — tratar como entrada
    não confiável quando for implementado.
  - **A04 Insecure Design:** `app/api/webhooks/asaas/route.ts` já checa um
    token compartilhado (`ASAAS_WEBHOOK_TOKEN`), mas falta validar a
    assinatura oficial do Asaas quando a rota for implementada de verdade
    contra o sandbox; hoje o TODO no arquivo é só estrutural.
  - **A05 Security Misconfiguration:** revisar headers de segurança do Next
    (CSP, HSTS) antes do deploy Vercel — nada configurado ainda.
  - **A07 Identification and Authentication Failures:** todo o produto ainda
    não tem conceito de login pro dono da loja / operador de caixa-cozinha —
    é pré-requisito pra fechar A01 acima.
  - **A08 Software and Data Integrity Failures:** `app/api/pedidos/[pedidoId]/status/route.ts`
    já valida transição via `lib/pedidos/status.ts`, mas sem auth (A01) isso
    só impede pular etapa, não impede quem pode acionar.
  - **A09 Security Logging and Monitoring Failures:** nenhum log estruturado
    de eventos sensíveis (confirmação de pagamento, mudança de status,
    onboarding) — avaliar antes de produção.
  - Rodar a skill `security-review` sobre o diff acumulado quando essa
    revisão entrar em execução, e priorizar A01/A07 (autenticação e
    autorização) por serem os únicos que hoje têm exploração trivial.

## Estado atual do harness

Scaffold inicial: Next.js 16 (App Router) + Tailwind 4 + TypeScript,
integrações Supabase/Asaas como stubs tipados, schema completo em
migrations, todas as telas da Fase 1 com estrutura e UX corretas mas dados
de exemplo/mocks onde não há projeto Supabase real conectado ainda.

Testes: Vitest + Testing Library, ~70 testes cobrindo os casos de uso de
pedidos/onboarding (via fakes das interfaces), os cálculos de carrinho, a
máquina de estados de status, os componentes de cardápio/painéis/
acompanhamento de pedido, e os dois adapters HTTP mais centrais
(`app/api/pedidos/route.ts`, `.../status/route.ts`). Rodar com `npm test`
ou `npm run test:coverage`. Ver seção "Práticas de engenharia" acima antes
de adicionar código novo.

Próximos passos naturais: provisionar o projeto Supabase real e rodar a
migration, criar conta Asaas sandbox e preencher `.env.local` (a partir de
`.env.example`), substituir os dados de exemplo do cardápio por dados reais
de uma loja de teste, e migrar as rotas ainda sem caso de uso extraído
(agente, import-cardapio, webhook Asaas) pro mesmo padrão de interface —
ver a lista de exclusões do coverage gate em `vitest.config.mts`.
