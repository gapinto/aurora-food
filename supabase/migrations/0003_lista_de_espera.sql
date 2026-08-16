-- Lista de espera da landing page — playbook Nubank de early access por
-- convite: quem se cadastra entra na fila, o time convida manualmente
-- (cria a loja + usuário + linha em loja_usuarios) quando decide liberar.
-- Sem fluxo de convite automatizado ainda — ver CLAUDE.md/Backlog.
create table lista_de_espera (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  nome_restaurante text,
  criado_em timestamptz not null default now()
);

-- RLS habilitada sem nenhuma policy: só a service role (usada por
-- app/api/lista-espera/route.ts) lê ou escreve aqui. Mesmo padrão de
-- escrita usado no resto do app — nunca expor insert direto pro client
-- anônimo, mesmo pra um formulário público (evita spam sem validação do
-- lado do servidor e protege os e-mails de serem lidos via anon key).
alter table lista_de_espera enable row level security;
