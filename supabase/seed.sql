-- Dados de exemplo pra testar localmente com todas as jornadas — o
-- Supabase CLI roda este arquivo sozinho depois das migrations em
-- `supabase db reset` / `supabase start`. Nunca aplicar em produção.
--
-- Depois de rodar isso, ainda falta um passo manual (não dá pra fazer via
-- SQL puro): criar um usuário no Supabase Auth (Authentication → Users →
-- Add user, no dashboard, ou `supabase auth admin`) e linkar ele à loja:
--
--   insert into loja_usuarios (loja_id, user_id)
--   values ('11111111-1111-1111-1111-111111111111', '<uuid-do-usuario>');
--
-- Com isso: /11111111-1111-1111-1111-111111111111/menu monta o pedido,
-- /login entra no painel, /cozinha e /caixa dessa mesma loja funcionam.

insert into lojas (id, nome, cnpj, regime_fiscal, comissao_percentual)
values (
  '11111111-1111-1111-1111-111111111111',
  'Aurora Burger (loja de teste)',
  '00.000.000/0001-00',
  'simples_nacional',
  1.5
)
on conflict (id) do nothing;

-- ids fixos (não gen_random_uuid()) pra "on conflict" funcionar de
-- verdade — sem isso, rodar o seed duas vezes sem `db reset` duplicaria
-- os itens, já que um uuid aleatório nunca colide consigo mesmo.
insert into itens (id, loja_id, categoria, nome, preco, disponivel)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Lanches', 'X-Salada', 24.90, true),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Lanches', 'X-Bacon', 28.90, true),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Bebidas', 'Suco natural', 9.50, true),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Bebidas', 'Refrigerante lata', 7.00, true)
on conflict (id) do nothing;
