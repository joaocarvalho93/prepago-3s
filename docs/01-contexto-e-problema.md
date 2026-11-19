# 01 · Contexto e problema

## Cenário atual

A 3S Checkout é uma plataforma de gestão para operações de food service, voltada principalmente a redes e grandes contas, e faz parte do grupo iFood.

O processo de entrada de um novo cliente segue hoje esta ordem:

1. O comercial negocia e o cliente assina o contrato.
2. Depois da assinatura, a 3S pede as informações necessárias para o setup.
3. O setup e a implantação só começam quando essas informações chegam.

## O gargalo

| Sintoma | Causa |
|---|---|
| Ciclo longo entre assinatura e ativação | Informações do cliente chegam tarde e incompletas |
| Baixa previsibilidade da agenda de projetos | Não há data de início confiável para o setup |
| Retrabalho no setup | Informações enviadas aos poucos ou com erro |
| Status das contas pouco claro | Não há marcos formais entre a venda e o go-live |
| Cobrança descentralizada | Faturamento espalhado em vários dias do mês |

Depois que o contrato está assinado, o cliente não tem incentivo para priorizar o envio das informações. Todo o risco do atraso fica com a 3S.

## Objetivos do teste

- **Principal:** reduzir o tempo médio de implantação, medido da assinatura do contrato de setup até a ativação.
- Aumentar a previsibilidade do pipeline com status claros por conta.
- Reduzir o retrabalho no setup.
- Organizar o fluxo de faturamento.
- Validar o modelo antes de expandir para toda a base.

## Escopo do teste

**Dentro do escopo**
- Novas contas que se encaixam no ICP definido para o piloto (ver [Decisões](09-decisoes.md)).
- Fluxo completo, da negociação ao acompanhamento depois do go-live.

**Fora do escopo, por enquanto**
- Migração de contas que já estão na base.
- Redes com operação muito complexa ou condições contratuais especiais (avaliar numa fase 2).
- Automação por sistema. O teste roda com o processo manual (ver [Roadmap](08-roadmap.md)).
