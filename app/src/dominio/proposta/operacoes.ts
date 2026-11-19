// Operações do módulo de proposta sobre o estado do CRM (mesmo contrato de dominio/operacoes.ts).
import type { Resultado } from "../operacoes";
import type { Deal, EtapaDeal, Estado } from "../tipos";
import { NOME_CLASSIFICACAO } from "./aderencia";
import type { Diagnostico } from "./diagnostico";
import { CAMPOS_EDITAVEIS, gerarProposta, totais, type CampoEditavel, type Proposta } from "./gerador";

/** O diagnóstico pode ser anexado a partir da etapa Aderência. */
export const ETAPAS_ANEXAR_DIAGNOSTICO: EtapaDeal[] = ["ader", "prop", "neg"];
/** A proposta é gerada e editada nas etapas Proposta e Negociação. */
export const ETAPAS_PROPOSTA: EtapaDeal[] = ["prop", "neg"];

const registrar = (d: Deal, texto: string, em: Date) => d.atividades.unshift({ em: em.toISOString(), texto });
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function preparar(estado: Estado, dealId: string) {
  const e = structuredClone(estado);
  return { e, d: e.deals.find((x) => x.id === dealId) };
}

export function anexarDiagnostico(estado: Estado, dealId: string, diag: Diagnostico, agora = new Date()): Resultado {
  const { e, d } = preparar(estado, dealId);
  if (!d) return { ok: false, erro: "Deal não encontrado" };
  if (!ETAPAS_ANEXAR_DIAGNOSTICO.includes(d.etapa)) return { ok: false, erro: "O diagnóstico pode ser anexado a partir da etapa Aderência" };
  e.diagnosticos[dealId] = diag;
  registrar(d, `Diagnóstico anexado: ${diag.arquivo} (${Object.keys(diag.respostas).length}/100 itens)`, agora);
  return { ok: true, estado: e, aviso: "Diagnóstico anexado" };
}

export function removerDiagnostico(estado: Estado, dealId: string, agora = new Date()): Resultado {
  const { e, d } = preparar(estado, dealId);
  if (!d || !e.diagnosticos[dealId]) return { ok: false, erro: "Diagnóstico não encontrado" };
  delete e.diagnosticos[dealId];
  registrar(d, "Diagnóstico removido", agora);
  return { ok: true, estado: e, aviso: "Diagnóstico removido" };
}

/** Gera (ou gera de novo) a proposta inicial. Na regeração, mantém os campos editados à mão. */
export function gerarPropostaDoDeal(estado: Estado, dealId: string, agora = new Date()): Resultado {
  const { e, d } = preparar(estado, dealId);
  if (!d) return { ok: false, erro: "Deal não encontrado" };
  if (!ETAPAS_PROPOSTA.includes(d.etapa)) return { ok: false, erro: "A proposta é gerada nas etapas Proposta e Negociação" };
  const diag = e.diagnosticos[dealId];
  if (!diag) return { ok: false, erro: "Anexe o diagnóstico primeiro" };
  const anterior = e.propostas[dealId];
  const p = gerarProposta(d, diag, { anterior, agora });
  e.propostas[dealId] = p;
  const fit = p.fitAderencia ? ` · fit ${p.fitAderencia.pct.toLocaleString("pt-BR")}% (${NOME_CLASSIFICACAO[p.fitAderencia.classificacao]})` : "";
  registrar(d, `${anterior ? "Proposta gerada novamente" : "Proposta inicial gerada"}${fit} · ${reais(totais(p).mensalidadeLoja)}/loja`, agora);
  return { ok: true, estado: e, aviso: anterior ? "Proposta gerada novamente. Suas edições foram mantidas" : "Proposta inicial gerada" };
}

/** Edição manual de um campo. Marca o campo como editado para não ser sobrescrito. */
export function editarProposta<K extends CampoEditavel>(estado: Estado, dealId: string, campo: K, valor: Proposta[K], agora = new Date()): Resultado {
  if (!(CAMPOS_EDITAVEIS as readonly string[]).includes(campo)) return { ok: false, erro: `Campo não editável: ${campo}` };
  const { e } = preparar(estado, dealId);
  const p = e.propostas[dealId];
  if (!p) return { ok: false, erro: "Proposta não encontrada" };
  p[campo] = valor;
  if (!p.editados.includes(campo)) p.editados.push(campo);
  p.dataModificacao = agora.toISOString();
  return { ok: true, estado: e, aviso: "Salvo" };
}

/** Leva os valores da proposta para o deal (setup, instalação e mensalidade da rede), usados no portão P1. */
export function aplicarPropostaAoDeal(estado: Estado, dealId: string, agora = new Date()): Resultado {
  const { e, d } = preparar(estado, dealId);
  const p = e.propostas[dealId];
  if (!d || !p) return { ok: false, erro: "Proposta não encontrada" };
  if (!ETAPAS_PROPOSTA.includes(d.etapa)) return { ok: false, erro: "Os valores só podem ser aplicados nas etapas Proposta e Negociação" };
  const t = totais(p);
  d.valorSetup = t.setup;
  d.valorInstalacao = t.instalacao;
  d.mensalidade = t.mensalidadeRede;
  registrar(d, `Valores da proposta aplicados ao deal: setup ${reais(t.setup)}, instalação ${reais(t.instalacao)}, mensalidade ${reais(t.mensalidadeRede)}`, agora);
  return { ok: true, estado: e, aviso: "Valores aplicados ao deal" };
}
