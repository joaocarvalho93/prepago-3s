"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEstado } from "@/dados/EstadoProvider";
import { Carregando } from "@/componentes/Carregando";
import { FormularioCliente } from "@/componentes/FormularioCliente";
import { ListaFormularios } from "@/componentes/ListaFormularios";

export default function Formulario() {
  const { dealId } = useParams<{ dealId: string }>();
  const { estado: e, pronto } = useEstado();
  const deal = e.deals.find((d) => d.id === dealId);
  return (
    <>
      <header className="top"><h1>Formulários do cliente</h1></header>
      <div className="content">
        {!pronto ? <Carregando /> : !deal || !e.formularios[dealId] ? (
          <div className="box">Formulário não encontrado. <Link href="/formularios">Ver todos</Link></div>
        ) : (
          <div className="fw">
            <ListaFormularios atual={dealId} />
            <FormularioCliente key={dealId} deal={deal} />
          </div>
        )}
      </div>
    </>
  );
}
