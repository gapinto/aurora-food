// Tipos hand-written que espelham supabase/migrations/0001_init.sql.
// Quando o projeto Supabase existir de verdade, substituir por tipos gerados
// (`supabase gen types typescript`) e apagar este arquivo.

export type RegimeFiscal = "mei" | "simples_nacional" | "lucro_presumido" | "lucro_real";

export type FormaPagamento = "pix_online" | "caixa";

export type StatusPedido =
  | "aguardando_pagamento_pix"
  | "aguardando_pagamento_caixa"
  | "pago"
  | "preparando"
  | "pronto"
  | "retirado";

export type TipoEventoFunil = "visitou" | "add_item" | "checkout_iniciado" | "pago";

// `type`, não `interface`: interfaces não satisfazem os checks estruturais
// de `Record<string, unknown>` que o @supabase/postgrest-js faz sobre
// Row/Insert/Update, e o client inteiro degrada silenciosamente pra `never`.
export type Loja = {
  id: string;
  nome: string;
  cnpj: string;
  regime_fiscal: RegimeFiscal;
  asaas_wallet_id: string | null;
  comissao_percentual: number;
  criado_em: string;
};

export type Item = {
  id: string;
  loja_id: string;
  categoria: string;
  nome: string;
  preco: number;
  foto_url: string | null;
  ncm: string | null;
  disponivel: boolean;
  // Transparência de preço (seção 9) — exibido de forma visível no item.
  preco_atualizado_em: string;
};

export type Pedido = {
  id: string;
  loja_id: string;
  valor_total: number;
  forma_pagamento: FormaPagamento;
  status: StatusPedido;
  asaas_charge_id: string | null;
  senha: string;
  pago_por: string | null;
  criado_em: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  item_id: string;
  quantidade: number;
  preco_unitario: number;
};

export type EventoFunil = {
  id: string;
  loja_id: string;
  sessao_id: string;
  tipo: TipoEventoFunil;
  criado_em: string;
};

// Associação usuário (Supabase Auth) ↔ loja — base da autorização do
// painel e da rota de status de pedido (ver lib/auth/).
export type LojaUsuario = {
  loja_id: string;
  user_id: string;
  criado_em: string;
};

// Shape mínimo exigido pelo generic `Database` do @supabase/postgrest-js —
// quando gerado via `supabase gen types typescript`, esses campos vêm
// preenchidos automaticamente a partir do schema real.
type SemRelacionamentos = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      lojas: { Row: Loja; Insert: Partial<Loja>; Update: Partial<Loja> } & SemRelacionamentos;
      itens: { Row: Item; Insert: Partial<Item>; Update: Partial<Item> } & SemRelacionamentos;
      pedidos: { Row: Pedido; Insert: Partial<Pedido>; Update: Partial<Pedido> } & SemRelacionamentos;
      pedido_itens: {
        Row: PedidoItem;
        Insert: Partial<PedidoItem>;
        Update: Partial<PedidoItem>;
      } & SemRelacionamentos;
      eventos_funil: {
        Row: EventoFunil;
        Insert: Partial<EventoFunil>;
        Update: Partial<EventoFunil>;
      } & SemRelacionamentos;
      loja_usuarios: {
        Row: LojaUsuario;
        Insert: Partial<LojaUsuario>;
        Update: Partial<LojaUsuario>;
      } & SemRelacionamentos;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      regime_fiscal: RegimeFiscal;
      forma_pagamento: FormaPagamento;
      status_pedido: StatusPedido;
      tipo_evento_funil: TipoEventoFunil;
    };
    CompositeTypes: Record<string, never>;
  };
};
