import type {
  CriarCobrancaPixInput,
  CriarCobrancaPixResultado,
  CriarSubcontaInput,
  CriarSubcontaResultado,
  PagamentoProvider,
} from "./types";

// Implementação fake de PagamentoProvider pra rodar o fluxo Pix inteiro
// localmente sem conta Asaas real — só ativa com ASAAS_MOCK=true (ver
// lib/asaas/provider.ts). Formatos de campo inspirados na doc real do
// Asaas (POST /v3/accounts, POST /v3/pix/qrCodes) só o suficiente pra
// exercitar o resto do app com dados plausíveis; o `qrCodePayload` NÃO é
// um EMV/Pix válido de verdade — não escaneia, é só texto.
function logMock(acao: string) {
  console.warn(`[asaas mock] ${acao} — nenhuma chamada real foi feita.`);
}

function criarSubconta(input: CriarSubcontaInput): Promise<CriarSubcontaResultado> {
  logMock(`criarSubconta(cnpj=${input.cnpj})`);
  return Promise.resolve({
    walletId: `mock-wallet-${crypto.randomUUID()}`,
    apiKey: `$aact_mock_${crypto.randomUUID()}`,
  });
}

function criarCobrancaPix(input: CriarCobrancaPixInput): Promise<CriarCobrancaPixResultado> {
  logMock(`criarCobrancaPix(pedidoId=${input.pedidoId}, valor=${input.valor})`);
  const chargeId = `mock-pay-${crypto.randomUUID()}`;
  return Promise.resolve({
    chargeId,
    // Prefixo real de payload Pix (EMV "00020126..."), resto é placeholder —
    // suficiente pra não quebrar nada que espere uma string não-vazia.
    qrCodePayload: `00020126580014BR.GOV.BCB.PIX-MOCK-${chargeId}`,
    qrCodeImageBase64: "",
  });
}

export const asaasMockProvider: PagamentoProvider = {
  criarSubconta,
  criarCobrancaPix,
};
