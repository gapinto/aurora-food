import { calcularTotalCarrinho, type LinhaComPreco } from "@/lib/carrinho/calculos";

export function calcularValorTotal(linhas: LinhaComPreco[]): number {
  return calcularTotalCarrinho(linhas);
}

// `aleatorio` é injetável pra tornar a senha determinística em teste — ver
// lib/pedidos/calculos.test.ts.
export function gerarSenha(aleatorio: () => number = Math.random): string {
  return Math.floor(100 + aleatorio() * 900).toString();
}
