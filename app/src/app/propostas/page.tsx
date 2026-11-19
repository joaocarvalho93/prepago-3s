"use client";
import Link from "next/link";
import { useEstado } from "@/dados/EstadoProvider";
import { calcularAderencia, NOME_CLASSIFICACAO } from "@/dominio/proposta/aderencia";
import { totais } from "@/dominio/proposta/gerador";
import { ETAPAS_ANEXAR_DIAGNOSTICO } from "@/dominio/proposta/operacoes";
import { nomeEtapa } from "@/dominio/regras";
import { Carregando } from "@/componentes/Carregando";
import { dataHora, reais } from "@/componentes/formato";

export default function Propostas() {
  const { estado: e, pronto } = useEstado();
  const deals = e.deals.filter((d) => e.propostas[d.id] || e.diagnosticos[d.id] || ETAPAS_ANEXAR_DIAGNOSTICO.includes(d.etapa));
  return (
    <>
      <header className="top"><h1>Propostas</h1></header>
      <div className="content">
        {!pronto ? <Carregando /> : <>
          <p className="note">A proposta inicial é gerada a partir do diagnóstico de aderência anexado ao deal. Abra o deal no pipeline comercial para anexar o diagnóstico e gerar a proposta. Pesos e valores são fictícios.</p>
          <div className="box tblw">
            <table className="tbl">
              <thead><tr><th>Conta</th><th>Etapa</th><th>Diagnóstico</th><th>Fit</th><th>Mensalidade/loja</th><th>Atualizada</th><th></th></tr></thead>
              <tbody>
                {deals.map((d) => {
                  const p = e.propostas[d.id], diag = e.diagnosticos[d.id];
                  const fit = p?.fitAderencia ?? (diag ? calcularAderencia(diag.respostas) : null);
                  return (
                    <tr key={d.id}>
                      <td><b>{d.conta}</b></td>
                      <td>{nomeEtapa("deal", d.etapa)}</td>
                      <td>{diag ? `${Object.keys(diag.respostas).length}/100 itens` : <span style={{ color: "var(--mut)" }}>Não anexado</span>}</td>
                      <td>{fit ? <span className={"fit " + fit.classificacao} style={{ fontSize: 12.5, padding: "2px 8px" }}>{fit.pct.toLocaleString("pt-BR")}% · {NOME_CLASSIFICACAO[fit.classificacao]}</span> : "—"}</td>
                      <td>{p ? reais(totais(p).mensalidadeLoja) : "—"}</td>
                      <td>{p ? dataHora(p.dataModificacao) : "—"}</td>
                      <td>{p ? <Link className="btn sm" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }} href={`/propostas/${d.id}`}>Abrir</Link> : <span style={{ fontSize: 13, color: "var(--mut)" }}>Gere pela ficha do deal</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>}
      </div>
    </>
  );
}
