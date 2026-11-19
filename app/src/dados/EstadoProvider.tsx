"use client";
// Versão de teste: o estado fica no navegador de cada pessoa (localStorage).
// Cada testador tem a própria cópia dos dados fictícios e pode restaurar o exemplo quando quiser.
// Quando o app passar a usar o Supabase, só este arquivo muda: as telas continuam chamando `executar`.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { estadoDeExemplo } from "@/dominio/exemplo";
import type { Resultado } from "@/dominio/operacoes";
import type { Estado } from "@/dominio/tipos";

const CHAVE = "3s-mvp-v1";

type Contexto = {
  estado: Estado;
  pronto: boolean;
  /** Aplica uma operação do domínio. Só grava se as regras passarem. */
  executar: (operacao: (e: Estado) => Resultado) => Resultado;
  restaurarExemplo: () => void;
};

const Ctx = createContext<Contexto | null>(null);

function ler(): Estado | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const e = JSON.parse(bruto) as Estado;
    if (!(Array.isArray(e?.deals) && Array.isArray(e?.projetos) && e?.formularios)) return null;
    // Dados salvos antes do módulo de proposta: começam sem diagnósticos nem propostas.
    e.diagnosticos ??= {};
    e.propostas ??= {};
    return e;
  } catch {
    return null;
  }
}

function gravar(e: Estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e));
  } catch {
    // Navegador sem armazenamento (janela anônima restrita): o app segue funcionando até recarregar.
  }
}

export function EstadoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(estadoDeExemplo);
  const [pronto, setPronto] = useState(false);
  const atual = useRef(estado);

  useEffect(() => {
    const salvo = ler();
    if (salvo) {
      atual.current = salvo;
      setEstado(salvo);
    }
    setPronto(true);
  }, []);

  const executar = useCallback((operacao: (e: Estado) => Resultado) => {
    const r = operacao(atual.current);
    if (r.ok) {
      atual.current = r.estado;
      setEstado(r.estado);
      gravar(r.estado);
    }
    return r;
  }, []);

  const restaurarExemplo = useCallback(() => {
    const e = estadoDeExemplo();
    atual.current = e;
    setEstado(e);
    gravar(e);
  }, []);

  return <Ctx.Provider value={{ estado, pronto, executar, restaurarExemplo }}>{children}</Ctx.Provider>;
}

export function useEstado() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEstado precisa estar dentro de <EstadoProvider>");
  return c;
}
