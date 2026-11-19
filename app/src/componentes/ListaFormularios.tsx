"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { percentualFormulario } from "@/dominio/checklist";
import { ETAPAS_GERAR_FORMULARIO, nomeEtapa } from "@/dominio/regras";
import { useEstado } from "@/dados/EstadoProvider";
import { gerarFormulario } from "@/dominio/operacoes";

export function ListaFormularios({ atual }: { atual?: string }) {
  const { estado, executar } = useEstado();
  const router = useRouter();
  const comForm = estado.deals.filter((d) => estado.formularios[d.id]);
  const candidatos = estado.deals.filter((d) => !estado.formularios[d.id] && ETAPAS_GERAR_FORMULARIO.includes(d.etapa));
  const gerar = (id: string) => {
    if (executar((e) => gerarFormulario(e, id)).ok) router.push(`/formularios/${id}`);
  };
  return (
    <div className="fli">
      <p className="note" style={{ margin: 0 }}>Formulários gerados a partir do deal. O progresso aparece no cartão do deal e libera o portão P2 do projeto.</p>
      {comForm.map((d) => {
        const p = percentualFormulario(estado.formularios[d.id]);
        return (
          <Link key={d.id} href={`/formularios/${d.id}`} className="fi" aria-current={d.id === atual ? "page" : undefined}>
            <b>{d.conta}</b><small>{nomeEtapa("deal", d.etapa)} · {p}% preenchido</small>
            <div className="bar"><i className={p === 100 ? "full" : ""} style={{ width: p + "%" }} /></div>
          </Link>
        );
      })}
      {candidatos.length > 0 && (
        <div className="box" style={{ margin: "6px 0 0" }}>
          <h4>Gerar formulário</h4>
          <p className="note">Disponível a partir da etapa Proposta, para a coleta começar durante a negociação.</p>
          {candidatos.map((c) => (
            <div className="as" key={c.id}><span>{c.conta}</span><button className="btn sm" onClick={() => gerar(c.id)}>Gerar</button></div>
          ))}
        </div>
      )}
    </div>
  );
}
