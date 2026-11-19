"use client";
import { useEstado } from "@/dados/EstadoProvider";
import { percentualFormulario } from "@/dominio/checklist";
import { Carregando } from "@/componentes/Carregando";
import { Quadro } from "@/componentes/Quadro";

export default function Projetos() {
  const { estado: e, pronto } = useEstado();
  const ps = e.projetos;
  const kpis: [string, number][] = [
    ["Projetos ativos", ps.filter((p) => p.etapa !== "conc").length],
    ["Travados na coleta", ps.filter((p) => p.etapa === "col" && percentualFormulario(e.formularios[p.dealId]) < 100).length],
    ["Instalações agendadas", ps.filter((p) => p.instalacao).length],
    ["Em go-live ou depois", ps.filter((p) => ["gol", "aco", "conc"].includes(p.etapa)).length],
  ];
  return (
    <>
      <header className="top"><h1>Pipeline de projetos</h1></header>
      <div className="content">
        {!pronto ? <Carregando /> : <>
          <div className="kpis">{kpis.map(([r, v]) => <div className="kpi" key={r}><span>{r}</span><b>{v}</b></div>)}</div>
          <p className="note">Os projetos são criados automaticamente quando o deal chega a Contrato de setup. O portão P2 só libera com contrato assinado, setup pago e formulário 100%.</p>
          <Quadro tipo="projeto" />
        </>}
      </div>
    </>
  );
}
