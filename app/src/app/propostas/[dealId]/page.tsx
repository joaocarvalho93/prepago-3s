"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEstado } from "@/dados/EstadoProvider";
import { Carregando } from "@/componentes/Carregando";
import { EditorProposta } from "@/componentes/EditorProposta";

export default function PaginaProposta() {
  const { dealId } = useParams<{ dealId: string }>();
  const { pronto } = useEstado();
  return (
    <>
      <header className="top"><h1>Proposta</h1><Link className="btn" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }} href="/propostas">Todas as propostas</Link></header>
      <div className="content">{!pronto ? <Carregando /> : <EditorProposta dealId={dealId} />}</div>
    </>
  );
}
