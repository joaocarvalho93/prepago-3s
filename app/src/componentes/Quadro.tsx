"use client";
// Kanban dos dois pipelines, com a ficha do registro e o bloqueio por pendências.
import { useState } from "react";
import { percentualFormulario } from "@/dominio/checklist";
import { ETAPAS_DEAL, ETAPAS_PROJETO, nomeEtapa, pendencias, PORTAO_DA_ETAPA, proximaEtapa, type Tipo } from "@/dominio/regras";
import type { Deal, Estado, Projeto } from "@/dominio/tipos";
import { useEstado } from "@/dados/EstadoProvider";
import { mover as moverOp, type Resultado } from "@/dominio/operacoes";
import { Ficha } from "./Ficha";
import { reais } from "./formato";

export type Bloqueio = { erro: string; pendencias: string[]; tipo: Tipo; id: string };

export function Quadro({ tipo }: { tipo: Tipo }) {
  const { estado, executar } = useEstado();
  const [busca, setBusca] = useState("");
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [aberto, setAberto] = useState<{ tipo: Tipo; id: string } | null>(null);
  const [bloqueio, setBloqueio] = useState<Bloqueio | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const dealDe = (o: Deal | Projeto): Deal => (tipo === "deal" ? (o as Deal) : estado.deals.find((d) => d.id === (o as Projeto).dealId)!);
  const etapas = tipo === "deal" ? ETAPAS_DEAL : ETAPAS_PROJETO;
  const registros: (Deal | Projeto)[] = (tipo === "deal" ? estado.deals : estado.projetos).filter(
    (o) => !busca || dealDe(o).conta.toLowerCase().includes(busca.toLowerCase()),
  );

  const avisar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 2800);
  };
  const tratar = (t: Tipo, id: string) => (r: Resultado) => {
    if (r.ok) avisar(r.aviso);
    else setBloqueio({ erro: r.erro, pendencias: r.pendencias ?? [], tipo: t, id });
  };
  const mover = (t: Tipo, id: string, destino: string) => tratar(t, id)(executar((e) => moverOp(e, t, id, destino)));

  return (
    <>
      <input className="srch" type="search" placeholder="Buscar conta" aria-label="Buscar conta" value={busca}
        onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="board">
        {etapas.map(({ id: etapa, nome }) => {
          const itens = registros.filter((o) => o.etapa === etapa);
          const portao = PORTAO_DA_ETAPA[etapa];
          const sub = tipo === "deal" ? reais(itens.reduce((a, o) => a + (o as Deal).valorSetup, 0)) : `${itens.length} contas`;
          return (
            <section key={etapa} aria-label={nome} className={"col" + (sobre === etapa ? " over" : "")}
              onDragOver={(e) => { if (arrastando) { e.preventDefault(); setSobre(etapa); } }}
              onDragLeave={() => setSobre((s) => (s === etapa ? null : s))}
              onDrop={(e) => { e.preventDefault(); setSobre(null); if (arrastando) mover(tipo, arrastando, etapa); setArrastando(null); }}>
              <div className="ch">
                <h3>{nome}{portao && <span className="gate">{portao}</span>}</h3>
                <small>{itens.length} · {sub}</small>
              </div>
              <div className="cards">
                {itens.map((o) => (
                  <Cartao key={o.id} tipo={tipo} registro={o} deal={dealDe(o)} estado={estado} arrastando={arrastando === o.id}
                    onAbrir={() => setAberto({ tipo, id: o.id })} onArrastar={(v) => setArrastando(v ? o.id : null)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {aberto && (
        <Ficha {...aberto} onFechar={() => setAberto(null)} onAbrir={(t, id) => setAberto({ tipo: t, id })}
          onMover={(destino) => mover(aberto.tipo, aberto.id, destino)} onAviso={avisar}
          onBloqueio={setBloqueio} />
      )}

      {bloqueio && (
        <div className="mod" onClick={(e) => e.target === e.currentTarget && setBloqueio(null)}>
          <div className="mb" role="dialog" aria-modal="true" aria-labelledby="bloq-t">
            <h3 id="bloq-t">{bloqueio.erro}</h3>
            {bloqueio.pendencias.length > 0 && (
              <>
                <p>Preencha antes:</p>
                <ul className="req">
                  {bloqueio.pendencias.map((p) => <li key={p}><span className="s">!</span>{p}</li>)}
                </ul>
              </>
            )}
            <div className="acts">
              <button className="btn" onClick={() => setBloqueio(null)}>Fechar</button>
              <button className="btn pri" onClick={() => { setAberto({ tipo: bloqueio.tipo, id: bloqueio.id }); setBloqueio(null); }}>Abrir registro</button>
            </div>
          </div>
        </div>
      )}
      {aviso && <div className="toast" role="status">{aviso}</div>}
    </>
  );
}

function Cartao({ tipo, registro: o, deal: d, estado, arrastando, onAbrir, onArrastar }: {
  tipo: Tipo; registro: Deal | Projeto; deal: Deal; estado: Estado; arrastando: boolean;
  onAbrir: () => void; onArrastar: (v: boolean) => void;
}) {
  const prox = o.etapa === "perd" ? null : proximaEtapa(tipo, o.etapa);
  const faltando = prox ? pendencias(tipo, o, prox, estado) : [];
  const temForm = !!estado.formularios[d.id];
  const pc = percentualFormulario(estado.formularios[d.id]);
  const p = tipo === "projeto" ? (o as Projeto) : null;
  return (
    <button className={"cd" + (arrastando ? " drag" : "")} draggable onClick={onAbrir}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", o.id); onArrastar(true); }} onDragEnd={() => onArrastar(false)}>
      <b>{d.conta}</b>
      {tipo === "deal"
        ? <span className="v">{reais(d.valorSetup)} setup · {reais(d.mensalidade)}/mês</span>
        : <span className="v">{d.lojas} lojas · {d.caminho || "—"}</span>}
      <div className="m">
        {tipo === "deal" ? `${d.lojas} lojas · ${d.dono}` : p?.instalacao ? `Instalação: ${p.instalacao.split(" · ").slice(0, 2).join(" ")}` : `Dono: ${d.dono}`}
      </div>
      {temForm && (
        <>
          <div className="m" style={{ marginTop: 4 }}>Formulário {pc}%</div>
          <div className="bar"><i className={pc === 100 ? "full" : ""} style={{ width: pc + "%" }} /></div>
        </>
      )}
      {o.etapa === "perd" ? <span className="pend">{d.motivoPerda}</span>
        : prox && (
          <span className={"pend" + (faltando.length ? "" : " ok")}>
            {faltando.length
              ? `${faltando.length} pendência${faltando.length > 1 ? "s" : ""} para ${nomeEtapa(tipo, prox)}`
              : `Pronto para ${nomeEtapa(tipo, prox)}`}
          </span>
        )}
    </button>
  );
}
