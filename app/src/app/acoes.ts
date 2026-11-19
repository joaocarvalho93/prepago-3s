"use server";
// Server actions: toda mudança passa pelas regras do domínio no servidor.
import { revalidatePath } from "next/cache";
import { repositorio } from "@/dados/repositorio";
import * as op from "@/dominio/operacoes";
import type { Tipo } from "@/dominio/regras";
import type { Estado } from "@/dominio/tipos";

export type RespostaAcao = { ok: true; aviso: string } | { ok: false; erro: string; pendencias?: string[] };

async function aplicar(fn: (e: Estado) => op.Resultado): Promise<RespostaAcao> {
  const r = fn(await repositorio.carregar());
  if (!r.ok) return r;
  await repositorio.salvar(r.estado);
  revalidatePath("/", "layout");
  return { ok: true, aviso: r.aviso };
}

export async function moverAcao(tipo: Tipo, id: string, destino: string) {
  return aplicar((e) => op.mover(e, tipo, id, destino));
}

export async function atualizarCampoAcao(tipo: Tipo, id: string, campo: string, valor: string | number | boolean) {
  return aplicar((e) => op.atualizarCampo(e, tipo, id, campo, valor));
}

export async function gerarFormularioAcao(dealId: string) {
  return aplicar((e) => op.gerarFormulario(e, dealId));
}

export async function salvarRespostaAcao(dealId: string, item: string, campo: string, valor: string | string[]) {
  return aplicar((e) => op.salvarResposta(e, dealId, item, campo, valor));
}

export async function restaurarExemploAcao() {
  await repositorio.restaurarExemplo();
  revalidatePath("/", "layout");
}
