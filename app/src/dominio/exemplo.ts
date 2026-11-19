// Dados de exemplo fictícios (os mesmos do protótipo). Não usar dados reais de clientes.
import { CHECKLIST } from "./checklist";
import { novoProjeto } from "./operacoes";
import { diagnosticoDeExemplo, type Diagnostico } from "./proposta/diagnostico";
import type { Deal, Estado, Projeto, RespostasFormulario } from "./tipos";

const CRIADO = new Date("2026-11-18T09:10:00-03:00");

const PREENCHIDO: RespostasFormulario = {
  cardapio: { arq: "cardapio-2026.pdf" },
  cert: { arq: "certificado-a1.pfx", val: "2027-08-30" },
  fiscal: { cnpj: "00.000.000/0001-00", ie: "000.000.000.000", reg: "Lucro Presumido" },
  integ: { lst: ["iFood", "TEF"], resp: "Equipe de TI" },
  acessos: { usu: "14", perf: "Caixa, gerente, garçom" },
  equip: { pdv: "3", imp: "4" },
  loja: { desc: "Salão com 40 mesas, cozinha com duas praças" },
  resp: { nome: "Paula Andrade", email: "paula@exemplo.com", tel: "(11) 5555-0142" },
};

/** Formulário com os `n` primeiros itens do checklist preenchidos. */
const formularioCom = (n: number): RespostasFormulario =>
  Object.fromEntries(CHECKLIST.slice(0, n).map((i) => [i.chave, structuredClone(PREENCHIDO[i.chave])]));

function deal(id: string, conta: string, segmento: string, lojas: number, dono: string, etapa: Deal["etapa"], extra: Partial<Deal> = {}): Deal {
  return {
    id, conta, segmento, lojas, dono, etapa, contato: "", aderencia: "Pendente", complexidade: "", valorSetup: 0,
    valorInstalacao: 0, mensalidade: 0, propostaAceita: false, porte: "", caminho: "", contratoSetupAssinado: false,
    setupPago: false, motivoPerda: "", projetoId: null, atividades: [{ em: CRIADO.toISOString(), texto: "Deal criado" }],
    ...extra,
  };
}

const projeto = (id: string, dealId: string, etapa: Projeto["etapa"], extra: Partial<Projeto> = {}): Projeto =>
  ({ ...novoProjeto(id, dealId, new Date("2026-11-18T10:00:00-03:00")), etapa, ...extra });

const diagnostico = (semente: string, marca: string, lojas: number, perfil: "forte" | "medio" | "fraco"): Diagnostico => ({
  ...diagnosticoDeExemplo(semente, marca, lojas, perfil),
  arquivo: `Diagnóstico - ${marca}.pdf`,
  recebidoEm: "2026-11-17T14:00:00-03:00",
});

export function estadoDeExemplo(): Estado {
  return {
    deals: [
      deal("D1", "Sabor da Vila", "Restaurante à la carte", 3, "Marina Lopes", "qual"),
      deal("D2", "Mar Aberto Poke", "Fast casual", 6, "Rafael Costa", "ader", { contato: "Lucas Moura" }),
      deal("D3", "Forno Antigo Pizzaria", "Pizzaria", 4, "João", "prop", { contato: "Helena Dias", aderencia: "Aprovada" }),
      deal("D4", "Brasa Nobre Grill", "Steakhouse", 12, "João", "neg", {
        contato: "Paula Andrade", aderencia: "Aprovada", complexidade: "Complexa", valorSetup: 42000, valorInstalacao: 18000,
        mensalidade: 9600, porte: "6 a 20 lojas" }),
      deal("D5", "Burger Lab", "Hamburgueria", 8, "Rafael Costa", "cont", {
        contato: "Tiago Reis", aderencia: "Aprovada", complexidade: "Média", valorSetup: 24000, valorInstalacao: 9600,
        mensalidade: 5200, propostaAceita: true, porte: "6 a 20 lojas", caminho: "Mensalidade", contratoSetupAssinado: true,
        projetoId: "P5" }),
      deal("D6", "Café Colina", "Cafeteria", 2, "Marina Lopes", "pago", {
        contato: "Bruna Leal", aderencia: "Aprovada", complexidade: "Simples", valorSetup: 4000, valorInstalacao: 2400,
        mensalidade: 1300, propostaAceita: true, porte: "Até 5 lojas", caminho: "Piloto", contratoSetupAssinado: true,
        setupPago: true, projetoId: "P6" }),
      deal("D7", "Tempero Mineiro", "Self-service", 15, "João", "pago", {
        contato: "Rogério Lima", aderencia: "Aprovada", complexidade: "Média", valorSetup: 45000, valorInstalacao: 15000,
        mensalidade: 8900, propostaAceita: true, porte: "6 a 20 lojas", caminho: "Mensalidade", contratoSetupAssinado: true,
        setupPago: true, projetoId: "P7" }),
      deal("D8", "Grão Fino Padaria", "Padaria", 5, "Marina Lopes", "perd", {
        contato: "Sônia Prates", aderencia: "Aprovada", motivoPerda: "Preço do setup" }),
    ],
    projetos: [
      projeto("P5", "D5", "col"),
      projeto("P6", "D6", "hom", { dataSetup: "2026-11-12", setupConcluido: true }),
      projeto("P7", "D7", "ins", { dataSetup: "2026-11-05", setupConcluido: true, homologacaoAprovada: true,
        instalacao: "Qui 26/11 · 08:00 às 10:00 · Carlos Mendes" }),
    ],
    formularios: { D4: formularioCom(5), D5: formularioCom(6), D6: formularioCom(8), D7: formularioCom(8) },
    diagnosticos: {
      D3: diagnostico("D3", "Forno Antigo Pizzaria", 4, "medio"),
      D4: diagnostico("D4", "Brasa Nobre Grill", 12, "forte"),
    },
    propostas: {},
  };
}
