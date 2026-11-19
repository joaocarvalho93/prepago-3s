"use client";
// Caixa "Diagnóstico e proposta" na ficha do deal: anexar o diagnóstico (PDF) e gerar a proposta inicial.
import Link from "next/link";
import { useRef, useState } from "react";
import { useEstado } from "@/dados/EstadoProvider";
import { calcularAderencia, NOME_CLASSIFICACAO } from "@/dominio/proposta/aderencia";
import { diagnosticoDeExemplo, lerDiagnostico } from "@/dominio/proposta/diagnostico";
import { totais } from "@/dominio/proposta/gerador";
import { anexarDiagnostico, ETAPAS_ANEXAR_DIAGNOSTICO, ETAPAS_PROPOSTA, gerarPropostaDoDeal, removerDiagnostico } from "@/dominio/proposta/operacoes";
import type { Deal } from "@/dominio/tipos";
import { reais } from "./formato";
import { textoDoPdf } from "./lerPdf";

export function CaixaProposta({ deal, onAviso }: { deal: Deal; onAviso: (t: string) => void }) {
  const { estado, executar } = useEstado();
  const entrada = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState("");
  const diag = estado.diagnosticos[deal.id];
  const proposta = estado.propostas[deal.id];
  const podeAnexar = ETAPAS_ANEXAR_DIAGNOSTICO.includes(deal.etapa);
  const podeGerar = ETAPAS_PROPOSTA.includes(deal.etapa) && !!diag;
  const fit = diag ? calcularAderencia(diag.respostas) : null;

  const tratar = (r: ReturnType<typeof executar>) => (r.ok ? onAviso(r.aviso) : onAviso(r.erro));

  async function anexar(arquivo: File) {
    setErro("");
    setLendo(true);
    try {
      const d = lerDiagnostico(await textoDoPdf(arquivo), arquivo.name);
      tratar(executar((e) => anexarDiagnostico(e, deal.id, d)));
    } catch {
      setErro("Não consegui ler esse diagnóstico. Preencha a proposta manualmente.");
    } finally {
      setLendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  function exemplo() {
    const d = diagnosticoDeExemplo(deal.id + Date.now(), deal.conta, deal.lojas || 1);
    tratar(executar((e) => anexarDiagnostico(e, deal.id, { ...d, arquivo: `Diagnóstico de exemplo - ${deal.conta}.pdf`, recebidoEm: new Date().toISOString() })));
  }

  function gerar() {
    if (proposta?.editados.length && !confirm("A proposta tem edições manuais. Elas serão mantidas e o restante será recalculado. Gerar novamente?")) return;
    tratar(executar((e) => gerarPropostaDoDeal(e, deal.id)));
  }

  const motivoBloqueio = !diag ? "Anexe o diagnóstico primeiro" : !ETAPAS_PROPOSTA.includes(deal.etapa) ? "Disponível nas etapas Proposta e Negociação" : "";

  return (
    <div className="box">
      <h4>Diagnóstico e proposta</h4>
      {diag ? (
        <div className="as" style={{ borderTop: 0, paddingTop: 0 }}>
          <span style={{ fontSize: 13.5 }}>📎 {diag.arquivo}<br />
            <span style={{ color: "var(--mut)" }}>{Object.keys(diag.respostas).length}/100 itens · fit {fit!.pct.toLocaleString("pt-BR")}% · {NOME_CLASSIFICACAO[fit!.classificacao]}</span>
          </span>
          {podeAnexar && <button className="btn sm" onClick={() => tratar(executar((e) => removerDiagnostico(e, deal.id)))}>Remover</button>}
        </div>
      ) : (
        <p className="note" style={{ margin: "0 0 8px" }}>
          {podeAnexar ? "Anexe o PDF do diagnóstico de aderência. Ele é lido aqui no navegador e não é enviado a nenhum servidor." : "O diagnóstico pode ser anexado a partir da etapa Aderência."}
        </p>
      )}
      {podeAnexar && !diag && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input ref={entrada} type="file" accept="application/pdf" hidden aria-label="Arquivo do diagnóstico" onChange={(e) => e.target.files?.[0] && anexar(e.target.files[0])} />
          <button className="btn sm" disabled={lendo} onClick={() => entrada.current?.click()}>{lendo ? "Lendo o PDF…" : "Anexar PDF"}</button>
          <button className="btn sm" onClick={exemplo}>Usar diagnóstico de exemplo</button>
        </div>
      )}
      {erro && <p className="pend" role="alert" style={{ display: "block", marginTop: 8 }}>{erro}</p>}

      {proposta && (
        <div className="as">
          <span style={{ fontSize: 13.5 }}>Proposta · {reais(totais(proposta).mensalidadeLoja)}/loja
            {proposta.editados.length > 0 && <span style={{ color: "var(--mut)" }}> · {proposta.editados.length} campo(s) editado(s)</span>}</span>
          <Link className="btn sm" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }} href={`/propostas/${deal.id}`}>Abrir</Link>
        </div>
      )}
      {(podeAnexar || proposta) && (
        <button className="btn pri" style={{ marginTop: 10, width: "100%" }} disabled={!podeGerar} title={motivoBloqueio || undefined} onClick={gerar}>
          ⚡ {proposta ? "Gerar novamente" : "Gerar proposta inicial"}
        </button>
      )}
      {motivoBloqueio && (podeAnexar || proposta) && <p className="note" style={{ margin: "6px 0 0" }}>{motivoBloqueio}</p>}
    </div>
  );
}
