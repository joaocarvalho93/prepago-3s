import type { Metadata } from "next";
import { EstadoProvider } from "@/dados/EstadoProvider";
import { Navegacao, RestaurarExemplo } from "@/componentes/Navegacao";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pipelines 3S",
  description: "Versão de teste dos pipelines comercial e de projetos do plano pré-pago",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <EstadoProvider>
          <div className="app">
            <nav className="side" aria-label="Navegação">
              <div className="logo"><i>3S</i><span>Pipelines</span></div>
              <Navegacao />
              <RestaurarExemplo />
              <small style={{ marginTop: 0 }}>Versão de teste · dados fictícios salvos só neste navegador</small>
            </nav>
            <div className="main">{children}</div>
          </div>
        </EstadoProvider>
      </body>
    </html>
  );
}
