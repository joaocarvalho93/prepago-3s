"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEstado } from "@/dados/EstadoProvider";

export function Navegacao() {
  const atual = usePathname();
  const { estado: e } = useEstado();
  const itens = [
    { href: "/comercial", nome: "Pipeline comercial", n: e.deals.filter((d) => d.etapa !== "perd").length },
    { href: "/projetos", nome: "Pipeline de projetos", n: e.projetos.length },
    { href: "/propostas", nome: "Propostas", n: Object.keys(e.propostas).length },
    { href: "/formularios", nome: "Formulários do cliente", n: Object.keys(e.formularios).length },
  ];
  return itens.map((i) => (
    <Link key={i.href} href={i.href} className="nav" aria-current={atual.startsWith(i.href) ? "page" : undefined}>
      {i.nome}
      <b>{i.n}</b>
    </Link>
  ));
}

export function RestaurarExemplo() {
  const { restaurarExemplo } = useEstado();
  return (
    <button className="nav" style={{ width: "100%", fontSize: 13, marginTop: "auto" }}
      onClick={() => confirm("Apagar suas alterações e voltar aos dados de exemplo?") && restaurarExemplo()}>
      Restaurar exemplo
    </button>
  );
}
