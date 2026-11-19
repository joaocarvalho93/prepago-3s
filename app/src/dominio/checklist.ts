// Checklist de informações do cliente (docs/02-fluxo.md). Também é o formulário de onboarding.
import type { RespostasFormulario } from "./tipos";

export type TipoCampo = "texto" | "arquivo" | "data" | "selecao" | "multipla" | "numero" | "area" | "email";

export interface Campo {
  nome: string;
  rotulo: string;
  tipo?: TipoCampo;
  opcoes?: string[];
  opcional?: boolean;
}

export interface ItemChecklist {
  chave: string;
  titulo: string;
  descricao: string;
  campos: Campo[];
}

export const CHECKLIST: ItemChecklist[] = [
  { chave: "cardapio", titulo: "Cardápio completo", descricao: "Itens, preços, modificadores e combos",
    campos: [{ nome: "arq", rotulo: "Arquivo do cardápio", tipo: "arquivo" }, { nome: "obs", rotulo: "Observações", opcional: true }] },
  { chave: "cert", titulo: "Certificado digital", descricao: "Certificado A1 válido",
    campos: [{ nome: "arq", rotulo: "Arquivo .pfx", tipo: "arquivo" }, { nome: "val", rotulo: "Validade", tipo: "data" }] },
  { chave: "fiscal", titulo: "Dados fiscais", descricao: "Informações para emissão de notas",
    campos: [{ nome: "cnpj", rotulo: "CNPJ" }, { nome: "ie", rotulo: "Inscrição estadual" },
      { nome: "reg", rotulo: "Regime tributário", tipo: "selecao", opcoes: ["Simples Nacional", "Lucro Presumido", "Lucro Real"] }] },
  { chave: "integ", titulo: "Integrações", descricao: "Canais e sistemas conectados ao PDV",
    campos: [{ nome: "lst", rotulo: "Integrações utilizadas", tipo: "multipla", opcoes: ["iFood", "Rappi", "ERP", "TEF", "Adquirente"] },
      { nome: "resp", rotulo: "Responsável pelas credenciais" }] },
  { chave: "acessos", titulo: "Acessos", descricao: "Usuários e perfis do sistema",
    campos: [{ nome: "usu", rotulo: "Nº de usuários", tipo: "numero" }, { nome: "perf", rotulo: "Perfis (ex.: caixa, gerente)" }] },
  { chave: "equip", titulo: "Equipamentos", descricao: "Inventário por loja",
    campos: [{ nome: "pdv", rotulo: "Nº de PDVs", tipo: "numero" }, { nome: "imp", rotulo: "Nº de impressoras", tipo: "numero" }] },
  { chave: "loja", titulo: "Particularidades da loja", descricao: "O que torna a operação única",
    campos: [{ nome: "desc", rotulo: "Layout, salão, mesas, fluxo de cozinha", tipo: "area" }] },
  { chave: "resp", titulo: "Responsável do cliente", descricao: "Ponto focal com poder de decisão",
    campos: [{ nome: "nome", rotulo: "Nome" }, { nome: "email", rotulo: "E-mail", tipo: "email" }, { nome: "tel", rotulo: "Telefone" }] },
];

export function itemCompleto(item: ItemChecklist, valores: Record<string, string | string[]> | undefined): boolean {
  return item.campos.every((c) => {
    if (c.opcional) return true;
    const v = valores?.[c.nome];
    return Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "";
  });
}

/** Percentual de itens completos. `undefined` quando o formulário ainda não foi gerado. */
export function percentualFormulario(respostas: RespostasFormulario | undefined): number {
  if (!respostas) return 0;
  const ok = CHECKLIST.filter((i) => itemCompleto(i, respostas[i.chave])).length;
  return Math.round((ok / CHECKLIST.length) * 100);
}
