# MVP · Pipelines 3S

App da fase 2 do roadmap: pipeline comercial e pipeline de projetos conectados, com os portões P1, P2 e P3. Portado de `../prototipo/index.html`.

**Fase atual: versão de teste de funcionalidades e UX/UI.** Os dados ficam no navegador de cada pessoa. Para publicar, veja [`../docs/12-versao-de-teste.md`](../docs/12-versao-de-teste.md).

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # regras dos portões
npm run build
```

Os dados ficam no `localStorage` do navegador (chave `3s-mvp-v1`). Cada pessoa tem a própria cópia, e o botão "Restaurar exemplo" volta aos dados iniciais. Todos os dados são fictícios.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/dominio/` | Etapas, portões, regras de avanço, checklist e operações. Código puro, sem dependência de framework |
| `src/dados/EstadoProvider.tsx` | Guarda o estado no navegador e aplica as operações do domínio. Na versão com Supabase, só este arquivo muda |
| `src/app/` | Páginas (`/comercial`, `/projetos`, `/formularios/[dealId]`) |
| `src/componentes/` | Kanban, ficha do registro e formulário do cliente |

## Como as regras são aplicadas

1. A tela chama `executar(operacao)` com uma operação de `src/dominio/operacoes.ts` (mover, atualizar campo, gerar formulário...).
2. A operação verifica as regras e devolve um novo estado. Só esse estado é gravado.
3. Se faltar algo, a operação devolve a lista de pendências e a tela mostra o bloqueio.

Na versão de teste, as regras rodam no navegador. Quando houver banco compartilhado, as mesmas operações passam a rodar no servidor, para que ninguém consiga pular um portão.

A tela usa as mesmas funções (`pendencias`, `avaliarEtapa`) para mostrar o que falta antes de o usuário tentar avançar.

## Diferenças em relação ao protótipo

- O portão P2 também exige o **contrato de setup assinado**, como em `docs/02-fluxo.md` (o protótipo só checava o pagamento).
- O formulário salva cada mudança na hora. Os arquivos guardam só o nome por enquanto; o envio real vai para o Storage do Supabase.
- A agenda de instalações ainda não foi portada.

## Pendências conhecidas

- `docs/05-modelo-de-dados.md` diz que o P2 exige os itens do checklist **validados**. O MVP ainda considera "preenchido". O esquema já tem `status` (pendente, recebido, validado) em `item_checklist`.
- No banco, "contrato assinado" e "setup pago" vêm das tabelas `contrato` e `cobranca` (visão `vw_deal_situacao`). No domínio do MVP ainda são campos do deal.
