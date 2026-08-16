import { createServiceRoleClient } from "@/lib/supabase/server";

import type {
  ItemDisponivel,
  LinhaPedidoInput,
  LojaResumoPagamento,
  NovoPedidoInput,
  PedidoCriado,
  PedidosRepository,
} from "./repository";

export const supabasePedidosRepository: PedidosRepository = {
  async criarPedido(input: NovoPedidoInput): Promise<PedidoCriado | null> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("pedidos")
      .insert({
        loja_id: input.lojaId,
        valor_total: input.valorTotal,
        forma_pagamento: input.formaPagamento,
        status: input.status,
        senha: input.senha,
      })
      .select()
      .single();

    if (error || !data) return null;
    return { id: data.id, senha: data.senha };
  },

  async criarItensPedido(pedidoId: string, linhas: LinhaPedidoInput[]): Promise<boolean> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("pedido_itens").insert(
      linhas.map((linha) => ({
        pedido_id: pedidoId,
        item_id: linha.itemId,
        quantidade: linha.quantidade,
        preco_unitario: linha.preco,
      })),
    );
    return !error;
  },

  async buscarItensDisponiveis(lojaId: string, itemIds: string[]): Promise<ItemDisponivel[]> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("itens")
      .select("id, preco")
      .eq("loja_id", lojaId)
      .eq("disponivel", true)
      .in("id", itemIds);

    return data ?? [];
  },

  async buscarLojaParaPagamento(lojaId: string): Promise<LojaResumoPagamento | null> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("lojas")
      .select("asaas_wallet_id, comissao_percentual")
      .eq("id", lojaId)
      .single();

    if (!data) return null;
    return { asaasWalletId: data.asaas_wallet_id, comissaoPercentual: data.comissao_percentual };
  },

  async atualizarChargeId(pedidoId: string, chargeId: string): Promise<void> {
    const supabase = createServiceRoleClient();
    await supabase.from("pedidos").update({ asaas_charge_id: chargeId }).eq("id", pedidoId);
  },

  async buscarLojaDoPedido(pedidoId: string): Promise<string | null> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from("pedidos").select("loja_id").eq("id", pedidoId).single();
    return data?.loja_id ?? null;
  },

  async buscarChargeIdDoPedido(pedidoId: string): Promise<string | null> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("pedidos")
      .select("asaas_charge_id")
      .eq("id", pedidoId)
      .single();
    return data?.asaas_charge_id ?? null;
  },

  async buscarStatusAtual(pedidoId: string) {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from("pedidos").select("status").eq("id", pedidoId).single();
    return data?.status ?? null;
  },

  async atualizarStatus(pedidoId: string, status) {
    const supabase = createServiceRoleClient();
    await supabase.from("pedidos").update({ status }).eq("id", pedidoId);
  },

  async confirmarPagamentoPix(chargeId: string): Promise<boolean> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "pago" })
      .eq("asaas_charge_id", chargeId)
      .eq("status", "aguardando_pagamento_pix");
    return !error;
  },
};
