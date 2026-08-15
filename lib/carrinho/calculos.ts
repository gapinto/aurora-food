export interface LinhaComPreco {
  preco: number;
  quantidade: number;
}

export function calcularTotalCarrinho(linhas: LinhaComPreco[]): number {
  return linhas.reduce((soma, linha) => soma + linha.preco * linha.quantidade, 0);
}

export function contarItensCarrinho(linhas: LinhaComPreco[]): number {
  return linhas.reduce((soma, linha) => soma + linha.quantidade, 0);
}
