// Diagnóstico de aderência: leitura do texto do PDF (exportação do formulário) e geração de exemplos fictícios.
// O PDF é convertido em texto no navegador; daqui para a frente tudo é código comum, sem IA.
import { ITENS_DIAGNOSTICO } from "./itens";

export type StatusItem = "nao_possui" | "critico" | "resolvido" | "na";

export const NOME_STATUS: Record<StatusItem, string> = {
  nao_possui: "Não possui",
  critico: "Crítico / Manual",
  resolvido: "Resolvido / Eficiente",
  na: "N/A (Não se aplica)",
};

export interface Diagnostico {
  arquivo: string;
  recebidoEm: string; // ISO
  marca: string;
  segmento: string; // "Segmento de Foodservice" do formulário
  modelos: string[]; // Quick Service, Table Service, Delivery...
  lojasProprias: number;
  lojasFranqueadas: number;
  pdvAtual: string;
  erpAtual: string;
  /** Status por item (id de ITENS_DIAGNOSTICO). Itens não encontrados ficam de fora. */
  respostas: Record<number, StatusItem>;
}

/** Minúsculas, sem acento, sem pontuação e com espaços simples. Usado para casar nomes. */
export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();

const ITEM_POR_NOME = new Map(ITENS_DIAGNOSTICO.map((i) => [normalizar(i.nome), i.id]));

function lerStatus(s: string): StatusItem | null {
  const n = normalizar(s);
  if (n.startsWith("critico")) return "critico";
  if (n.startsWith("resolvido")) return "resolvido";
  if (n.startsWith("nao possui")) return "nao_possui";
  if (n.startsWith("n a")) return "na";
  return null;
}

const ROTULOS: [keyof Diagnostico | "grupo" | "outras" | "tecnologias" | "crm", string][] = [
  ["marca", "Nome da Marca"],
  ["grupo", "Faz parte de um Grupo de Marcas?"],
  ["outras", "Quais as outras marcas do Grupo?"],
  ["segmento", "Segmento de Foodservice"],
  ["modelos", "Modelo de Operação (Selecione todas que se aplicam)"],
  ["lojasProprias", "Quantidade de Lojas Próprias"],
  ["lojasFranqueadas", "Quantidade de Lojas Franqueadas"],
  ["tecnologias", "Quais destas tecnologias a rede JÁ POSSUI instalada hoje?"],
  ["pdvAtual", "Qual software de gestão (PDV) você utiliza hoje?"],
  ["erpAtual", "Qual sistema retaguarda (ERP) você utiliza hoje?"],
  ["crm", "Qual CRM você utiliza hoje?"],
];

/** Lê o texto extraído do PDF do diagnóstico. Lança erro se o texto não tiver a estrutura esperada. */
export function lerDiagnostico(texto: string, arquivo: string, agora = new Date()): Diagnostico {
  const t = texto.replace(/\s+/g, " ");

  // Respostas: "Categoria: [Item]: <ícone> Status"
  const respostas: Record<number, StatusItem> = {};
  const re = /\[([^\]]+)\]\s*:+\s*[^A-Za-zÀ-ú]*((?:Cr[ií]tico|Resolvido|N[ãa]o possui|N\/A)[^\[]{0,25})/gu;
  for (const m of t.matchAll(re)) {
    const id = ITEM_POR_NOME.get(normalizar(m[1]));
    const st = lerStatus(m[2]);
    if (id && st) respostas[id] = st;
  }
  if (Object.keys(respostas).length === 0) throw new Error("Não encontrei os itens do diagnóstico neste arquivo.");

  // Cabeçalho: valor de cada rótulo vai até o próximo rótulo ou o primeiro item.
  const tn = t.toLowerCase();
  const posicoes = ROTULOS.map(([campo, rotulo]) => ({ campo, rotulo, i: tn.indexOf(rotulo.toLowerCase()) }))
    .filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
  const inicioItens = t.indexOf("[") >= 0 ? t.lastIndexOf(":", t.indexOf("[")) : t.length;
  const fimCabecalho = Math.max(0, t.slice(0, inicioItens).lastIndexOf(" ", inicioItens - 1));
  const valores: Record<string, string> = {};
  posicoes.forEach((p, k) => {
    const ini = p.i + p.rotulo.length;
    let fim = k + 1 < posicoes.length ? posicoes[k + 1].i : inicioItens;
    if (k + 1 === posicoes.length) {
      // o último rótulo termina antes do nome da primeira categoria ("Gestão de Operação...")
      const cat = t.indexOf(ITENS_DIAGNOSTICO[0].categoria, ini);
      fim = cat >= 0 ? cat : fimCabecalho;
    }
    valores[p.campo] = t.slice(ini, fim).replace(/^[\s:]+/, "").trim();
  });
  const num = (s?: string) => Number((s ?? "").match(/\d+/)?.[0] ?? 0);

  return {
    arquivo,
    recebidoEm: agora.toISOString(),
    marca: valores.marca ?? "",
    segmento: valores.segmento ?? "",
    modelos: (valores.modelos ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    lojasProprias: num(valores.lojasProprias),
    lojasFranqueadas: num(valores.lojasFranqueadas),
    pdvAtual: valores.pdvAtual ?? "",
    erpAtual: valores.erpAtual ?? "",
    respostas,
  };
}

/** Texto no mesmo formato do PDF exportado. Usado para gerar diagnósticos de exemplo e nos testes. */
export function diagnosticoParaTexto(d: Omit<Diagnostico, "arquivo" | "recebidoEm">): string {
  const icone: Record<StatusItem, string> = { nao_possui: "❌", critico: "⚠️", resolvido: "✅", na: "⚪" };
  const cab = [
    `Nome da Marca:: ${d.marca}`,
    `Segmento de Foodservice:: ${d.segmento}`,
    `Modelo de Operação (Selecione todas que se aplicam): : ${d.modelos.join(", ")}`,
    `Quantidade de Lojas Próprias:: ${d.lojasProprias}`,
    `Quantidade de Lojas Franqueadas:: ${d.lojasFranqueadas}`,
    `Qual software de gestão (PDV) você utiliza hoje? : ${d.pdvAtual}`,
    `Qual sistema retaguarda (ERP) você utiliza hoje? : ${d.erpAtual}`,
  ];
  const itens = ITENS_DIAGNOSTICO.filter((i) => d.respostas[i.id]).map(
    (i) => `${i.categoria}: [${i.nome}]:\n${icone[d.respostas[i.id]]} ${NOME_STATUS[d.respostas[i.id]]}`,
  );
  return [...cab, ...itens].join("\n\n");
}

/** Diagnóstico fictício e determinístico (mesma semente, mesmo resultado). */
export function diagnosticoDeExemplo(semente: string, marca: string, lojas: number, perfil: "forte" | "medio" | "fraco" = "medio"): Omit<Diagnostico, "arquivo" | "recebidoEm"> {
  let h = 2166136261;
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000;
  const pesoNa = { forte: 0.15, medio: 0.3, fraco: 0.45 }[perfil];
  const respostas: Record<number, StatusItem> = {};
  for (const i of ITENS_DIAGNOSTICO) {
    const r = rnd();
    respostas[i.id] = r < pesoNa ? "na" : r < pesoNa + 0.25 ? "critico" : r < pesoNa + 0.4 ? "nao_possui" : "resolvido";
  }
  return {
    marca, segmento: "Restaurante Casual", modelos: ["Table Service", "Delivery"], lojasProprias: lojas,
    lojasFranqueadas: 0, pdvAtual: ["Colibri", "Saipos", "Linx", "Não utiliza"][Math.floor(rnd() * 4)], erpAtual: "", respostas,
  };
}
