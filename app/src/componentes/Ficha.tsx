"use client";
// Ficha do deal ou do projeto (painel lateral), no molde da ficha de registro de um CRM.
import Link from "next/link";
import { CHECKLIST, itemCompleto, percentualFormulario } from "@/dominio/checklist";
import { avaliarEtapa, ETAPAS_DEAL, ETAPAS_GERAR_FORMULARIO, ETAPAS_PROJETO, nomeEtapa, PORTAO_DA_ETAPA, proximaEtapa, type Tipo } from "@/dominio/regras";
import type { Deal, Projeto } from "@/dominio/tipos";
import { useEstado } from "@/dados/EstadoProvider";
import { atualizarCampo, gerarFormulario } from "@/dominio/operacoes";
import type { Bloqueio } from "./Quadro";
import { dataHora } from "./formato";

type Props = {
  tipo: Tipo; id: string;
  onFechar: () => void; onAbrir: (t: Tipo, id: string) => void; onMover: (destino: string) => void;
  onAviso: (t: string) => void; onBloqueio: (b: Bloqueio) => void;
};

export function Ficha({ tipo, id, onFechar, onAbrir, onMover, onAviso, onBloqueio }: Props) {
  const { estado, executar } = useEstado();
  const o = tipo === "deal" ? estado.deals.find((x) => x.id === id) : estado.projetos.find((x) => x.id === id);
  if (!o) return null;
  const d = tipo === "deal" ? (o as Deal) : estado.deals.find((x) => x.id === (o as Projeto).dealId)!;
  const projeto = d.projetoId ? estado.projetos.find((p) => p.id === d.projetoId) : undefined;
  const temForm = !!estado.formularios[d.id];
  const pc = percentualFormulario(estado.formularios[d.id]);
  const prox = o.etapa === "perd" ? null : proximaEtapa(tipo, o.etapa);
  const regras = prox ? avaliarEtapa(tipo, o, prox, estado) : [];

  const salvar = (campo: string, valor: string | number | boolean) => {
    const r = executar((e) => atualizarCampo(e, tipo, id, campo, valor));
    if (!r.ok) onAviso(r.erro);
  };
  const gerar = () => {
    const r = executar((e) => gerarFormulario(e, d.id));
    if (r.ok) onAviso(r.aviso);
    else onBloqueio({ erro: r.erro, pendencias: [], tipo, id });
  };

  const reg = o as unknown as Record<string, string | number | boolean>;
  const texto = (campo: string, rotulo: string, tipoInput = "text", largo = false) => (
    <label className={largo ? "w" : undefined}>
      {rotulo}
      <input className="in" type={tipoInput} key={`${campo}-${reg[campo]}`} defaultValue={String(reg[campo] ?? "")}
        onBlur={(e) => e.target.value !== String(reg[campo] ?? "") && salvar(campo, tipoInput === "number" ? Number(e.target.value) : e.target.value)} />
    </label>
  );
  const selecao = (campo: string, rotulo: string, opcoes: string[]) => (
    <label>
      {rotulo}
      <select className="in" value={String(reg[campo] ?? "")} onChange={(e) => salvar(campo, e.target.value)}>
        <option value="">Selecione</option>
        {opcoes.map((x) => <option key={x}>{x}</option>)}
      </select>
    </label>
  );
  const marcar = (campo: string, rotulo: string) => (
    <label className="ck"><input type="checkbox" checked={!!reg[campo]} onChange={(e) => salvar(campo, e.target.checked)} />{rotulo}</label>
  );

  const etapas = tipo === "deal" ? ETAPAS_DEAL : ETAPAS_PROJETO;
  return (
    <div className="drw" onClick={(e) => e.target === e.currentTarget && onFechar()} onKeyDown={(e) => e.key === "Escape" && onFechar()}>
      <aside className="dp" role="dialog" aria-modal="true" aria-label={d.conta}>
        <div className="dh">
          <div>
            <div className="m">{tipo === "deal" ? "Deal" : "Projeto de implantação"}</div>
            <h2>{d.conta}</h2>
            <span className="pill">{nomeEtapa(tipo, o.etapa)}</span>
          </div>
          <div className="x" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <label className="m" htmlFor="mv">Mover para</label>
            <select className="in" id="mv" value={o.etapa} onChange={(e) => onMover(e.target.value)} style={{ width: "auto" }}>
              {etapas.map((s) => <option key={s.id} value={s.id}>{s.nome}{PORTAO_DA_ETAPA[s.id] ? ` (${PORTAO_DA_ETAPA[s.id]})` : ""}</option>)}
            </select>
            <button className="btn" onClick={onFechar} autoFocus>Fechar</button>
          </div>
        </div>

        <div className="dg">
          <div>
            {tipo === "deal" ? (
              <>
                <div className="box"><h4>Empresa</h4><div className="fl">
                  {texto("conta", "Conta", "text", true)}{texto("segmento", "Segmento")}{texto("lojas", "Nº de lojas", "number")}
                  {texto("contato", "Contato principal")}{texto("dono", "Dono do deal")}
                </div></div>
                <div className="box"><h4>Aderência</h4><div className="fl">
                  {selecao("aderencia", "Parecer de aderência", ["Pendente", "Aprovada", "Reprovada"])}
                </div></div>
                <div className="box"><h4>Proposta e oferta</h4><div className="fl">
                  {selecao("complexidade", "Complexidade do setup", ["Simples", "Média", "Complexa"])}
                  {texto("valorSetup", "Valor do setup (R$)", "number")}{texto("valorInstalacao", "Valor da instalação (R$)", "number")}
                  {texto("mensalidade", "Mensalidade (R$)", "number")}
                  {selecao("porte", "Porte e prazo de coleta", ["Até 5 lojas", "6 a 20 lojas", "Mais de 20 lojas"])}
                  {selecao("caminho", "Caminho após a instalação", ["Mensalidade", "Piloto"])}
                  <div className="w">{marcar("propostaAceita", "Proposta aceita pelo cliente")}</div>
                </div></div>
                <div className="box"><h4>Contrato e pagamento</h4><div className="fl">
                  {marcar("contratoSetupAssinado", "Contrato de setup assinado")}{marcar("setupPago", "Pagamento do setup compensado")}
                  {selecao("motivoPerda", "Motivo da perda (se perdido)", ["Preço do setup", "Escolheu concorrente", "Sem aderência técnica", "Projeto adiado"])}
                </div></div>
              </>
            ) : (
              <>
                <div className="box"><h4>Setup</h4><div className="fl">
                  {texto("dataSetup", "Data do setup", "date")}<div>{marcar("setupConcluido", "Setup concluído")}</div>
                </div></div>
                <div className="box"><h4>Homologação e instalação</h4><div className="fl">
                  {marcar("homologacaoAprovada", "Homologação aprovada pelo cliente")}
                  <div className="as" style={{ gridColumn: "1/-1" }}>
                    <span>{(o as Projeto).instalacao ? <>Instalação: <b>{(o as Projeto).instalacao}</b></> : "Instalação ainda não agendada"}</span>
                    <span className="m" style={{ fontSize: 13, color: "var(--mut)" }}>Agenda: próxima etapa do MVP</span>
                  </div>
                </div></div>
                <div className="box"><h4>Go-live</h4><div className="fl">
                  {marcar("licencaAssinada", "Contrato de licença assinado")}{marcar("primeiraMensalidadePaga", "1ª mensalidade paga")}
                  {d.caminho === "Piloto" && marcar("pilotoAprovado", "Piloto aprovado")}
                  {marcar("ativado", "Loja ativada")}{marcar("passagemCs", "Passagem para o CS concluída")}
                </div></div>
              </>
            )}
          </div>

          <div>
            {prox && (
              <div className="box">
                <h4>Para avançar para {nomeEtapa(tipo, prox)}{PORTAO_DA_ETAPA[prox as keyof typeof PORTAO_DA_ETAPA] ? ` · portão ${PORTAO_DA_ETAPA[prox as keyof typeof PORTAO_DA_ETAPA]}` : ""}</h4>
                <ul className="req">
                  {regras.map((r) => <li key={r.descricao}><span className={"s" + (r.ok ? " y" : "")}>{r.ok ? "✓" : "!"}</span>{r.descricao}</li>)}
                </ul>
                {regras.every((r) => r.ok) && (
                  <button className="btn pri" style={{ marginTop: 12, width: "100%" }} onClick={() => onMover(prox)}>Avançar para {nomeEtapa(tipo, prox)}</button>
                )}
              </div>
            )}

            <div className="box"><h4>Associações</h4>
              {tipo === "projeto" && (
                <div className="as"><span>Deal · {nomeEtapa("deal", d.etapa)}</span><button className="btn sm" onClick={() => onAbrir("deal", d.id)}>Abrir</button></div>
              )}
              <div className="as">
                <span>Formulário do cliente{temForm ? ` · ${pc}%` : ""}</span>
                {temForm ? <Link className="btn sm" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }} href={`/formularios/${d.id}`}>Abrir</Link>
                  : ETAPAS_GERAR_FORMULARIO.includes(d.etapa) ? <button className="btn sm" onClick={gerar}>Gerar</button>
                  : <span style={{ fontSize: 13, color: "var(--mut)" }}>Disponível a partir de Proposta</span>}
              </div>
              {tipo === "deal" && (
                <div className="as">
                  <span>Projeto{projeto ? ` · ${nomeEtapa("projeto", projeto.etapa)}` : ""}</span>
                  {projeto ? <button className="btn sm" onClick={() => onAbrir("projeto", projeto.id)}>Abrir</button>
                    : <span style={{ fontSize: 13, color: "var(--mut)" }}>Criado em Contrato de setup</span>}
                </div>
              )}
            </div>

            {tipo === "projeto" && (
              <div className="box"><h4>Checklist do cliente</h4><ul className="req">
                {CHECKLIST.map((it) => {
                  const ok = itemCompleto(it, estado.formularios[d.id]?.[it.chave]);
                  return <li key={it.chave}><span className={"s" + (ok ? " y" : "")}>{ok ? "✓" : "!"}</span>{it.titulo}</li>;
                })}
              </ul></div>
            )}

            <div className="box"><h4>Atividades</h4><ul className="tl">
              {o.atividades.slice(0, 8).map((a, i) => <li key={i}><time>{dataHora(a.em)}</time>{a.texto}</li>)}
            </ul></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
