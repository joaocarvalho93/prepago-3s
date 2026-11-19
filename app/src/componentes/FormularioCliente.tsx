"use client";
// Formulário de onboarding, como o cliente o vê pelo link. Cada mudança é salva na hora.
import { CHECKLIST, itemCompleto, percentualFormulario, type Campo, type ItemChecklist } from "@/dominio/checklist";
import type { Deal } from "@/dominio/tipos";
import { useEstado } from "@/dados/EstadoProvider";
import { salvarResposta } from "@/dominio/operacoes";

export function FormularioCliente({ deal }: { deal: Deal }) {
  const { estado, executar } = useEstado();
  const valores = estado.formularios[deal.id] ?? {};
  const pc = percentualFormulario(valores);
  // Provisório: o link definitivo usará o token da tabela `formulario`.
  const link = `3s-onboarding.exemplo/f/${deal.id.toLowerCase()}`;
  const alterar = (item: string, campo: string, valor: string | string[]) =>
    executar((e) => salvarResposta(e, deal.id, item, campo, valor));

  return (
    <div className="portal">
      <div className="ph">
        <div className="u">Link para o cliente: <code>{link}</code>
          <button className="btn sm" style={{ background: "#2c3342", color: "#fff", borderColor: "#3f4759" }}
            onClick={() => navigator.clipboard?.writeText(link)}>Copiar link</button>
        </div>
        <h2>Onboarding · {deal.conta}</h2>
        <p>Preencha as informações para liberarmos o setup da sua operação. Você pode salvar e voltar depois.</p>
        <div className="bar" style={{ background: "#3f4759", marginTop: 12 }}><i className={pc === 100 ? "full" : ""} style={{ width: pc + "%" }} /></div>
        <p style={{ fontSize: 13, marginTop: 6 }}>{pc}% concluído{pc === 100 ? " · tudo pronto para o setup" : ""}</p>
      </div>
      <div className="pb">
        {CHECKLIST.map((it) => {
          const ok = itemCompleto(it, valores[it.chave]);
          return (
            <div className="sec" key={it.chave}>
              <h4><span className="req"><span className={"s" + (ok ? " y" : "")}>{ok ? "✓" : "!"}</span></span>{it.titulo}</h4>
              <p>{it.descricao}</p>
              <div className="ff">
                {it.campos.map((c) => (
                  <CampoFormulario key={c.nome} item={it} campo={c} valor={valores[it.chave]?.[c.nome]} dealId={deal.id}
                    onAlterar={(v) => alterar(it.chave, c.nome, v)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CampoFormulario({ item, campo: c, valor, dealId, onAlterar }: {
  item: ItemChecklist; campo: Campo; valor: string | string[] | undefined; dealId: string;
  onAlterar: (v: string | string[]) => void;
}) {
  const id = `f-${dealId}-${item.chave}-${c.nome}`;
  const texto = typeof valor === "string" ? valor : "";
  if (c.tipo === "multipla") {
    const lista = Array.isArray(valor) ? valor : [];
    return (
      <div style={{ gridColumn: "1/-1", fontSize: 13, color: "var(--mut)", fontWeight: 500 }}>{c.rotulo}
        <div className="ms">{c.opcoes!.map((o) => (
          <label key={o}><input type="checkbox" checked={lista.includes(o)}
            onChange={(e) => onAlterar(e.target.checked ? [...lista, o] : lista.filter((x) => x !== o))} />{o}</label>
        ))}</div>
      </div>
    );
  }
  let entrada: React.ReactNode;
  if (c.tipo === "arquivo") {
    // Provisório: guarda só o nome do arquivo. O envio real irá para o Storage do Supabase.
    entrada = <>
      <input className="in" id={id} type="file" style={{ paddingTop: 7 }} onChange={(e) => onAlterar(e.target.files?.[0]?.name ?? "")} />
      {texto && <span className="fn">Enviado: {texto}</span>}
    </>;
  } else if (c.tipo === "selecao") {
    entrada = <select className="in" id={id} value={texto} onChange={(e) => onAlterar(e.target.value)}>
      <option value="">Selecione</option>{c.opcoes!.map((o) => <option key={o}>{o}</option>)}
    </select>;
  } else if (c.tipo === "area") {
    entrada = <textarea className="in" id={id} value={texto} onChange={(e) => onAlterar(e.target.value)} />;
  } else {
    const tipos: Record<string, string> = { data: "date", numero: "number", email: "email" };
    entrada = <input className="in" id={id} type={tipos[c.tipo ?? ""] ?? "text"} value={texto}
      onChange={(e) => onAlterar(e.target.value)} />;
  }
  return <label htmlFor={id}>{c.rotulo}{c.opcional ? " (opcional)" : ""}{entrada}</label>;
}
