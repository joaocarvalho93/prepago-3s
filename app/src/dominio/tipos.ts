// Tipos do domínio. Espelham docs/05-modelo-de-dados.md e o esquema em supabase/migrations.

export type EtapaDeal = "qual" | "ader" | "prop" | "neg" | "cont" | "pago" | "perd";
export type EtapaProjeto = "col" | "pron" | "set" | "hom" | "ins" | "gol" | "aco" | "conc";
export type Portao = "P1" | "P2" | "P3";

export type Complexidade = "Simples" | "Média" | "Complexa";
export type Porte = "Até 5 lojas" | "6 a 20 lojas" | "Mais de 20 lojas";
export type Caminho = "Mensalidade" | "Piloto";
export type Aderencia = "Pendente" | "Aprovada" | "Reprovada";

export interface Atividade {
  em: string; // ISO 8601
  texto: string;
}

export interface Deal {
  id: string;
  conta: string;
  segmento: string;
  lojas: number;
  dono: string;
  etapa: EtapaDeal;
  contato: string;
  aderencia: Aderencia;
  complexidade: Complexidade | "";
  valorSetup: number;
  valorInstalacao: number;
  mensalidade: number;
  propostaAceita: boolean;
  porte: Porte | "";
  caminho: Caminho | "";
  contratoSetupAssinado: boolean;
  setupPago: boolean;
  motivoPerda: string;
  projetoId: string | null;
  atividades: Atividade[];
}

export interface Projeto {
  id: string;
  dealId: string;
  etapa: EtapaProjeto;
  dataSetup: string; // AAAA-MM-DD
  setupConcluido: boolean;
  homologacaoAprovada: boolean;
  instalacao: string; // descrição do agendamento; vazio se não agendada
  licencaAssinada: boolean;
  primeiraMensalidadePaga: boolean;
  pilotoAprovado: boolean;
  ativado: boolean;
  passagemCs: boolean;
  atividades: Atividade[];
}

/** Respostas do formulário de onboarding: item do checklist → campo → valor. */
export type RespostasFormulario = Record<string, Record<string, string | string[]>>;

export interface Estado {
  deals: Deal[];
  projetos: Projeto[];
  formularios: Record<string, RespostasFormulario>; // chave: dealId
}
