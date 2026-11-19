"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useEstado } from "@/dados/EstadoProvider";
import { Carregando } from "@/componentes/Carregando";
import { ListaFormularios } from "@/componentes/ListaFormularios";

export default function Formularios() {
  const { estado: e, pronto } = useEstado();
  const router = useRouter();
  const primeiro = e.deals.find((d) => e.formularios[d.id]);
  useEffect(() => {
    if (pronto && primeiro) router.replace(`/formularios/${primeiro.id}`);
  }, [pronto, primeiro, router]);
  return (
    <>
      <header className="top"><h1>Formulários do cliente</h1></header>
      <div className="content">
        {!pronto || primeiro ? <Carregando /> : <div className="fw"><ListaFormularios /><div className="box">Nenhum formulário gerado.</div></div>}
      </div>
    </>
  );
}
