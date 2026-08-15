-- Schema núcleo do Aurora Food.
-- Espelha lib/types/database.ts — mantenha os dois em sincronia.

create extension if not exists "pgcrypto";

create type regime_fiscal as enum (
  'mei',
  'simples_nacional',
  'lucro_presumido',
  'lucro_real'
);

create type forma_pagamento as enum (
  'pix_online',
  'caixa'
);

create type status_pedido as enum (
  'aguardando_pagamento_pix',
  'aguardando_pagamento_caixa',
  'pago',
  'preparando',
  'pronto',
  'retirado'
);

create type tipo_evento_funil as enum (
  'visitou',
  'add_item',
  'checkout_iniciado',
  'pago'
);

create table lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  regime_fiscal regime_fiscal not null,
  -- preenchido depois que a subconta Asaas é criada durante o onboarding.
  asaas_wallet_id text unique,
  comissao_percentual numeric(5, 2) not null default 1.5,
  criado_em timestamptz not null default now()
);

create table itens (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id) on delete cascade,
  categoria text not null,
  nome text not null,
  preco numeric(10, 2) not null,
  foto_url text,
  ncm text,
  disponivel boolean not null default true,
  -- transparência de preço (seção 9): timestamp exibido de forma visível no item.
  preco_atualizado_em timestamptz not null default now()
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id) on delete restrict,
  valor_total numeric(10, 2) not null,
  forma_pagamento forma_pagamento not null,
  status status_pedido not null default 'aguardando_pagamento_pix',
  asaas_charge_id text,
  senha text not null,
  pago_por text,
  criado_em timestamptz not null default now()
);

create table pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos (id) on delete cascade,
  item_id uuid not null references itens (id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null
);

create table eventos_funil (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id) on delete cascade,
  sessao_id text not null,
  tipo tipo_evento_funil not null,
  criado_em timestamptz not null default now()
);

create index itens_loja_id_idx on itens (loja_id);
create index pedidos_loja_id_idx on pedidos (loja_id);
create index pedidos_status_idx on pedidos (status);
create index pedido_itens_pedido_id_idx on pedido_itens (pedido_id);
create index eventos_funil_loja_id_idx on eventos_funil (loja_id);
create index eventos_funil_sessao_id_idx on eventos_funil (sessao_id);

-- RLS: cardápio e status de pedido são consultados publicamente (QR code sem
-- login); escrita de pedidos/itens fica restrita ao service role usado nas
-- rotas serverless. Ajustar policies quando o painel do lojista existir.
alter table lojas enable row level security;
alter table itens enable row level security;
alter table pedidos enable row level security;
alter table pedido_itens enable row level security;
alter table eventos_funil enable row level security;

create policy "itens_disponiveis_sao_publicos" on itens
  for select using (disponivel = true);

create policy "pedidos_sao_publicos_para_leitura" on pedidos
  for select using (true);

create policy "pedido_itens_sao_publicos_para_leitura" on pedido_itens
  for select using (true);
