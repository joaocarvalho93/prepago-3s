import { redirect } from "next/navigation";
import { repositorio } from "@/dados/repositorio";
import { ListaFormularios } from "@/componentes/ListaFormularios";

export default async function Formularios() {
  const e = await repositorio.carregar();
  const primeiro = e.deals.find((d) => e.formularios[d.id]);
  if (primeiro) redirect(`/formularios/${primeiro.id}`);
  return (
    <>
      <header className="top"><h1>Formulários do cliente</h1></header>
      <div className="content"><div className="fw"><ListaFormularios estado={e} /><div className="box">Nenhum formulário gerado.</div></div></div>
    </>
  );
}
