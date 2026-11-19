# 13 · Módulo Gerador de Proposta

Gera a proposta inicial dentro do deal a partir do **diagnóstico de aderência** (PDF). A proposta é sempre um rascunho: tudo é editável, e o que o vendedor editou não é sobrescrito ao gerar de novo.

> **Versão de teste:** pesos e valores são **fictícios**. Os pesos reais (planilha "NOVOS PESOS 3S CHECKOUT") e a tabela de preços não ficam neste repositório, que é público.

## Fluxo no CRM

| Etapa do deal | O que acontece |
|---|---|
| **Aderência** | Na ficha do deal, *Diagnóstico e proposta → Anexar PDF*. O PDF é lido no navegador e não é enviado a nenhum servidor. Também há *Usar diagnóstico de exemplo* |
| **Proposta** e **Negociação** | *Gerar proposta inicial* abre o rascunho em **Propostas**, com as 4 etapas: Cadastro, Dores, Proposta e Apresentação |
| Depois de revisar | *Aplicar valores ao deal* leva setup, instalação e mensalidade da rede para o deal. São os campos que o portão P1 usa |

## Como funciona

| Parte | Onde está | Como é feita |
|---|---|---|
| Leitura do PDF | `app/src/componentes/lerPdf.ts` e `dominio/proposta/diagnostico.ts` | pdf.js extrai o texto no navegador; o leitor encontra os 100 itens e o status de cada um, mais lojas, modelo de operação e PDV atual. Não usa IA |
| Fit de aderência | `dominio/proposta/aderencia.ts` | Código com testes, conforme o racional abaixo |
| Proposta sugerida | `dominio/proposta/gerador.ts` | Heurísticas da especificação |
| Itens e pesos | `dominio/proposta/itens.ts` | Os 100 itens do formulário, com pesos fictícios |
| Módulos, dores e preços | `dominio/proposta/catalogo.ts` | IDs iguais aos da ferramenta comercial; valores fictícios |
| Regras comerciais | `dominio/proposta/config.ts` | Setup, instalação, prazos e a regra de isenção |

O JSON da proposta usa os mesmos nomes de campo da ferramenta comercial (`lj`, `ct`, `ro`, `conc`, `dores`, `setup`, `inst`, `ixSetup`, `ixInst`, `ecoProd`, `ecoFixe`), mais `fitAderencia`, `editados` e `versoes`.

## Cálculo da aderência

- `Não possui`, `Crítico / Manual` e `Resolvido`: o item conta com o peso integral, mesmo com peso 0.
- `N/A`: o item sai do numerador e do denominador.
- `aderência = soma dos pesos / número de itens válidos`.

| Faixa (percentual arredondado) | Classificação |
|---|---|
| 0–20% | Sem fit com a 3S |
| 21–50% | Baixa aderência |
| 51–79% | Média aderência |
| 80–100% | Alta aderência |

Nos pesos fictícios, o peso é **quanto a 3S resolve cada item (0 a 100)**. Com essa leitura, a média fica na escala das faixas. Se os pesos reais somarem 100% entre os itens, a média fica perto de 1% e todos cairiam em "Sem fit". Ver a questão M-05.

## Heurísticas

- **Sempre:** PDV ilimitado, impressoras ilimitado, marketplace iFood / Open Delivery.
- **POS Mobile (até 3):** salão ou mais de 5 lojas.
- **Fixe (Fidelidade e CRM Admin):** fit a partir de 51%.
- **Isenção de setup e instalação:** alta aderência e 10 lojas ou mais. Pode ser desligada em `config.ts` (`isencaoAltaAderencia`).
- **Dores:** itens com `Não possui` ou `Crítico / Manual`, agrupados nas 14 dores da ferramenta.
- **PDV atual:** resposta do formulário comparada com a lista de concorrentes.

## Casos especiais

| Situação | Comportamento |
|---|---|
| Sem diagnóstico | Botão desabilitado: "Anexe o diagnóstico primeiro" |
| PDF ilegível | "Não consegui ler esse diagnóstico. Preencha a proposta manualmente." |
| Menos de 30 dos 100 itens | Aviso de diagnóstico incompleto, mas gera mesmo assim |
| Fit abaixo de 21% | Alerta em vermelho para reavaliar |
| Campo editado à mão | Marcado como *editado* e mantido ao gerar de novo |
| Gerar novamente com edições | Pede confirmação |

## Próxima versão: plano pré-pago

A regra de isenção de setup contradiz a decisão D-002 (setup pago antes de começar). Para o pré-pago:
1. Desligar `isencaoAltaAderencia` em `config.ts`.
2. Trocar a isenção por um desconto no setup por complexidade e pela entrega do checklist no prazo (`docs/03-politica-comercial.md`).
3. Manter o parcelamento da instalação nas primeiras mensalidades.

## Pontos em aberto

| # | Questão | Status |
|---|---|---|
| M-01 | Onde ficam os pesos reais: arquivo de configuração, banco ou Google Sheets | A definir. Hoje: `itens.ts`, fictícios |
| M-02 | Como o CRM identifica o diagnóstico certo | Feito: campo próprio no deal |
| M-03 | Compatibilidade do JSON com a ferramenta atual | Nomes mantidos; falta exportar e importar |
| M-04 | Versões da proposta | Feito: cada geração fica em `versoes` e na timeline do deal |
| M-05 | Significado do peso e o exemplo do racional (560/66 ≈ 8,5%) | Confirmar com quem escreveu o racional |
| M-06 | Isenção de setup x plano pré-pago | Próxima versão (ver acima) |
| M-07 | Margem da proposta | Fora desta versão: depende dos custos internos |
