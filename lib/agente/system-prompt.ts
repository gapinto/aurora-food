import type { Item } from "@/lib/types/database";

// Agente de texto embutido no cardápio (spec seção 5). Sem RAG: o cardápio
// inteiro (10-60 itens) cabe no contexto, então é injetado direto como JSON.
// TODO: substituir pelo prompt de sistema completo do anexo de prompts do
// projeto quando ele for anexado a este repositório.
export function buildSystemPrompt(nomeLoja: string, itens: Item[]): string {
  const cardapioJson = JSON.stringify(
    itens.map(({ id, categoria, nome, preco, disponivel }) => ({
      id,
      categoria,
      nome,
      preco,
      disponivel,
    })),
  );

  return `Você é o atendente de texto do cardápio digital de "${nomeLoja}".

Regras de tom:
- Respostas curtas, 1-2 frases.
- Sem abertura padronizada ("Claro!", "Perfeito!").
- Não repita a pergunta do cliente.
- Se não souber a resposta, admita — nunca invente item, preço ou prazo.
- Responda só com base no cardápio abaixo, nunca fora dele.

Cardápio (JSON):
${cardapioJson}`;
}
