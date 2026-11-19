import { describe, expect, it } from "vitest";
import { CHECKLIST, percentualFormulario } from "./checklist";
import { estadoDeExemplo } from "./exemplo";
import { atualizarCampo, gerarFormulario, mover, salvarResposta } from "./operacoes";
import { pendencias, proximaEtapa } from "./regras";
import type { Estado } from "./tipos";

const ok = (r: ReturnType<typeof mover>): Estado => {
  if (!r.ok) throw new Error(r.erro + ": " + (r.pendencias ?? []).join(", "));
  return r.estado;
};

describe("pipeline comercial", () => {
  it("bloqueia a entrada em Contrato de setup (P1) sem proposta aceita e caminho", () => {
    const e = estadoDeExemplo();
    const r = mover(e, "deal", "D4", "cont");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toContain("P1");
      expect(r.pendencias).toEqual(["Proposta aceita pelo cliente", "Caminho: mensalidade ou piloto"]);
    }
  });

  it("cria o projeto em Coleta quando o deal chega a Contrato de setup", () => {
    let e = estadoDeExemplo();
    e = ok(atualizarCampo(e, "deal", "D4", "propostaAceita", true));
    e = ok(atualizarCampo(e, "deal", "D4", "caminho", "Mensalidade"));
    e = ok(mover(e, "deal", "D4", "cont"));
    const d = e.deals.find((x) => x.id === "D4")!;
    const p = e.projetos.find((x) => x.id === d.projetoId)!;
    expect(p.etapa).toBe("col");
    expect(p.dealId).toBe("D4");
    expect(e.formularios.D4).toBeDefined();
  });

  it("não cria um segundo projeto para o mesmo deal", () => {
    let e = estadoDeExemplo();
    e = ok(mover(e, "deal", "D5", "neg"));
    e = ok(mover(e, "deal", "D5", "cont"));
    expect(e.projetos.filter((p) => p.dealId === "D5")).toHaveLength(1);
  });

  it("pular etapas exige as regras de todas as etapas intermediárias", () => {
    const e = estadoDeExemplo();
    expect(pendencias("deal", e.deals[0], "neg", e)).toEqual([
      "Contato principal", "Parecer de aderência aprovado", "Complexidade do setup", "Valor do setup", "Mensalidade",
    ]);
  });

  it("voltar etapas não tem pendências e Perdido exige motivo", () => {
    const e = estadoDeExemplo();
    expect(pendencias("deal", e.deals[3], "qual", e)).toEqual([]);
    expect(pendencias("deal", e.deals[0], "perd", e)).toEqual(["Motivo da perda"]);
  });

  it("o formulário só pode ser gerado a partir de Proposta", () => {
    const e = estadoDeExemplo();
    expect(gerarFormulario(e, "D1").ok).toBe(false);
    expect(gerarFormulario(e, "D3").ok).toBe(true);
  });
});

describe("pipeline de projetos", () => {
  it("P2 exige setup pago e formulário 100%", () => {
    const e = estadoDeExemplo();
    const r = mover(e, "projeto", "P5", "pron");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.pendencias).toEqual(["Setup pago (deal)", "Formulário do cliente 100%"]);
  });

  it("P2 libera quando o checklist fica completo e o setup é pago", () => {
    let e = estadoDeExemplo();
    e = ok(atualizarCampo(e, "deal", "D5", "setupPago", true));
    e = ok(salvarResposta(e, "D5", "loja", "desc", "Salão pequeno"));
    e = ok(salvarResposta(e, "D5", "resp", "nome", "Fulano"));
    e = ok(salvarResposta(e, "D5", "resp", "email", "fulano@exemplo.com"));
    e = ok(salvarResposta(e, "D5", "resp", "tel", "(11) 0000-0000"));
    expect(percentualFormulario(e.formularios.D5)).toBe(100);
    expect(mover(e, "projeto", "P5", "pron").ok).toBe(true);
  });

  it("P3 aceita piloto aprovado no lugar da 1ª mensalidade só no caminho Piloto", () => {
    let e = estadoDeExemplo();
    // P6 · Café Colina, caminho Piloto, em Homologação
    e = ok(atualizarCampo(e, "projeto", "P6", "homologacaoAprovada", true));
    e.projetos.find((p) => p.id === "P6")!.instalacao = "Qua 25/11 · 13:00 às 15:00 · Ana Ribeiro";
    e = ok(mover(e, "projeto", "P6", "ins"));
    e = ok(atualizarCampo(e, "projeto", "P6", "licencaAssinada", true));
    e = ok(atualizarCampo(e, "projeto", "P6", "pilotoAprovado", true));
    expect(mover(e, "projeto", "P6", "gol").ok).toBe(true);

    // P7 · Tempero Mineiro, caminho Mensalidade: piloto aprovado não basta
    e = ok(atualizarCampo(e, "projeto", "P7", "licencaAssinada", true));
    e = ok(atualizarCampo(e, "projeto", "P7", "pilotoAprovado", true));
    const r = mover(e, "projeto", "P7", "gol");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("P3");
  });

  it("próxima etapa segue a ordem e termina em Concluído", () => {
    expect(proximaEtapa("projeto", "col")).toBe("pron");
    expect(proximaEtapa("projeto", "conc")).toBeNull();
    expect(proximaEtapa("deal", "cont")).toBe("pago");
    expect(proximaEtapa("deal", "pago")).toBeNull();
  });
});

describe("checklist", () => {
  it("campos opcionais não contam e o percentual é por item", () => {
    expect(CHECKLIST).toHaveLength(8);
    expect(percentualFormulario({ cardapio: { arq: "x.pdf" } })).toBe(13);
    expect(percentualFormulario(undefined)).toBe(0);
  });

  it("não altera o estado original", () => {
    const e = estadoDeExemplo();
    const antes = JSON.stringify(e);
    atualizarCampo(e, "deal", "D1", "contato", "Alguém");
    mover(e, "deal", "D2", "prop");
    expect(JSON.stringify(e)).toBe(antes);
  });
});
