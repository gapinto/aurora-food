// Wrapper fino sobre a API do Asaas. Cada loja tem sua própria subconta
// (wallet); o split de comissão da Aurora é aplicado na cobrança, e o
// dinheiro cai direto na subconta do lojista (ver spec seção 3).
//
// TODO Fase 1: implementar as chamadas reais (fetch para api.asaas.com/v3).
// Por ora expõe apenas os contratos usados pelo resto do app.

const ASAAS_BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

interface AsaasRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

async function asaasRequest<T>(path: string, options: AsaasRequestOptions = {}): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada");
  }

  const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Asaas ${path} respondeu ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export interface CriarSubcontaInput {
  nome: string;
  cnpj: string;
  email: string;
}

export interface CriarSubcontaResultado {
  walletId: string;
  apiKey: string;
}

export function criarSubconta(input: CriarSubcontaInput): Promise<CriarSubcontaResultado> {
  return asaasRequest("/accounts", { method: "POST", body: input });
}

export interface CriarCobrancaPixInput {
  walletId: string;
  valor: number;
  comissaoPercentual: number;
  descricao: string;
  pedidoId: string;
}

export interface CriarCobrancaPixResultado {
  chargeId: string;
  qrCodePayload: string;
  qrCodeImageBase64: string;
}

export function criarCobrancaPix(
  input: CriarCobrancaPixInput,
): Promise<CriarCobrancaPixResultado> {
  return asaasRequest("/pix/qrCodes", {
    method: "POST",
    body: {
      walletId: input.walletId,
      value: input.valor,
      description: input.descricao,
      externalReference: input.pedidoId,
      split: [{ walletId: process.env.ASAAS_AURORA_WALLET_ID, percentualValue: input.comissaoPercentual }],
    },
  });
}
