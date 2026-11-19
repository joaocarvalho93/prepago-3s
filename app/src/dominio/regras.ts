// Etapas, portões e regras de avanço dos dois pipelines (docs/02-fluxo.md e docs/04-pipelines.md).
// Código puro: roda no servidor (onde a regra é aplicada) e no cliente (onde as pendências são exibidas).
import { percentualFormulario } from "./checklist";
import type { Deal, Estado, EtapaDeal, EtapaProjeto, Portao, Projeto } from "./tipos";

export const ETAPAS_DEAL: { id: EtapaDeal; nome: string }[] = [
  { id: "qual", nome: "Qualificado" },
  { id: "ader", nome: "Aderência" },
  { id: "prop", nome: "Proposta" },
  { id: "neg", nome: "Negociação" },
  { id: "cont", nome: "Contrato de setup" },
  { id: "pago", nome: "Setup pago" },
  { id: "perd", nome: "Perdido" },
];

export const ETAPAS_PROJETO: { id: EtapaProjeto; nome: string }[] = [
  { id: "col", nome: "Coleta" },
  { id: "pron", nome: "Pronto para setup" },
  { id: "set", nome: "Setup" },
  { id: "hom", nome: "Homologação" },
  { id: "ins", nome: "Instalação" },
  { id: "gol", nome: "Go-live" },
  { id: "aco", nome: "Acompanhamento" },
  { id: "conc", nome: "Concluído" },
];

/** Etapa em que cada portão é verificado (entrada na etapa). */
export const PORTAO_DA_ETAPA: Partial<Record<EtapaDeal | EtapaProjeto, Portao>> = {
  cont: "P1",
  pron: "P2",
  gol: "P3",
};

/** Etapas do deal a partir das quais o formulário do cliente pode ser gerado. */
export const ETAPAS_GERAR_FORMULARIO: EtapaDeal[] = ["prop", "neg"];
/** Etapas do projeto em que a instalação pode ser agendada. */
export const ETAPAS_AGENDAR_INSTALACAO: EtapaProjeto[] = ["set", "hom", "ins"];

type Regra<T> = { descricao: string; ok: (o: T, e: Estado) => boolean };

const dealDe = (p: Projeto, e: Estado): Deal => {
  const d = e.deals.find((x) => x.id === p.dealId);
  if (!d) throw new Error(`Projeto ${p.id} sem deal ${p.dealId}`);
  return d;
};

export const REGRAS_DEAL: Partial<Record<EtapaDeal, Regra<Deal>[]>> = {
  ader: [
    { descricao: "Contato principal", ok: (d) => !!d.contato.trim() },
    { descricao: "Nº de lojas", ok: (d) => d.lojas > 0 },
    { descricao: "Segmento", ok: (d) => !!d.segmento.trim() },
  ],
  prop: [{ descricao: "Parecer de aderência aprovado", ok: (d) => d.aderencia === "Aprovada" }],
  neg: [
    { descricao: "Complexidade do setup", ok: (d) => !!d.complexidade },
    { descricao: "Valor do setup", ok: (d) => d.valorSetup > 0 },
    { descricao: "Mensalidade", ok: (d) => d.mensalidade > 0 },
  ],
  // P1 · Go comercial
  cont: [
    { descricao: "Proposta aceita pelo cliente", ok: (d) => d.propostaAceita },
    { descricao: "Porte e prazo de coleta", ok: (d) => !!d.porte },
    { descricao: "Caminho: mensalidade ou piloto", ok: (d) => !!d.caminho },
  ],
  pago: [
    { descricao: "Contrato de setup assinado", ok: (d) => d.contratoSetupAssinado },
    { descricao: "Pagamento do setup compensado", ok: (d) => d.setupPago },
  ],
  perd: [{ descricao: "Motivo da perda", ok: (d) => !!d.motivoPerda }],
};

export const REGRAS_PROJETO: Partial<Record<EtapaProjeto, Regra<Projeto>[]>> = {
  // P2 · Liberação do setup
  pron: [
    { descricao: "Contrato de setup assinado (deal)", ok: (p, e) => dealDe(p, e).contratoSetupAssinado },
    { descricao: "Setup pago (deal)", ok: (p, e) => dealDe(p, e).setupPago },
    { descricao: "Formulário do cliente 100%", ok: (p, e) => percentualFormulario(e.formularios[p.dealId]) === 100 },
  ],
  set: [{ descricao: "Data do setup definida", ok: (p) => !!p.dataSetup }],
  hom: [{ descricao: "Setup concluído", ok: (p) => p.setupConcluido }],
  ins: [
    { descricao: "Homologação aprovada pelo cliente", ok: (p) => p.homologacaoAprovada },
    { descricao: "Instalação agendada na agenda", ok: (p) => !!p.instalacao },
  ],
  // P3 · Go-live
  gol: [
    { descricao: "Contrato de licença assinado", ok: (p) => p.licencaAssinada },
    {
      descricao: "1ª mensalidade paga ou piloto aprovado",
      ok: (p, e) => p.primeiraMensalidadePaga || (dealDe(p, e).caminho === "Piloto" && p.pilotoAprovado),
    },
  ],
  aco: [{ descricao: "Loja ativada", ok: (p) => p.ativado }],
  conc: [{ descricao: "Passagem para o CS concluída", ok: (p) => p.passagemCs }],
};

export type Tipo = "deal" | "projeto";

export function nomeEtapa(tipo: Tipo, etapa: string): string {
  const lista = tipo === "deal" ? ETAPAS_DEAL : ETAPAS_PROJETO;
  return lista.find((x) => x.id === etapa)?.nome ?? etapa;
}

/** Próxima etapa no fluxo normal (ignora "Perdido"). */
export function proximaEtapa(tipo: Tipo, etapaAtual: string): string | null {
  const ids = (tipo === "deal" ? ETAPAS_DEAL : ETAPAS_PROJETO).map((x) => x.id as string).filter((x) => x !== "perd");
  const i = ids.indexOf(etapaAtual);
  return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
}

/** Regras de entrada de uma etapa avaliadas para o registro, com o resultado de cada uma. */
export function avaliarEtapa(tipo: Tipo, registro: Deal | Projeto, etapa: string, estado: Estado) {
  const regras = (tipo === "deal" ? REGRAS_DEAL[etapa as EtapaDeal] : REGRAS_PROJETO[etapa as EtapaProjeto]) ?? [];
  return regras.map((r) => ({ descricao: r.descricao, ok: (r.ok as (o: unknown, e: Estado) => boolean)(registro, estado) }));
}

/**
 * Pendências para mover o registro até `destino`.
 * Avançar várias etapas de uma vez exige cumprir as regras de todas as etapas intermediárias.
 * Voltar etapas não tem pendências. "Perdido" exige apenas o motivo.
 */
export function pendencias(tipo: Tipo, registro: Deal | Projeto, destino: string, estado: Estado): string[] {
  if (destino === "perd") return avaliarEtapa(tipo, registro, "perd", estado).filter((r) => !r.ok).map((r) => r.descricao);
  const ids = (tipo === "deal" ? ETAPAS_DEAL : ETAPAS_PROJETO).map((x) => x.id as string);
  const atual = registro.etapa === "perd" ? -1 : ids.indexOf(registro.etapa);
  const alvo = ids.indexOf(destino);
  if (alvo < 0) return [`Etapa desconhecida: ${destino}`];
  if (alvo <= atual) return [];
  const faltando: string[] = [];
  for (let i = Math.max(atual + 1, 0); i <= alvo; i++) {
    for (const r of avaliarEtapa(tipo, registro, ids[i], estado)) if (!r.ok) faltando.push(r.descricao);
  }
  return faltando;
}
