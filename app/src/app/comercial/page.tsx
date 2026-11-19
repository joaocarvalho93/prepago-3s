"use client";
import { useEstado } from "@/dados/EstadoProvider";
import { percentualFormulario } from "@/dominio/checklist";
import { pendencias, proximaEtapa } from "@/dominio/regras";
import { Carregando } from "@/componentes/Carregando";
import { Quadro } from "@/componentes/Quadro";
import { reais } from "@/componentes/formato";

export default function Comercial() {
  const { estado: e, pronto } = useEstado();
  const abertos = e.deals.filter((d) => d.etapa !== "perd");
  const prontos = abertos.filter((d) => {
    const p = proximaEtapa("deal", d.etapa);
    return p && pendencias("deal", d, p, e).length === 0;
  });
  const kpis: [string, string][] = [
    ["Setup em pipeline", reais(abertos.filter((d) => d.etapa !== "pago").reduce((a, d) => a + d.valorSetup, 0))],
    ["Setup pago", reais(abertos.filter((d) => d.etapa === "pago").reduce((a, d) => a + d.valorSetup, 0))],
    ["Prontos para avançar", `${prontos.length} de ${abertos.length}`],
    ["Formulários abertos", String(Object.values(e.formularios).filter((f) => percentualFormulario(f) < 100).length)],
  ];
  return (
    <>
      <header className="top"><h1>Pipeline comercial</h1></header>
      <div className="content">
        {!pronto ? <Carregando /> : <>
          <div className="kpis">{kpis.map(([r, v]) => <div className="kpi" key={r}><span>{r}</span><b>{v}</b></div>)}</div>
          <p className="note">Arraste os cartões entre as etapas. Se faltar algum campo obrigatório, o avanço é bloqueado e a lista de pendências aparece.</p>
          <Quadro tipo="deal" />
        </>}
      </div>
    </>
  );
}
