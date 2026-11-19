// Catálogo da proposta. Estrutura e IDs iguais aos da ferramenta comercial atual (index.html),
// para manter a compatibilidade do JSON. TODOS OS VALORES SÃO FICTÍCIOS.

/** ess = essencial (entra na mensalidade) · add = adicional (entra se marcado) · prod = produto (cross-sell). */
export type CategoriaModulo = "ess" | "add" | "prod";

export interface Modulo {
  id: string;
  nome: string;
  valor: number; // R$/mês por loja (fictício)
  grupo: string;
  cat: CategoriaModulo;
  /** Adicionais: se o valor entra na mensalidade. Produtos: sempre fora (cross-sell). */
  naMensalidade?: boolean;
}

const M = (id: string, nome: string, valor: number, grupo: string, cat: CategoriaModulo, naMensalidade = cat !== "prod"): Modulo =>
  ({ id, nome, valor, grupo, cat, naMensalidade });

export const MODULOS: Modulo[] = [
  // Essenciais
  M("pdv_1", "PDV — 1", 230, "PDV", "ess"),
  M("pdv_3", "PDV — Até 3", 330, "PDV", "ess"),
  M("pdv_5", "PDV — Até 5", 430, "PDV", "ess"),
  M("pdv_ilim", "PDV — Ilimitado", 620, "PDV", "ess"),
  M("kds_1", "KDS — 1", 75, "KDS", "ess"),
  M("kds_3", "KDS — Até 3", 150, "KDS", "ess"),
  M("kds_ilim", "KDS — Ilimitado", 260, "KDS", "ess"),
  M("imp_1", "Produção com Impressoras — 1", 35, "Impressoras", "ess"),
  M("imp_3", "Produção Impressoras — Até 3", 55, "Impressoras", "ess"),
  M("imp_ilim", "Produção Impressoras — Ilimitado", 95, "Impressoras", "ess"),
  M("totem_1", "Totem — 1", 95, "Totem", "ess"),
  M("totem_3", "Totem — Até 3", 170, "Totem", "ess"),
  M("totem_ilim", "Totem — Ilimitado", 340, "Totem", "ess"),
  M("mkt_ifood", "Marketplace — iFood", 55, "Marketplace", "ess"),
  M("mkt_ifood_od", "Marketplace — iFood / Open Delivery", 85, "Marketplace", "ess"),
  M("mkt_ifood_rappi", "Marketplace — iFood / Rappi", 85, "Marketplace", "ess"),
  M("mkt_full", "Marketplace — iFood / Rappi / 99 / Keeta / Open Delivery", 140, "Marketplace", "ess"),
  // Adicionais
  M("pdv_adic", "PDV — Adicional", 45, "PDV", "add"),
  M("kds_adic", "KDS — Adicional", 55, "KDS", "add"),
  M("totem_adic", "Totem — Adicional", 60, "Totem", "add"),
  M("pos_1", "POS Mobile ou Smartphone — 1", 75, "POS Mobile", "add"),
  M("pos_3", "POS Mobile — Até 3", 95, "POS Mobile", "add"),
  M("pos_5", "POS Mobile — Até 5", 140, "POS Mobile", "add"),
  M("pos_ilim", "POS Mobile — Ilimitado", 330, "POS Mobile", "add"),
  M("marca", "Marca Adicional", 95, "Outros", "add"),
  M("multimarca", "Multimarca", 45, "Outros", "add", false),
  // Produtos (cross-sell, fora da mensalidade)
  M("tef_1", "TEF — Primeira integração", 95, "TEF", "prod"),
  M("3sgo", "3SGo — Ilimitado por loja", 55, "3S GO", "prod"),
  M("bi_simples", "3S BI — Simples", 110, "3S BI", "prod"),
  M("bi_admin", "3S BI — Administrador", 210, "3S BI", "prod"),
  M("kinesis", "3S Connection — Kinesis", 280, "3S Connection", "prod"),
  M("eats_m", "3S Eats — Pedido na mesa", 170, "3S Eats", "prod"),
];

/** Ecossistema Fixe (CRM e fidelidade), também fora da mensalidade. */
export const FIXE: Modulo[] = [
  M("fx_fid", "Fidelidade", 190, "Fixe CRM", "prod"),
  M("fx_nps", "Pesquisa NPS", 120, "Fixe CRM", "prod"),
  M("crm_admin", "CRM Admin", 170, "CRM Admin", "prod"),
];

export const moduloPorId = (id: string) => [...MODULOS, ...FIXE].find((m) => m.id === id);

export interface Dor {
  id: string;
  texto: string;
  solucao: string;
  modulos: string[];
}

/** Banco de dores da ferramenta comercial (dGrid). */
export const DORES: Dor[] = [
  { id: "d1", texto: "Gestão de múltiplas lojas e cardápios com preços diferentes por canal", solucao: "Cardápio centralizado na nuvem com edição em massa para todas as lojas", modulos: [] },
  { id: "d2", texto: "Pedidos descentralizados entre balcão, totem e delivery", solucao: "PDV integrado + Hub Delivery + Totem em plataforma única", modulos: [] },
  { id: "d3", texto: "KDS sem indicadores de tempo ou balanceamento por praça", solucao: "KDS por estação com tempo de produção e balanceamento", modulos: [] },
  { id: "d4", texto: "Ruptura de estoque com insumos e sem baixa automática", solucao: "Inventário com baixa automática, alertas e fichas técnicas", modulos: [] },
  { id: "d5", texto: "Falta de visibilidade operacional em tempo real na rede", solucao: "3SGo + dashboards e relatórios atualizados", modulos: ["3sgo", "bi_simples"] },
  { id: "d6", texto: "Relatórios engessados e sem granularidade por loja e canal", solucao: "Relatórios por loja, canal, operador e período + BI", modulos: ["bi_admin"] },
  { id: "d7", texto: "Complexidade e lentidão nos pagamentos", solucao: "SmartPOS com pagamentos por pessoa, item ou mesa", modulos: [] },
  { id: "d8", texto: "Baixa retenção de clientes e promoções sem recorrência", solucao: "CRM Fixe com fidelidade e promoções personalizadas", modulos: ["fx_fid", "fx_nps"] },
  { id: "d9", texto: "Sistemas fragmentados e sem integração entre módulos", solucao: "Plataforma única com PDV, KDS, Totem, Delivery e BackOffice integrados", modulos: ["kinesis", "bi_admin"] },
  { id: "d10", texto: "Filas longas e demora no atendimento", solucao: "Totem de autoatendimento + POS Mobile", modulos: ["totem_adic", "pos_3"] },
  { id: "d11", texto: "Erros operacionais e retrabalho na produção", solucao: "KDS digital e comandas eletrônicas", modulos: [] },
  { id: "d12", texto: "Gestão de delivery fragmentada entre múltiplos agregadores", solucao: "Hub Delivery nativo com iFood, Rappi e Open Delivery", modulos: [] },
  { id: "d13", texto: "Abertura de novas lojas lenta e com erros de configuração", solucao: "Implantação assistida com template de loja", modulos: [] },
  { id: "d14", texto: "Conciliação bancária e financeira manual entre sistemas", solucao: "BackOffice com DRE, fluxo de caixa e conciliação automática", modulos: ["bi_simples"] },
];

/** PDVs concorrentes reconhecidos no diagnóstico (campo `conc`). */
export const CONCORRENTES: { id: string; nome: string; termos: string[] }[] = [
  { id: "linx", nome: "Linx", termos: ["linx", "degust"] },
  { id: "saipos", nome: "Saipos", termos: ["saipos"] },
  { id: "totvs", nome: "TOTVS", termos: ["totvs"] },
  { id: "colibri", nome: "Colibri", termos: ["colibri"] },
  { id: "aloha", nome: "Aloha", termos: ["aloha"] },
  { id: "teknisa", nome: "Teknisa", termos: ["teknisa"] },
  { id: "nola", nome: "Nola", termos: ["nola"] },
  { id: "gcom", nome: "GCOM", termos: ["gcom"] },
  { id: "ciss", nome: "CISS", termos: ["ciss"] },
  { id: "sw", nome: "SW Flash", termos: ["sw flash", "swflash"] },
];

export type Segmento = "table" | "qsr" | "cafe" | "delivery";
export const SEGMENTOS: { id: Segmento; nome: string }[] = [
  { id: "table", nome: "Restaurante de salão" },
  { id: "qsr", nome: "Quick service" },
  { id: "cafe", nome: "Cafeteria e padaria" },
  { id: "delivery", nome: "Delivery" },
];
