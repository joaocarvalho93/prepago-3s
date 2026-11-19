// Cálculo do fit de aderência, conforme o racional da ferramenta comercial (docs/13-modulo-proposta.md).
import type { StatusItem } from "./diagnostico";
import { ITENS_DIAGNOSTICO, type ItemDiagnostico } from "./itens";

export type Classificacao = "sem_fit" | "baixa" | "media" | "alta";

export const NOME_CLASSIFICACAO: Record<Classificacao, string> = {
  sem_fit: "Sem fit com a 3S",
  baixa: "Baixa aderência",
  media: "Média aderência",
  alta: "Alta aderência",
};

export interface FitAderencia {
  pct: number; // 0 a 100, uma casa decimal
  classificacao: Classificacao;
  nItensValidos: number;
  nItensEncontrados: number;
}

/** Faixas: 0–20 sem fit · 21–50 baixa · 51–79 média · 80–100 alta (com o percentual arredondado). */
export function classificar(pct: number): Classificacao {
  const p = Math.round(pct);
  if (p <= 20) return "sem_fit";
  if (p <= 50) return "baixa";
  if (p <= 79) return "media";
  return "alta";
}

/**
 * Não possui, Crítico/Manual e Resolvido: o item conta com o peso integral (mesmo com peso 0).
 * N/A: o item sai do numerador e do denominador.
 * Aderência = soma dos pesos / número de itens válidos.
 */
export function calcularAderencia(respostas: Record<number, StatusItem>, itens: ItemDiagnostico[] = ITENS_DIAGNOSTICO): FitAderencia {
  let soma = 0;
  let validos = 0;
  let encontrados = 0;
  for (const i of itens) {
    const st = respostas[i.id];
    if (!st) continue;
    encontrados++;
    if (st === "na") continue;
    validos++;
    soma += i.peso;
  }
  const pct = validos ? Math.round((soma / validos) * 10) / 10 : 0;
  return { pct, classificacao: classificar(pct), nItensValidos: validos, nItensEncontrados: encontrados };
}
