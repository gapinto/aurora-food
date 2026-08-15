export interface CartLine {
  itemId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export interface CartPayload {
  lojaSlug: string;
  linhas: CartLine[];
}

const STORAGE_KEY = "aurora-food:carrinho";

export function salvarCarrinho(payload: CartPayload) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// Cache por referência: useSyncExternalStore chama getSnapshot em toda
// renderização e compara por Object.is — se cada leitura retornasse um
// objeto novo do JSON.parse, o React entraria em loop de re-render infinito
// mesmo sem o conteúdo ter mudado.
let ultimoRaw: string | null = null;
let ultimoCarrinho: CartPayload | null = null;

export function lerCarrinho(): CartPayload | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === ultimoRaw) return ultimoCarrinho;

  ultimoRaw = raw;
  if (!raw) {
    ultimoCarrinho = null;
    return null;
  }
  try {
    ultimoCarrinho = JSON.parse(raw) as CartPayload;
  } catch {
    ultimoCarrinho = null;
  }
  return ultimoCarrinho;
}
