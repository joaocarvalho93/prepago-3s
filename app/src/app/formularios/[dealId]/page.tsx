import { notFound } from "next/navigation";
import { repositorio } from "@/dados/repositorio";
import { FormularioCliente } from "@/componentes/FormularioCliente";
import { ListaFormularios } from "@/componentes/ListaFormularios";

export default async function Formulario({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const e = await repositorio.carregar();
  const deal = e.deals.find((d) => d.id === dealId);
  if (!deal || !e.formularios[dealId]) notFound();
  return (
    <>
      <header className="top"><h1>Formulários do cliente</h1></header>
      <div className="content">
        <div className="fw">
          <ListaFormularios estado={e} atual={dealId} />
          <FormularioCliente key={dealId} deal={deal} respostas={e.formularios[dealId]} />
        </div>
      </div>
    </>
  );
}
