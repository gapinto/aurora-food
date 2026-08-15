import type {
  CriarCobrancaPixInput,
  CriarCobrancaPixResultado,
  CriarSubcontaInput,
  CriarSubcontaResultado,
  PagamentoProvider,
} from "@/lib/asaas/types";

export function criarPagamentoProviderFake(options?: {
  falharAoCriarCobranca?: boolean;
  chargeIdGerado?: string;
  walletIdGerado?: string;
}) {
  const cobrancasCriadas: CriarCobrancaPixInput[] = [];
  const subcontasCriadas: CriarSubcontaInput[] = [];

  const provider: PagamentoProvider = {
    async criarSubconta(input: CriarSubcontaInput): Promise<CriarSubcontaResultado> {
      subcontasCriadas.push(input);
      return { walletId: options?.walletIdGerado ?? "wallet-fake", apiKey: "api-key-fake" };
    },

    async criarCobrancaPix(input: CriarCobrancaPixInput): Promise<CriarCobrancaPixResultado> {
      if (options?.falharAoCriarCobranca) {
        throw new Error("Asaas indisponível");
      }
      cobrancasCriadas.push(input);
      return {
        chargeId: options?.chargeIdGerado ?? "charge-fake",
        qrCodePayload: "00020126...",
        qrCodeImageBase64: "base64==",
      };
    },
  };

  return { provider, cobrancasCriadas, subcontasCriadas };
}
