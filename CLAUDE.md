# Contexto do projeto para o Claude Code

## O que é
Projeto do João (Coordenação de Novos Negócios) para o 3S Checkout, sistema de gestão para redes de food service do grupo iFood. O objetivo é reduzir o tempo de implantação de lojas com um **plano pré-pago** e, depois, construir um app no estilo do HubSpot com **pipeline comercial** e **pipeline de projetos** conectados.

## Estado atual
- `docs/`: documentação do processo (fluxo, portões, política comercial, pipelines, modelo de dados, métricas, roadmap, decisões). **Ler antes de qualquer mudança.**
- `prototipo/index.html`: protótipo navegável em HTML e JavaScript puro, sem dependências, com dados fictícios salvos no localStorage. Contém:
  - kanban do pipeline comercial com regras de avanço por etapa (`RD` no script)
  - kanban do pipeline de projetos com os portões P2 e P3 (`RP`)
  - formulário de onboarding do cliente gerado a partir do deal (`FORM`)
  - agenda de instalações com visão interna e visão do cliente (Google Calendar simulado)

- `app/`: MVP em Next.js + TypeScript (decisão D-005). Ver `app/README.md`.
  - `src/dominio/`: regras dos portões e operações, em código puro e testado (`npm test`). É a fonte da verdade das regras: a tela e o servidor usam o mesmo código.
  - `src/dados/EstadoProvider.tsx`: versão de teste, com o estado salvo no navegador de cada pessoa (localStorage). Será trocado pela implementação Supabase, com as regras rodando no servidor.
  - Publicação da versão de teste na Vercel: `docs/12-versao-de-teste.md`.
  - Telas portadas: pipeline comercial, pipeline de projetos e formulário do cliente. A agenda de instalações ainda não foi portada.
- `supabase/migrations/`: esquema do banco a partir de `docs/05-modelo-de-dados.md`.

## Regras de negócio essenciais
- O **setup** é pago antes de começar. A **instalação** é uma etapa antes da ativação e pode ser parcelada nas primeiras mensalidades. A **licença** é a mensalidade recorrente.
- Portões:
  - **P1 · Go comercial:** aderência aprovada, proposta aceita, porte definido.
  - **P2 · Liberação do setup:** contrato de setup assinado, setup pago, checklist do cliente 100%.
  - **P3 · Go-live:** homologação aprovada, licença assinada, 1ª mensalidade paga ou piloto aprovado.
- O projeto é criado automaticamente quando o deal chega a "Contrato de setup".
- O formulário do cliente pode ser gerado a partir da etapa "Proposta".
- A instalação pode ser agendada para projetos nas etapas Setup, Homologação ou Instalação.

## Próximos passos (fase 2 do roadmap)
1. ~~Escolher a stack do MVP~~ (D-005: Next.js + Supabase).
2. ~~Transformar o modelo em esquema de banco~~ (`supabase/migrations`). Falta o repositório Postgres que lê e grava nesse esquema.
3. Portar o protótipo para componentes: pipelines e formulário feitos; falta a agenda de instalações.
4. Login com Supabase Auth e visões por área (comercial, pré-vendas, projetos, financeiro).
5. Integrar com a API do Google Calendar (consulta de horários livres e criação de eventos) para a agenda de instalações.
6. Portal do cliente com link único para o formulário e o agendamento.

## Convenções
- Idioma: português do Brasil em interface, documentação e commits.
- Dados de clientes e valores no protótipo são fictícios. Não incluir dados reais da empresa em repositório público.
