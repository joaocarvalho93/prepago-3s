// Gerador da proposta inicial a partir do deal e do diagnóstico (heurísticas da especificação, seção 6).
// A proposta é sempre um rascunho: tudo é editável, e o que o vendedor editou não é sobrescrito ao gerar de novo.
import type { Deal } from "../tipos";
import { calcularAderencia, type FitAderencia } from "./aderencia";
import { CONCORRENTES, DORES, FIXE, MODULOS, moduloPorId, type Segmento } from "./catalogo";
import { CONFIG_PROPOSTA, type ConfigProposta } from "./config";
import type { Diagnostico } from "./diagnostico";
import { ITENS_DIAGNOSTICO } from "./itens";

export interface ItemProposta {
  id: string;
  valor: number;
  ativo: boolean;
  isento: boolean;
}

export const SECOES_APRESENTACAO = [
  { id: "dores", nome: "Dores e soluções" },
  { id: "modulos", nome: "Módulos contratados" },
  { id: "investimento", nome: "Investimento" },
  { id: "ecossistema", nome: "Ecossistema e produtos adicionais" },
  { id: "cronograma", nome: "Cronograma de implantação" },
] as const;

export interface Proposta {
  dealId: string;
  nome: string;
  lj: number;
  ct: number; // meses de contrato
  ro: number; // meses de rollout
  segmento: Segmento;
  estado: string;
  conc: string; // PDV atual (id de CONCORRENTES) ou vazio
  dores: string[];
  setup: number;
  inst: number; // por loja
  ixSetup: boolean;
  ixInst: boolean;
  modulos: ItemProposta[]; // essenciais, adicionais, produtos e Fixe
  ecoProd: boolean;
  ecoFixe: boolean;
  secoes: string[];
  fitAderencia: FitAderencia | null;
  /** Campos alterados à mão pelo vendedor. Não são sobrescritos ao gerar de novo. */
  editados: string[];
  dataCriacao: string;
  dataModificacao: string;
  responsavel: string;
  versoes: { em: string; mensalidade: number; fit: number | null }[];
}

export const CAMPOS_EDITAVEIS = ["nome", "lj", "ct", "ro", "segmento", "estado", "conc", "dores", "setup", "inst",
  "ixSetup", "ixInst", "modulos", "ecoProd", "ecoFixe", "secoes"] as const;
export type CampoEditavel = (typeof CAMPOS_EDITAVEIS)[number];

const ESSENCIAIS_BASE = ["pdv_ilim", "imp_ilim", "mkt_ifood_od"];
const FIXE_SUGERIDO = ["fx_fid", "crm_admin"];

export function segmentoDe(deal: Deal, diag: Diagnostico | null): Segmento {
  const modelos = (diag?.modelos ?? []).join(" ").toLowerCase();
  if (modelos.includes("table")) return "table";
  const s = `${diag?.segmento ?? ""} ${deal.segmento}`.toLowerCase();
  if (/caf[eé]|padaria|confeitaria/.test(s)) return "cafe";
  if (/delivery|dark/.test(s)) return "delivery";
  if (/fast|quick|hamburg|self|a[cç]a[ií]|lanche/.test(s)) return "qsr";
  return "table";
}

export function concorrenteDe(texto: string): string {
  const t = texto.toLowerCase();
  return CONCORRENTES.find((c) => c.termos.some((x) => new RegExp(`\\b${x}\\b`).test(t)))?.id ?? "";
}

export function doresDe(diag: Diagnostico): string[] {
  const ids = new Set(ITENS_DIAGNOSTICO.filter((i) => ["nao_possui", "critico"].includes(diag.respostas[i.id])).map((i) => i.dor));
  return DORES.map((d) => d.id).filter((id) => ids.has(id));
}

/** Sugestão do gerador, sem considerar edições. */
function sugerir(deal: Deal, diag: Diagnostico | null, cfg: ConfigProposta) {
  const lj = deal.lojas > 0 ? deal.lojas : diag ? Math.max(1, diag.lojasProprias + diag.lojasFranqueadas) : 1;
  const segmento = segmentoDe(deal, diag);
  const fit = diag ? calcularAderencia(diag.respostas) : null;
  const fitBom = fit ? ["media", "alta"].includes(fit.classificacao) : false;
  const isenta = cfg.isencaoAltaAderencia && fit?.classificacao === "alta" && lj >= cfg.lojasMinimasIsencao;
  const ativo = (id: string) =>
    ESSENCIAIS_BASE.includes(id) || (id === "pos_3" && (segmento === "table" || lj > 5)) || (FIXE_SUGERIDO.includes(id) && fitBom);
  const modulos: ItemProposta[] = [...MODULOS, ...FIXE].map((m) => ({
    id: m.id, valor: m.valor, ativo: ativo(m.id), isento: false,
  }));
  return {
    nome: deal.conta, lj, ct: cfg.contratoMeses, ro: cfg.rolloutMeses, segmento, estado: "",
    conc: diag ? concorrenteDe(diag.pdvAtual) : "", dores: diag ? doresDe(diag) : [],
    setup: cfg.setupPadrao, inst: cfg.instalacaoPorLoja, ixSetup: isenta, ixInst: isenta,
    modulos, ecoProd: true, ecoFixe: segmento === "table" || fitBom,
    secoes: SECOES_APRESENTACAO.map((s) => s.id) as string[], fitAderencia: fit,
  };
}

export function gerarProposta(deal: Deal, diag: Diagnostico | null, opcoes: {
  anterior?: Proposta; responsavel?: string; agora?: Date; config?: ConfigProposta;
} = {}): Proposta {
  const { anterior, responsavel = deal.dono, agora = new Date(), config = CONFIG_PROPOSTA } = opcoes;
  const s = sugerir(deal, diag, config);
  const manter = <K extends CampoEditavel>(campo: K, valor: Proposta[K]): Proposta[K] =>
    anterior && anterior.editados.includes(campo) ? anterior[campo] : valor;
  const p: Proposta = {
    dealId: deal.id,
    nome: manter("nome", s.nome), lj: manter("lj", s.lj), ct: manter("ct", s.ct), ro: manter("ro", s.ro),
    segmento: manter("segmento", s.segmento), estado: manter("estado", s.estado), conc: manter("conc", s.conc),
    dores: manter("dores", s.dores), setup: manter("setup", s.setup), inst: manter("inst", s.inst),
    ixSetup: manter("ixSetup", s.ixSetup), ixInst: manter("ixInst", s.ixInst), modulos: manter("modulos", s.modulos),
    ecoProd: manter("ecoProd", s.ecoProd), ecoFixe: manter("ecoFixe", s.ecoFixe), secoes: manter("secoes", s.secoes),
    fitAderencia: s.fitAderencia,
    editados: anterior?.editados ?? [],
    dataCriacao: anterior?.dataCriacao ?? agora.toISOString(),
    dataModificacao: agora.toISOString(),
    responsavel,
    versoes: anterior?.versoes ?? [],
  };
  p.versoes = [...p.versoes, { em: agora.toISOString(), mensalidade: totais(p).mensalidadeLoja, fit: s.fitAderencia?.pct ?? null }];
  return p;
}

export interface Totais {
  mensalidadeLoja: number; // essenciais + adicionais que entram na mensalidade
  mensalidadeRede: number;
  crossSellLoja: number; // produtos e Fixe, fora da mensalidade
  setup: number;
  instalacao: number; // total da rede
}

export function totais(p: Pick<Proposta, "modulos" | "lj" | "ecoProd" | "ecoFixe" | "setup" | "inst" | "ixSetup" | "ixInst">): Totais {
  let ms = 0;
  let xs = 0;
  for (const it of p.modulos) {
    const m = moduloPorId(it.id);
    if (!m || !it.ativo || it.isento) continue;
    if (m.cat === "prod") {
      const ehFixe = FIXE.some((f) => f.id === m.id);
      if (ehFixe ? p.ecoFixe : p.ecoProd) xs += it.valor;
    } else if (m.cat === "ess" || m.naMensalidade) ms += it.valor;
  }
  const r = (v: number) => Math.round(v * 100) / 100;
  return {
    mensalidadeLoja: r(ms), mensalidadeRede: r(ms * p.lj), crossSellLoja: r(xs),
    setup: p.ixSetup ? 0 : p.setup, instalacao: p.ixInst ? 0 : r(p.inst * p.lj),
  };
}

export type Aviso = { nivel: "erro" | "alerta"; texto: string };

export function avisos(p: Proposta, cfg: ConfigProposta = CONFIG_PROPOSTA): Aviso[] {
  const out: Aviso[] = [];
  const f = p.fitAderencia;
  if (f && f.nItensEncontrados < cfg.coberturaMinimaDiagnostico * ITENS_DIAGNOSTICO.length)
    out.push({ nivel: "alerta", texto: `Diagnóstico incompleto (${f.nItensEncontrados}/${ITENS_DIAGNOSTICO.length} itens). O cálculo pode estar impreciso.` });
  if (f?.classificacao === "sem_fit") out.push({ nivel: "erro", texto: "⚠️ Baixíssima aderência. Reavaliar antes de enviar." });
  if (!p.modulos.some((m) => m.ativo && moduloPorId(m.id)?.cat === "ess")) out.push({ nivel: "alerta", texto: "Nenhum módulo essencial na proposta." });
  return out;
}
