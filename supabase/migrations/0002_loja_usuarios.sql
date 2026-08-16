-- Associação entre usuários do Supabase Auth e lojas — base da autorização
-- do painel (cozinha/caixa) e da rota de status de pedido. Resolve o
-- achado A01/A07 da revisão OWASP (CLAUDE.md/Backlog): antes disso, painel
-- e status não tinham nenhuma autenticação.
--
-- Sem policy de insert/update/delete pra usuários autenticados de
-- propósito: cadastro de operador é feito via service role (convite manual
-- pelo dono/suporte) até existir um fluxo de onboarding de equipe — ver
-- backlog.
create table loja_usuarios (
  loja_id uuid not null references lojas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (loja_id, user_id)
);

create index loja_usuarios_user_id_idx on loja_usuarios (user_id);

alter table loja_usuarios enable row level security;

create policy "usuario_ve_suas_proprias_associacoes" on loja_usuarios
  for select using (auth.uid() = user_id);
