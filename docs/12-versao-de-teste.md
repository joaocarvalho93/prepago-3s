# 12 · Versão de teste

Versão publicada do app para testar funcionalidades e UX/UI com os times, antes de ligar o banco de dados.

## Como funciona

- Os dados são **fictícios** e ficam **no navegador de cada pessoa**. Um testador não vê as mudanças do outro.
- As mudanças continuam lá ao recarregar a página ou voltar outro dia, no mesmo navegador.
- **Restaurar exemplo**, na barra lateral, apaga as mudanças e volta aos dados iniciais.
- Em outro navegador, em outro computador ou numa janela anônima, a pessoa começa do zero.
- O site pede aos buscadores que não o indexem, mas qualquer pessoa com o link consegue abrir. Não coloque dados reais.

## Publicar na Vercel (uma vez)

1. Crie uma conta gratuita em [vercel.com](https://vercel.com), entrando com o GitHub.
2. Clique em **Add New… → Project** e escolha o repositório `prepago-3s`. Se ele não aparecer, clique em **Adjust GitHub App Permissions** e libere o acesso.
3. Em **Root Directory**, clique em **Edit** e escolha a pasta **`app`**. Esse é o único ajuste necessário: o resto (Next.js, comando de build) a Vercel detecta sozinha.
4. Clique em **Deploy**. Em cerca de um minuto sai um link como `prepago-3s.vercel.app`.

## Depois de publicado

| O que acontece | Resultado |
|---|---|
| Um commit entra no `main` | A Vercel atualiza o link principal automaticamente |
| Um commit entra em outro branch ou num pull request | A Vercel gera um **link de preview** só para aquela versão, sem mexer no link principal |

Assim dá para testar uma mudança num link de preview antes de levá-la para o link que os times usam.

## Roteiro sugerido para os testadores

1. No **Pipeline comercial**, arraste o deal *Brasa Nobre Grill* para *Contrato de setup*. O portão P1 bloqueia e mostra o que falta.
2. Abra o registro, marque *Proposta aceita* e escolha o *Caminho*. Avance: o projeto é criado no **Pipeline de projetos**.
3. No **Pipeline de projetos**, tente levar *Burger Lab* para *Pronto para setup*. O portão P2 bloqueia.
4. Em **Formulários do cliente**, complete o formulário do *Burger Lab*, marque o setup como pago no deal e tente de novo.
5. Anote o que ficou confuso, o que faltou e o que sobrou.

## Limites desta versão

- Não há login nem dados compartilhados entre as pessoas.
- A agenda de instalações ainda não foi portada do protótipo.
- Os arquivos do formulário guardam só o nome; nada é enviado.
