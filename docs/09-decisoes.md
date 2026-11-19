# 09 · Decisões

Registro das decisões do projeto (no estilo de ADR, Architecture Decision Records) e das questões ainda em aberto.

## Decisões tomadas

### D-001 · Informações coletadas antes do setup
- **Contexto:** o setup trava por falta de informações do cliente depois da assinatura.
- **Decisão:** o time de pré-vendas coleta as informações enquanto a negociação avança, e o setup só começa com o checklist completo.
- **Consequência:** o prazo de setup passa a contar a partir do recebimento completo das informações.

### D-002 · Setup pago antes, instalação parcelável
- **Contexto:** a cobrança antecipada gera objeção, mas é ela que garante o compromisso do cliente.
- **Decisão:** o setup é pago antes de começar. A instalação, etapa anterior à ativação, pode ser parcelada nas primeiras mensalidades.
- **Consequência:** o valor de entrada fica menor sem abrir mão do compromisso antes do setup.

### D-003 · Três portões de decisão
- **Contexto:** falta visibilidade do status das contas entre a venda e o go-live.
- **Decisão:** criar os portões P1 (Go comercial), P2 (Liberação do setup) e P3 (Go-live), com critérios objetivos.
- **Consequência:** os portões são o status oficial de cada conta e a base dos pipelines.

### D-004 · Contrapartidas como pacote
- **Contexto:** o comercial precisa de argumentos para vender o pagamento antecipado.
- **Decisão:** oferecer agendamento garantido, suporte dedicado e processo presencial como contrapartidas.
- **Consequência:** as entregas e os limites de cada benefício precisam estar no contrato de setup.

## Em aberto

| # | Questão | Com quem | Status |
|---|---|---|---|
| Q-01 | Critérios do ICP do teste | Comercial, Pré-vendas | A definir |
| Q-02 | Viabilidade jurídica do contrato de setup e das cláusulas de atraso | Jurídico | A definir |
| Q-03 | Fluxo de faturamento: meio de pagamento, vencimento e data de corte | Financeiro | A definir |
| Q-04 | Riscos e oportunidades do caminho do piloto | Liderança, Jurídico | A definir |
| Q-05 | Métricas e critério de sucesso do teste | Liderança | A definir |
| Q-06 | Checklist padrão e consequências do atraso do cliente | Pré-vendas, Jurídico | A definir |
| Q-07 | Regras do piloto: elegibilidade, duração e conversão | Comercial, Financeiro | A definir |
| Q-08 | Momento do comissionamento | Comercial, Financeiro | A definir |
| Q-09 | Entregas e limites das contrapartidas | Comercial, Projetos | A definir |
| Q-10 | Tabela de setup por complexidade e regra de desconto | Comercial, Financeiro | A definir |
| Q-11 | Número máximo de parcelas da instalação e cláusula de cancelamento | Financeiro, Jurídico | A definir |
| Q-12 | Plano de marca com marketing e iFood | Liderança, Marketing | A definir |
