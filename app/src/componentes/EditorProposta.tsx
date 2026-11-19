"use client";
// Editor da proposta com as 4 etapas da ferramenta comercial: Cadastro → Dores → Proposta → Apresentação.
// Tudo é editável; cada campo alterado à mão fica marcado e não é sobrescrito ao gerar de novo.
import Link from "next/link";
import { useState } from "react";
import { useEstado } from "@/dados/EstadoProvider";
import { NOME_CLASSIFICACAO } from "@/dominio/proposta/aderencia";
import { CONCORRENTES, DORES, FIXE, moduloPorId, SEGMENTOS, type CategoriaModulo, type Segmento } from "@/dominio/proposta/catalogo";
import { avisos, SECOES_APRESENTACAO, totais, type CampoEditavel, type ItemProposta, type Proposta } from "@/dominio/proposta/gerador";
import { aplicarPropostaAoDeal, editarProposta, ETAPAS_PROPOSTA, gerarPropostaDoDeal } from "@/dominio/proposta/operacoes";
import { nomeEtapa } from "@/dominio/regras";
import { dataHora, reais } from "./formato";

const ETAPAS = ["Cadastro", "Dores", "Proposta", "Apresentação"];

export function EditorProposta({ dealId }: { dealId: string }) {
  const { estado, executar } = useEstado();
  const [etapa, setEtapa] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const deal = estado.deals.find((d) => d.id === dealId);
  const p = estado.propostas[dealId];
  if (!deal || !p) return <div className="box">Proposta não encontrada. <Link href="/propostas">Ver propostas</Link></div>;

  const t = totais(p);
  const editavel = ETAPAS_PROPOSTA.includes(deal.etapa);
  const avisar = (x: string) => { setAviso(x); setTimeout(() => setAviso(null), 2800); };
  const editar = <K extends CampoEditavel>(campo: K, valor: Proposta[K]) => {
    const r = executar((e) => editarProposta(e, dealId, campo, valor));
    if (!r.ok) avisar(r.erro);
  };
  const gerar = () => {
    if (p.editados.length && !confirm("A proposta tem edições manuais. Elas serão mantidas e o restante será recalculado. Gerar novamente?")) return;
    const r = executar((e) => gerarPropostaDoDeal(e, dealId));
    avisar(r.ok ? r.aviso : r.erro);
  };
  const aplicar = () => {
    const r = executar((e) => aplicarPropostaAoDeal(e, dealId));
    avisar(r.ok ? r.aviso : r.erro);
  };
  const Ed = ({ campo }: { campo: CampoEditavel }) => (p.editados.includes(campo) ? <span className="tag">editado</span> : null);

  return (
    <>
      <div className="box" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ marginRight: "auto" }}>
          <div className="note" style={{ margin: 0 }}>Proposta · deal em {nomeEtapa("deal", deal.etapa)} · atualizada {dataHora(p.dataModificacao)}</div>
          <h2 style={{ margin: "2px 0 6px", fontSize: 22 }}>{p.nome}</h2>
          {p.fitAderencia
            ? <span className={"fit " + p.fitAderencia.classificacao}>Fit de aderência: {p.fitAderencia.pct.toLocaleString("pt-BR")}% · {NOME_CLASSIFICACAO[p.fitAderencia.classificacao]}</span>
            : <span className="fit sem_fit">Sem diagnóstico</span>}
        </div>
        <div className="kpi" style={{ minWidth: 170 }}><span>Mensalidade sugerida</span><b>{reais(t.mensalidadeLoja)}<small style={{ fontSize: 13, fontWeight: 400 }}>/loja</small></b></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="noprint">
          <button className="btn" onClick={gerar} disabled={!editavel || !estado.diagnosticos[dealId]}>⚡ Gerar novamente</button>
          <button className="btn pri" onClick={aplicar} disabled={!editavel} title="Leva setup, instalação e mensalidade para o deal">Aplicar valores ao deal</button>
        </div>
      </div>

      {avisos(p).map((a) => <div key={a.texto} className={"aviso" + (a.nivel === "erro" ? " erro" : "")} role="alert">{a.texto}</div>)}
      {!editavel && <div className="aviso">O deal está em {nomeEtapa("deal", deal.etapa)}. A proposta pode ser editada, mas gerar de novo e aplicar valores só valem nas etapas Proposta e Negociação.</div>}

      <nav className="steps" aria-label="Etapas da proposta">
        {ETAPAS.map((nome, i) => (
          <button key={nome} aria-current={etapa === i ? "step" : undefined} onClick={() => setEtapa(i)}><i>{i + 1}</i>{nome}</button>
        ))}
      </nav>

      {etapa === 0 && (
        <div className="box"><h4>Cadastro</h4>
          <div className="fl">
            <label className="w">Nome da marca<Ed campo="nome" /><Texto valor={p.nome} onSalvar={(v) => editar("nome", v)} /></label>
            <label>Restaurantes (lojas)<Ed campo="lj" /><Numero valor={p.lj} min={1} onSalvar={(v) => editar("lj", Math.max(1, v))} /></label>
            <label>Segmento<Ed campo="segmento" />
              <select className="in" value={p.segmento} onChange={(e) => editar("segmento", e.target.value as Segmento)}>
                {SEGMENTOS.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </label>
            <label>Meses de contrato<Ed campo="ct" /><Numero valor={p.ct} min={12} onSalvar={(v) => editar("ct", v)} /></label>
            <label>Meses de rollout<Ed campo="ro" /><Numero valor={p.ro} min={1} onSalvar={(v) => editar("ro", v)} /></label>
            <label>Estado (UF)<Ed campo="estado" /><Texto valor={p.estado} onSalvar={(v) => editar("estado", v.toUpperCase().slice(0, 2))} /></label>
            <span />
            <label>Setup (R$, taxa única)<Ed campo="setup" /><Numero valor={p.setup} onSalvar={(v) => editar("setup", v)} /></label>
            <label>Instalação por loja (R$)<Ed campo="inst" /><Numero valor={p.inst} onSalvar={(v) => editar("inst", v)} /></label>
            <label className="ck"><input type="checkbox" checked={p.ixSetup} onChange={(e) => editar("ixSetup", e.target.checked)} />Isentar setup<Ed campo="ixSetup" /></label>
            <label className="ck"><input type="checkbox" checked={p.ixInst} onChange={(e) => editar("ixInst", e.target.checked)} />Isentar instalação<Ed campo="ixInst" /></label>
          </div>
          <p className="note" style={{ margin: "10px 0 0" }}>Valores fictícios. A isenção é sugerida com alta aderência e 10 lojas ou mais; essa regra será revista no plano pré-pago.</p>
        </div>
      )}

      {etapa === 1 && (
        <>
          <div className="box"><h4>Dores do cliente<Ed campo="dores" /></h4>
            <p className="note">Pré-marcadas a partir dos itens &quot;Não possui&quot; e &quot;Crítico / Manual&quot; do diagnóstico.</p>
            <div className="chips">
              {DORES.map((d) => (
                <label key={d.id}>
                  <input type="checkbox" checked={p.dores.includes(d.id)}
                    onChange={(e) => editar("dores", e.target.checked ? DORES.map((x) => x.id).filter((id) => id === d.id || p.dores.includes(id)) : p.dores.filter((x) => x !== d.id))} />
                  <span>{d.texto}<br /><small style={{ color: "var(--mut)" }}>{d.solucao}</small></span>
                </label>
              ))}
            </div>
          </div>
          <div className="box"><h4>PDV atual<Ed campo="conc" /></h4>
            <select className="in" style={{ maxWidth: 320 }} value={p.conc} onChange={(e) => editar("conc", e.target.value)} aria-label="PDV atual">
              <option value="">Não identificado</option>
              {CONCORRENTES.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </>
      )}

      {etapa === 2 && (
        <div className="dg" style={{ padding: 0 }}>
          <div>
            <TabelaModulos titulo="Serviços essenciais" cat="ess" p={p} onEditar={(m) => editar("modulos", m)} />
            <TabelaModulos titulo="Serviços adicionais" cat="add" p={p} onEditar={(m) => editar("modulos", m)} />
            <div className="box">
              <label className="ck"><input type="checkbox" checked={p.ecoProd} onChange={(e) => editar("ecoProd", e.target.checked)} />Incluir produtos adicionais (cross-sell)<Ed campo="ecoProd" /></label>
              {p.ecoProd && <TabelaModulos cat="prod" p={p} onEditar={(m) => editar("modulos", m)} soProdutos />}
            </div>
            <div className="box">
              <label className="ck"><input type="checkbox" checked={p.ecoFixe} onChange={(e) => editar("ecoFixe", e.target.checked)} />Incluir ecossistema Fixe (CRM e fidelidade)<Ed campo="ecoFixe" /></label>
              {p.ecoFixe && <TabelaModulos cat="prod" p={p} onEditar={(m) => editar("modulos", m)} soFixe />}
            </div>
          </div>
          <div>
            <div className="box" style={{ position: "sticky", top: 0 }}><h4>Resumo financeiro (fictício)</h4>
              <Linha r="Mensalidade por loja" v={reais(t.mensalidadeLoja)} forte />
              <Linha r={`Mensalidade da rede (${p.lj} lojas)`} v={reais(t.mensalidadeRede)} />
              <Linha r="Cross-sell por loja" v={reais(t.crossSellLoja)} />
              <Linha r="Setup" v={p.ixSetup ? "Isento" : reais(t.setup)} />
              <Linha r="Instalação (rede)" v={p.ixInst ? "Isenta" : reais(t.instalacao)} />
              <p className="note" style={{ margin: "10px 0 0" }}>&quot;Aplicar valores ao deal&quot; leva setup, instalação e mensalidade da rede para o deal, onde o portão P1 os usa.</p>
            </div>
            <div className="box"><h4>Versões</h4>
              <ul className="tl">{[...p.versoes].reverse().slice(0, 5).map((v) => (
                <li key={v.em}><time>{dataHora(v.em)}</time>{reais(v.mensalidade)}/loja{v.fit !== null ? ` · fit ${v.fit.toLocaleString("pt-BR")}%` : ""}</li>
              ))}</ul>
            </div>
          </div>
        </div>
      )}

      {etapa === 3 && <Apresentacao p={p} onSecoes={(s) => editar("secoes", s)} />}

      {aviso && <div className="toast" role="status">{aviso}</div>}
    </>
  );
}

function Linha({ r, v, forte }: { r: string; v: string; forte?: boolean }) {
  return <div className="as"><span>{r}</span><b style={{ fontWeight: forte ? 700 : 500 }}>{v}</b></div>;
}

function Numero({ valor, onSalvar, min = 0 }: { valor: number; onSalvar: (v: number) => void; min?: number }) {
  return <input className="in" type="number" min={min} key={valor} defaultValue={valor}
    onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== valor) onSalvar(v); }} />;
}

function Texto({ valor, onSalvar }: { valor: string; onSalvar: (v: string) => void }) {
  return <input className="in" key={valor} defaultValue={valor} onBlur={(e) => e.target.value !== valor && onSalvar(e.target.value)} />;
}

function TabelaModulos({ titulo, cat, p, onEditar, soFixe, soProdutos }: {
  titulo?: string; cat: CategoriaModulo; p: Proposta; onEditar: (m: ItemProposta[]) => void; soFixe?: boolean; soProdutos?: boolean;
}) {
  const fixeIds = new Set(FIXE.map((f) => f.id));
  const linhas = p.modulos.filter((m) => {
    const c = moduloPorId(m.id);
    if (!c || c.cat !== cat) return false;
    if (soFixe) return fixeIds.has(m.id);
    if (soProdutos) return !fixeIds.has(m.id);
    return true;
  });
  const mudar = (id: string, x: Partial<ItemProposta>) => onEditar(p.modulos.map((m) => (m.id === id ? { ...m, ...x } : m)));
  const grupos = [...new Set(linhas.map((l) => moduloPorId(l.id)!.grupo))];
  const conteudo = (
    <div className="tblw">
      <table className="tbl">
        <thead><tr><th>Incluir</th><th>Módulo</th><th>R$/mês por loja</th><th>Isentar</th></tr></thead>
        <tbody>
          {grupos.flatMap((g) => linhas.filter((l) => moduloPorId(l.id)!.grupo === g)).map((m) => {
            const c = moduloPorId(m.id)!;
            return (
              <tr key={m.id} className={m.ativo ? "" : "off"}>
                <td><input type="checkbox" aria-label={`Incluir ${c.nome}`} checked={m.ativo} onChange={(e) => mudar(m.id, { ativo: e.target.checked })} /></td>
                <td>{c.nome}{c.cat === "add" && c.naMensalidade === false ? <span className="tag">fora da mensalidade</span> : null}</td>
                <td><Numero valor={m.valor} onSalvar={(v) => mudar(m.id, { valor: v })} /></td>
                <td><input type="checkbox" aria-label={`Isentar ${c.nome}`} checked={m.isento} disabled={!m.ativo} onChange={(e) => mudar(m.id, { isento: e.target.checked })} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  if (!titulo) return <div style={{ marginTop: 8 }}>{conteudo}</div>;
  return <div className="box"><h4>{titulo}{p.editados.includes("modulos") ? <span className="tag">editado</span> : null}</h4>{conteudo}</div>;
}

function Apresentacao({ p, onSecoes }: { p: Proposta; onSecoes: (s: string[]) => void }) {
  const t = totais(p);
  const ativos = (cat: CategoriaModulo, fixe = false) =>
    p.modulos.filter((m) => m.ativo && moduloPorId(m.id)?.cat === cat && FIXE.some((f) => f.id === m.id) === fixe).map((m) => ({ ...m, c: moduloPorId(m.id)! }));
  const tem = (s: string) => p.secoes.includes(s);
  return (
    <>
      <div className="box noprint"><h4>Seções da apresentação</h4>
        <p className="note">Escolha o que entra. A apresentação não é enviada ao cliente por aqui.</p>
        <div className="ms">
          {SECOES_APRESENTACAO.map((s) => (
            <label key={s.id}><input type="checkbox" checked={tem(s.id)}
              onChange={(e) => onSecoes(e.target.checked ? SECOES_APRESENTACAO.map((x) => x.id as string).filter((id) => id === s.id || tem(id)) : p.secoes.filter((x) => x !== s.id))} />{s.nome}</label>
          ))}
        </div>
        <button className="btn sm" style={{ marginTop: 10 }} onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
      </div>
      <article className="apres">
        <div className="note" style={{ margin: 0 }}>3S Checkout · proposta comercial (rascunho)</div>
        <h2 style={{ margin: "4px 0 16px" }}>{p.nome}</h2>
        {tem("dores") && <><h3>Dores e soluções</h3>
          {p.dores.length ? <ul className="req">{DORES.filter((d) => p.dores.includes(d.id)).map((d) => <li key={d.id}><span className="s y">✓</span><span><b>{d.texto}</b><br />{d.solucao}</span></li>)}</ul> : <p className="note">Nenhuma dor selecionada.</p>}</>}
        {tem("modulos") && <><h3>Módulos contratados</h3>
          <ul>{[...ativos("ess"), ...ativos("add")].map((m) => <li key={m.id}>{m.c.nome}{m.isento ? " (isento)" : ""}</li>)}</ul></>}
        {tem("investimento") && <><h3>Investimento</h3>
          <div className="resumo">
            <div className="kpi"><span>Mensalidade por loja</span><b>{reais(t.mensalidadeLoja)}</b></div>
            <div className="kpi"><span>Setup</span><b>{p.ixSetup ? "Isento" : reais(t.setup)}</b></div>
            <div className="kpi"><span>Instalação por loja</span><b>{p.ixInst ? "Isenta" : reais(p.inst)}</b></div>
            <div className="kpi"><span>Contrato</span><b>{p.ct} meses</b></div>
          </div></>}
        {tem("ecossistema") && (p.ecoProd || p.ecoFixe) && <><h3>Ecossistema e produtos adicionais</h3>
          <ul>{[...(p.ecoProd ? ativos("prod") : []), ...(p.ecoFixe ? ativos("prod", true) : [])].map((m) => <li key={m.id}>{m.c.nome} · {reais(m.valor)}/mês</li>)}</ul></>}
        {tem("cronograma") && <><h3>Cronograma de implantação</h3>
          <p>Rollout de {p.lj} {p.lj === 1 ? "loja" : "lojas"} em {p.ro} {p.ro === 1 ? "mês" : "meses"}, cerca de {Math.ceil(p.lj / Math.max(1, p.ro))} por mês.</p></>}
        <p className="note" style={{ marginTop: 18 }}>Valores fictícios, apenas para teste.</p>
      </article>
    </>
  );
}
