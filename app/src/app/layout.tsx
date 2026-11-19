import type { Metadata } from "next";
import { repositorio } from "@/dados/repositorio";
import { Navegacao } from "@/componentes/Navegacao";
import { restaurarExemploAcao } from "./acoes";
import "./globals.css";

export const metadata: Metadata = { title: "Pipelines 3S", description: "MVP dos pipelines comercial e de projetos do plano pré-pago" };
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const e = await repositorio.carregar();
  const contagens = {
    comercial: e.deals.filter((d) => d.etapa !== "perd").length,
    projetos: e.projetos.length,
    formularios: Object.keys(e.formularios).length,
  };
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app">
          <nav className="side" aria-label="Navegação">
            <div className="logo"><i>3S</i><span>Pipelines</span></div>
            <Navegacao contagens={contagens} />
            <form action={restaurarExemploAcao} style={{ marginTop: "auto" }}>
              <button className="nav" style={{ width: "100%", fontSize: 13 }}>Restaurar exemplo</button>
            </form>
            <small style={{ marginTop: 0 }}>MVP · dados fictícios</small>
          </nav>
          <div className="main">{children}</div>
        </div>
      </body>
    </html>
  );
}
