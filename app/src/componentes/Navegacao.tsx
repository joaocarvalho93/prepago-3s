"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/comercial", nome: "Pipeline comercial", chave: "comercial" },
  { href: "/projetos", nome: "Pipeline de projetos", chave: "projetos" },
  { href: "/formularios", nome: "Formulários do cliente", chave: "formularios" },
] as const;

export function Navegacao({ contagens }: { contagens: Record<(typeof ITENS)[number]["chave"], number> }) {
  const atual = usePathname();
  return ITENS.map((i) => (
    <Link key={i.href} href={i.href} className="nav" aria-current={atual.startsWith(i.href) ? "page" : undefined}>
      {i.nome}
      <b>{contagens[i.chave]}</b>
    </Link>
  ));
}
