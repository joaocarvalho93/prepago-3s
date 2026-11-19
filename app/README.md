# MVP · Pipelines 3S

App da fase 2 do roadmap: pipeline comercial e pipeline de projetos conectados, com os portões P1, P2 e P3 aplicados no servidor. Portado de `../prototipo/index.html`.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # regras dos portões
npm run build
```

Os dados ficam em memória no servidor e voltam ao exemplo quando o servidor reinicia (ou pelo botão "Restaurar exemplo"). Todos os dados são fictícios.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/dominio/` | Etapas, portões, regras de avanço, checklist e operações. Código puro, sem dependência de framework |
| `src/dados/` | Repositório. Hoje em memória; a próxima versão usa o esquema de `../supabase/migrations` |
| `src/app/` | Páginas (`/comercial`, `/projetos`, `/formularios/[dealId]`) e server actions (`acoes.ts`) |
| `src/componentes/` | Kanban, ficha do registro e formulário do cliente |

## Como as regras são aplicadas

1. A tela chama uma server action (`moverAcao`, `atualizarCampoAcao`...).
2. A action carrega o estado, aplica a operação de `src/dominio/operacoes.ts` e só grava se as regras passarem.
3. Se faltar algo, a action devolve a lista de pendências e a tela mostra o bloqueio.

A tela usa as mesmas funções (`pendencias`, `avaliarEtapa`) para mostrar o que falta antes de o usuário tentar avançar.

## Diferenças em relação ao protótipo

- O portão P2 também exige o **contrato de setup assinado**, como em `docs/02-fluxo.md` (o protótipo só checava o pagamento).
- O formulário salva cada campo ao sair dele. Os arquivos guardam só o nome por enquanto; o envio real vai para o Storage do Supabase.
- A agenda de instalações ainda não foi portada.

## Pendências conhecidas

- `docs/05-modelo-de-dados.md` diz que o P2 exige os itens do checklist **validados**. O MVP ainda considera "preenchido". O esquema já tem `status` (pendente, recebido, validado) em `item_checklist`.
- No banco, "contrato assinado" e "setup pago" vêm das tabelas `contrato` e `cobranca` (visão `vw_deal_situacao`). No domínio do MVP ainda são campos do deal.
