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
1. Escolher a stack do MVP (sugestão a avaliar: Next.js + Supabase ou similar).
2. Transformar o modelo de `docs/05-modelo-de-dados.md` em esquema de banco.
3. Portar o protótipo para componentes, mantendo as regras dos portões.
4. Integrar com a API do Google Calendar (consulta de horários livres e criação de eventos) para a agenda de instalações.
5. Portal do cliente com link único para o formulário e o agendamento.

## Convenções
- Idioma: português do Brasil em interface, documentação e commits.
- Dados de clientes e valores no protótipo são fictícios. Não incluir dados reais da empresa em repositório público.
