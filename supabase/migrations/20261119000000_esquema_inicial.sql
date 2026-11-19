-- Esquema inicial do MVP · baseado em docs/05-modelo-de-dados.md
-- Compatível com Postgres 15+ (Supabase).

create extension if not exists pgcrypto;

-- Tipos -----------------------------------------------------------------------

create type area_usuario       as enum ('comercial', 'pre_vendas', 'juridico', 'financeiro', 'projetos', 'cs');
create type etapa_deal         as enum ('qualificado', 'aderencia', 'proposta', 'negociacao', 'contrato_setup', 'setup_pago', 'perdido');
create type etapa_projeto      as enum ('coleta', 'pronto_setup', 'setup', 'homologacao', 'instalacao', 'go_live', 'acompanhamento', 'concluido');
create type status_projeto     as enum ('no_prazo', 'em_risco', 'bloqueado');
create type parecer_aderencia  as enum ('pendente', 'aprovada', 'reprovada');
create type complexidade_setup as enum ('simples', 'media', 'complexa');
create type porte_conta        as enum ('ate_5', 'de_6_a_20', 'mais_de_20');
create type caminho_deal       as enum ('mensalidade', 'piloto');
create type portao             as enum ('P1', 'P2', 'P3');
create type tipo_contrato      as enum ('setup', 'licenca', 'piloto');
create type status_contrato    as enum ('rascunho', 'enviado', 'assinado', 'cancelado');
create type tipo_cobranca      as enum ('setup', 'parcela_instalacao', 'mensalidade');
create type status_item        as enum ('pendente', 'recebido', 'validado');
create type status_tarefa      as enum ('aberta', 'em_andamento', 'concluida');

-- Pessoas e contas ------------------------------------------------------------

create table usuario (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  email      text not null unique,
  area       area_usuario not null,
  criado_em  timestamptz not null default now()
);

create table conta (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  cnpj       text unique,
  segmento   text,
  porte      porte_conta,
  n_lojas    integer check (n_lojas >= 0),
  criado_em  timestamptz not null default now()
);

create table contato (
  id        uuid primary key default gen_random_uuid(),
  conta_id  uuid not null references conta (id) on delete cascade,
  nome      text not null,
  papel     text,               -- decisor, ponto focal, TI
  email     text,
  telefone  text
);

-- Pipeline comercial ----------------------------------------------------------

create table deal (
  id                  uuid primary key default gen_random_uuid(),
  conta_id            uuid not null references conta (id),
  dono_id             uuid references usuario (id),
  contato_principal_id uuid references contato (id),
  etapa               etapa_deal not null default 'qualificado',
  parecer_aderencia   parecer_aderencia not null default 'pendente',
  complexidade        complexidade_setup,
  valor_setup         numeric(12, 2) not null default 0 check (valor_setup >= 0),
  valor_instalacao    numeric(12, 2) not null default 0 check (valor_instalacao >= 0),
  parcelas_instalacao smallint not null default 1 check (parcelas_instalacao between 1 and 12),
  mensalidade         numeric(12, 2) not null default 0 check (mensalidade >= 0),
  proposta_aceita     boolean not null default false,
  caminho             caminho_deal,
  motivo_perda        text,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  constraint perdido_exige_motivo check (etapa <> 'perdido' or motivo_perda is not null)
);

create table contrato (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references deal (id) on delete cascade,
  tipo          tipo_contrato not null,
  status        status_contrato not null default 'rascunho',
  assinado_em   timestamptz,
  constraint assinado_tem_data check (status <> 'assinado' or assinado_em is not null)
);
create unique index contrato_unico_ativo on contrato (deal_id, tipo) where status <> 'cancelado';

create table cobranca (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references deal (id) on delete cascade,
  tipo          tipo_cobranca not null,
  parcela       smallint,      -- nº da parcela da instalação ou da mensalidade
  valor         numeric(12, 2) not null check (valor >= 0),
  vencimento    date not null,
  pago_em       date
);

-- Pipeline de projetos --------------------------------------------------------

create table projeto (
  id                     uuid primary key default gen_random_uuid(),
  deal_id                uuid not null unique references deal (id),   -- um deal gera no máximo um projeto
  etapa                  etapa_projeto not null default 'coleta',
  status                 status_projeto not null default 'no_prazo',
  data_reservada         date,
  data_setup             date,
  setup_concluido_em     timestamptz,
  homologacao_aprovada_em timestamptz,
  primeira_mensalidade_paga boolean not null default false,
  piloto_aprovado        boolean not null default false,
  ativado_em             timestamptz,
  passagem_cs_em         timestamptz,
  data_go_live           date,
  criado_em              timestamptz not null default now()
);

create table loja (
  id           uuid primary key default gen_random_uuid(),
  projeto_id   uuid not null references projeto (id) on delete cascade,
  nome         text not null,
  endereco     text,
  etapa        etapa_projeto not null default 'coleta',
  ativada_em   date
);

-- Formulário de onboarding: gerado a partir do deal (etapa Proposta), antes de o projeto existir.
create table formulario (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null unique references deal (id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),  -- link único do portal do cliente
  criado_em   timestamptz not null default now()
);

create table item_checklist (
  id             uuid primary key default gen_random_uuid(),
  formulario_id  uuid not null references formulario (id) on delete cascade,
  loja_id        uuid references loja (id) on delete cascade,   -- nulo = vale para a conta toda
  chave          text not null,           -- cardapio, cert, fiscal, integ, acessos, equip, loja, resp
  obrigatorio    boolean not null default true,
  status         status_item not null default 'pendente',
  dados          jsonb not null default '{}'::jsonb,
  prazo          date,
  recebido_em    timestamptz,
  validado_em    timestamptz
);
create unique index item_checklist_unico on item_checklist (formulario_id, chave, coalesce(loja_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table agendamento_instalacao (
  id             uuid primary key default gen_random_uuid(),
  projeto_id     uuid not null references projeto (id) on delete cascade,
  loja_id        uuid references loja (id),
  responsavel_id uuid references usuario (id),
  inicio         timestamptz not null,
  fim            timestamptz not null check (fim > inicio),
  google_event_id text,
  criado_em      timestamptz not null default now()
);

create table verificacao_portao (
  id           uuid primary key default gen_random_uuid(),
  projeto_id   uuid references projeto (id) on delete cascade,
  deal_id      uuid references deal (id) on delete cascade,
  portao       portao not null,
  aprovado     boolean not null,
  pendencias   text[] not null default '{}',
  verificado_por uuid references usuario (id),
  verificado_em timestamptz not null default now(),
  constraint portao_tem_alvo check (deal_id is not null or projeto_id is not null)
);

create table tarefa (
  id             uuid primary key default gen_random_uuid(),
  projeto_id     uuid not null references projeto (id) on delete cascade,
  area           area_usuario not null,
  responsavel_id uuid references usuario (id),
  titulo         text not null,
  prazo          date,
  status         status_tarefa not null default 'aberta'
);

create table atividade (
  id          bigint generated always as identity primary key,
  deal_id     uuid references deal (id) on delete cascade,
  projeto_id  uuid references projeto (id) on delete cascade,
  autor_id    uuid references usuario (id),
  tipo        text not null,     -- movimentacao, campo, portao, formulario, agendamento...
  descricao   text not null,
  criado_em   timestamptz not null default now(),
  constraint atividade_tem_alvo check (deal_id is not null or projeto_id is not null)
);
create index atividade_deal on atividade (deal_id, criado_em desc);
create index atividade_projeto on atividade (projeto_id, criado_em desc);

-- Visões usadas pelas regras dos portões -------------------------------------

-- Situação derivada do deal: contratos e cobranças viram os marcos usados nos portões P2 e P3.
create view vw_deal_situacao as
select
  d.id as deal_id,
  exists (select 1 from contrato c where c.deal_id = d.id and c.tipo = 'setup'   and c.status = 'assinado') as contrato_setup_assinado,
  exists (select 1 from contrato c where c.deal_id = d.id and c.tipo = 'licenca' and c.status = 'assinado') as contrato_licenca_assinado,
  exists (select 1 from cobranca b where b.deal_id = d.id and b.tipo = 'setup'   and b.pago_em is not null) as setup_pago
from deal d;

-- Progresso do checklist. Regra do P2: todos os itens obrigatórios validados.
create view vw_formulario_progresso as
select
  f.deal_id,
  count(*) filter (where i.obrigatorio)                              as itens_obrigatorios,
  count(*) filter (where i.obrigatorio and i.status <> 'pendente')   as itens_recebidos,
  count(*) filter (where i.obrigatorio and i.status = 'validado')    as itens_validados
from formulario f
left join item_checklist i on i.formulario_id = f.id
group by f.deal_id;

-- Atualiza deal.atualizado_em
create function tocar_atualizado_em() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;
create trigger deal_atualizado_em before update on deal for each row execute function tocar_atualizado_em();
