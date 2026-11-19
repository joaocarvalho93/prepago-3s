import { describe, expect, it } from "vitest";
import { estadoDeExemplo } from "../exemplo";
import type { Estado } from "../tipos";
import { calcularAderencia, classificar } from "./aderencia";
import { CONFIG_PROPOSTA } from "./config";
import { diagnosticoDeExemplo, diagnosticoParaTexto, lerDiagnostico, type StatusItem } from "./diagnostico";
import { avisos, gerarProposta, totais } from "./gerador";
import { ITENS_DIAGNOSTICO } from "./itens";
import { aplicarPropostaAoDeal, anexarDiagnostico, editarProposta, gerarPropostaDoDeal } from "./operacoes";

const ok = (r: { ok: boolean; erro?: string; estado?: Estado }) => {
  if (!r.ok || !r.estado) throw new Error(r.erro);
  return r.estado;
};

describe("fit de aderência", () => {
  it("faixas de classificação", () => {
    expect([0, 20, 20.4, 21, 50, 51, 79, 79.6, 80, 100].map(classificar)).toEqual(
      ["sem_fit", "sem_fit", "sem_fit", "baixa", "baixa", "media", "media", "alta", "alta", "alta"]);
  });

  it("N/A sai do numerador e do denominador; peso 0 conta como item válido", () => {
    const itens = [
      { id: 1, categoria: "x", nome: "a", peso: 90, dor: "d1" },
      { id: 2, categoria: "x", nome: "b", peso: 60, dor: "d1" },
      { id: 3, categoria: "x", nome: "c", peso: 0, dor: "d1" },
      { id: 4, categoria: "x", nome: "d", peso: 100, dor: "d1" },
    ];
    const r: Record<number, StatusItem> = { 1: "resolvido", 2: "critico", 3: "nao_possui", 4: "na" };
    expect(calcularAderencia(r, itens)).toEqual({ pct: 50, classificacao: "baixa", nItensValidos: 3, nItensEncontrados: 4 });
  });

  it("exemplo do racional: 66 itens somando 560% dão 8,5%", () => {
    const itens = Array.from({ length: 66 }, (_, i) => ({ id: i + 1, categoria: "x", nome: String(i), peso: i < 56 ? 10 : 0, dor: "d1" }));
    const r = Object.fromEntries(itens.map((i) => [i.id, "resolvido" as StatusItem]));
    expect(calcularAderencia(r, itens).pct).toBe(8.5);
  });
});

describe("leitura do diagnóstico", () => {
  it("lê o texto no formato do PDF exportado, com os 100 itens e o cabeçalho", () => {
    const base = diagnosticoDeExemplo("teste", "Restaurante Fictício", 14, "medio");
    const lido = lerDiagnostico(diagnosticoParaTexto(base), "Diagnóstico - Restaurante Fictício.pdf");
    expect(Object.keys(lido.respostas)).toHaveLength(100);
    expect(lido.respostas).toEqual(base.respostas);
    expect(lido.marca).toBe("Restaurante Fictício");
    expect(lido.lojasProprias).toBe(14);
    expect(lido.modelos).toEqual(["Table Service", "Delivery"]);
    expect(lido.pdvAtual).toBe(base.pdvAtual);
  });

  it("aceita quebras de linha e espaços duplos como os do PDF", () => {
    const txt = "Estoque:  [Inventário\n cego]:\n✅  Resolvido  /  Eficiente\nFinanceiro: [TEF – por cartões]:\n⚠️ Crítico / Manual";
    const d = lerDiagnostico(txt, "x.pdf");
    expect(Object.values(d.respostas).sort()).toEqual(["critico", "resolvido"]);
  });

  it("recusa um texto sem a estrutura esperada", () => {
    expect(() => lerDiagnostico("Relatório financeiro trimestral", "x.pdf")).toThrow();
  });
});

describe("gerador de proposta", () => {
  const e = estadoDeExemplo();
  const deal = e.deals.find((d) => d.id === "D4")!; // 12 lojas, perfil forte

  it("sempre inclui PDV, impressoras e marketplace; POS Mobile em salão ou mais de 5 lojas", () => {
    const p = gerarProposta(deal, e.diagnosticos.D4);
    const ativos = p.modulos.filter((m) => m.ativo).map((m) => m.id);
    expect(ativos).toEqual(expect.arrayContaining(["pdv_ilim", "imp_ilim", "mkt_ifood_od", "pos_3"]));
  });

  it("Fixe só com fit a partir de 51%", () => {
    const fraco = { ...e.diagnosticos.D4, respostas: Object.fromEntries(ITENS_DIAGNOSTICO.map((i) => [i.id, i.peso < 50 ? "resolvido" : "na"])) as Record<number, StatusItem> };
    const pBaixo = gerarProposta(deal, fraco);
    expect(pBaixo.fitAderencia!.pct).toBeLessThan(51);
    expect(pBaixo.modulos.find((m) => m.id === "fx_fid")!.ativo).toBe(false);
    const pAlto = gerarProposta(deal, e.diagnosticos.D4);
    expect(pAlto.fitAderencia!.pct).toBeGreaterThanOrEqual(51);
    expect(pAlto.modulos.find((m) => m.id === "fx_fid")!.ativo).toBe(true);
  });

  it("isenção de setup e instalação: alta aderência e 10+ lojas, desligável por configuração (pré-pago)", () => {
    const alto = { ...e.diagnosticos.D4, respostas: Object.fromEntries(ITENS_DIAGNOSTICO.map((i) => [i.id, i.peso >= 80 ? "critico" : "na"])) as Record<number, StatusItem> };
    expect(gerarProposta(deal, alto).fitAderencia!.classificacao).toBe("alta");
    expect(gerarProposta(deal, alto).ixSetup).toBe(true);
    expect(gerarProposta({ ...deal, lojas: 9 }, alto).ixSetup).toBe(false);
    expect(gerarProposta(deal, alto, { config: { ...CONFIG_PROPOSTA, isencaoAltaAderencia: false } }).ixSetup).toBe(false);
  });

  it("mensalidade soma essenciais e adicionais ativos não isentos; produtos ficam no cross-sell", () => {
    const p = gerarProposta(deal, e.diagnosticos.D4);
    const t = totais(p);
    // fictícios: pdv_ilim 620 + imp_ilim 95 + mkt_ifood_od 85 + pos_3 95
    expect(t.mensalidadeLoja).toBe(895);
    expect(t.mensalidadeRede).toBe(895 * 12);
    expect(t.crossSellLoja).toBe(190 + 170); // Fidelidade + CRM Admin
    const isento = { ...p, modulos: p.modulos.map((m) => (m.id === "pdv_ilim" ? { ...m, isento: true } : m)) };
    expect(totais(isento).mensalidadeLoja).toBe(275);
  });

  it("dores vêm dos itens Não possui e Crítico/Manual", () => {
    const id = (nome: string) => ITENS_DIAGNOSTICO.find((i) => i.nome === nome)!.id;
    const diag = { ...e.diagnosticos.D4, respostas: { [id("TEF – por cartões")]: "critico", [id("Inventário cego")]: "resolvido", 1: "na" } as Record<number, StatusItem> };
    expect(gerarProposta(deal, diag).dores).toEqual(["d7"]); // TEF – por cartões
  });

  it("avisa diagnóstico incompleto e baixíssima aderência", () => {
    const pouco = { ...e.diagnosticos.D4, respostas: { 17: "critico" } as Record<number, StatusItem> }; // item de peso 0
    const textos = avisos(gerarProposta(deal, pouco)).map((a) => a.texto);
    expect(textos.some((t) => t.includes("incompleto (1/100"))).toBe(true);
    expect(textos.some((t) => t.includes("Baixíssima"))).toBe(true);
  });
});

describe("operações no deal", () => {
  it("só gera com diagnóstico e na etapa Proposta ou Negociação", () => {
    const e = estadoDeExemplo();
    expect(gerarPropostaDoDeal(e, "D1", new Date()).ok).toBe(false); // Qualificado
    const semDiag = { ...e, diagnosticos: {} };
    const r = gerarPropostaDoDeal(semDiag, "D3");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toBe("Anexe o diagnóstico primeiro");
    expect(gerarPropostaDoDeal(e, "D3").ok).toBe(true);
  });

  it("gerar novamente mantém os campos editados à mão", () => {
    let e = ok(gerarPropostaDoDeal(estadoDeExemplo(), "D4"));
    e = ok(editarProposta(e, "D4", "setup", 1234));
    e = ok(gerarPropostaDoDeal(e, "D4"));
    expect(e.propostas.D4.setup).toBe(1234);
    expect(e.propostas.D4.editados).toEqual(["setup"]);
    expect(e.propostas.D4.versoes).toHaveLength(2);
  });

  it("aplicar ao deal leva setup, instalação e mensalidade da rede", () => {
    let e = ok(gerarPropostaDoDeal(estadoDeExemplo(), "D3"));
    e = ok(aplicarPropostaAoDeal(e, "D3"));
    const d = e.deals.find((x) => x.id === "D3")!;
    const t = totais(e.propostas.D3);
    expect([d.valorSetup, d.valorInstalacao, d.mensalidade]).toEqual([t.setup, t.instalacao, t.mensalidadeRede]);
  });

  it("anexar diagnóstico exige etapa Aderência ou depois", () => {
    const e = estadoDeExemplo();
    const diag = e.diagnosticos.D3;
    expect(anexarDiagnostico(e, "D1", diag).ok).toBe(false);
    expect(anexarDiagnostico(e, "D2", diag).ok).toBe(true);
  });
});
