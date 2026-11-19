// Operações do domínio. Recebem o estado, devolvem um novo estado (sem efeitos colaterais).
import { ETAPAS_GERAR_FORMULARIO, nomeEtapa, pendencias, PORTAO_DA_ETAPA, type Tipo } from "./regras";
import type { Deal, Estado, Projeto } from "./tipos";

export type Resultado =
  | { ok: true; estado: Estado; aviso: string }
  | { ok: false; erro: string; pendencias?: string[] };

const clonar = (e: Estado): Estado => structuredClone(e);
const registrar = (o: Deal | Projeto, texto: string, em = new Date()) =>
  o.atividades.unshift({ em: em.toISOString(), texto });

function buscar(e: Estado, tipo: Tipo, id: string): Deal | Projeto | undefined {
  return tipo === "deal" ? e.deals.find((x) => x.id === id) : e.projetos.find((x) => x.id === id);
}

export function novoProjeto(id: string, dealId: string, em = new Date()): Projeto {
  return {
    id, dealId, etapa: "col", dataSetup: "", setupConcluido: false, homologacaoAprovada: false, instalacao: "",
    licencaAssinada: false, primeiraMensalidadePaga: false, pilotoAprovado: false, ativado: false, passagemCs: false,
    atividades: [{ em: em.toISOString(), texto: "Projeto criado a partir do deal" }],
  };
}

const proximoIdProjeto = (e: Estado) =>
  "P" + (Math.max(0, ...e.projetos.map((p) => Number(p.id.replace(/\D/g, "")) || 0)) + 1);

export function mover(estado: Estado, tipo: Tipo, id: string, destino: string): Resultado {
  const e = clonar(estado);
  const o = buscar(e, tipo, id);
  if (!o) return { ok: false, erro: "Registro não encontrado" };
  if (o.etapa === destino) return { ok: true, estado: e, aviso: "Nada a mudar" };

  const faltando = pendencias(tipo, o, destino, e);
  if (faltando.length) {
    const portao = PORTAO_DA_ETAPA[destino as keyof typeof PORTAO_DA_ETAPA];
    return {
      ok: false,
      erro: `Não é possível mover para "${nomeEtapa(tipo, destino)}"${portao ? ` (portão ${portao})` : ""}`,
      pendencias: faltando,
    };
  }

  const origem = nomeEtapa(tipo, o.etapa);
  (o as { etapa: string }).etapa = destino;
  registrar(o, `Movido de ${origem} para ${nomeEtapa(tipo, destino)}`);

  // Regra: o projeto é criado quando o deal chega a "Contrato de setup" (ou além).
  if (tipo === "deal" && (destino === "cont" || destino === "pago")) {
    const d = o as Deal;
    if (!d.projetoId) {
      const p = novoProjeto(proximoIdProjeto(e), d.id);
      e.projetos.push(p);
      d.projetoId = p.id;
      e.formularios[d.id] ??= {};
      registrar(d, "Projeto criado no pipeline de projetos");
      return { ok: true, estado: e, aviso: "Projeto criado em Coleta e formulário vinculado" };
    }
  }
  return { ok: true, estado: e, aviso: destino === "perd" ? "Deal marcado como perdido" : `Movido para ${nomeEtapa(tipo, destino)}` };
}

const CAMPOS_DEAL = ["conta", "segmento", "lojas", "dono", "contato", "aderencia", "complexidade", "valorSetup",
  "valorInstalacao", "mensalidade", "propostaAceita", "porte", "caminho", "contratoSetupAssinado", "setupPago", "motivoPerda"] as const;
const CAMPOS_PROJETO = ["dataSetup", "setupConcluido", "homologacaoAprovada", "licencaAssinada",
  "primeiraMensalidadePaga", "pilotoAprovado", "ativado", "passagemCs"] as const;

export function atualizarCampo(estado: Estado, tipo: Tipo, id: string, campo: string, valor: string | number | boolean): Resultado {
  const permitidos: readonly string[] = tipo === "deal" ? CAMPOS_DEAL : CAMPOS_PROJETO;
  if (!permitidos.includes(campo)) return { ok: false, erro: `Campo não editável: ${campo}` };
  const e = clonar(estado);
  const o = buscar(e, tipo, id) as unknown as Record<string, unknown> & (Deal | Projeto);
  if (!o) return { ok: false, erro: "Registro não encontrado" };
  const atual = o[campo];
  const novo = typeof atual === "number" ? Number(valor) || 0 : typeof atual === "boolean" ? Boolean(valor) : String(valor);
  if (atual === novo) return { ok: true, estado: e, aviso: "Nada a mudar" };
  o[campo] = novo;
  registrar(o, `Campo atualizado: ${campo}`);
  return { ok: true, estado: e, aviso: "Salvo" };
}

export function gerarFormulario(estado: Estado, dealId: string): Resultado {
  const e = clonar(estado);
  const d = e.deals.find((x) => x.id === dealId);
  if (!d) return { ok: false, erro: "Deal não encontrado" };
  if (e.formularios[dealId]) return { ok: true, estado: e, aviso: "Formulário já existe" };
  if (!ETAPAS_GERAR_FORMULARIO.includes(d.etapa))
    return { ok: false, erro: "O formulário pode ser gerado a partir da etapa Proposta" };
  e.formularios[dealId] = {};
  registrar(d, "Formulário do cliente gerado");
  return { ok: true, estado: e, aviso: "Formulário gerado. Copie o link e envie ao cliente" };
}

export function salvarResposta(estado: Estado, dealId: string, item: string, campo: string, valor: string | string[]): Resultado {
  const e = clonar(estado);
  const f = e.formularios[dealId];
  if (!f) return { ok: false, erro: "Formulário não encontrado" };
  (f[item] ??= {})[campo] = valor;
  return { ok: true, estado: e, aviso: "Salvo" };
}
