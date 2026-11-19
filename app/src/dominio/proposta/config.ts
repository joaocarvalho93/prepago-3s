// Configuração do gerador de proposta. VALORES FICTÍCIOS.
// As regras comerciais que vão mudar com o plano pré-pago ficam aqui, num lugar só.

export interface ConfigProposta {
  setupPadrao: number; // R$, taxa única
  instalacaoPorLoja: number; // R$ por loja
  contratoMeses: number;
  rolloutMeses: number;
  /**
   * Regra atual da ferramenta comercial: isenta setup e instalação com alta aderência e 10+ lojas.
   * No plano pré-pago (D-002) o setup é pago antes de começar: desligar esta regra.
   */
  isencaoAltaAderencia: boolean;
  lojasMinimasIsencao: number;
  /** Abaixo desta fração dos 100 itens encontrados, o diagnóstico é considerado incompleto. */
  coberturaMinimaDiagnostico: number;
}

export const CONFIG_PROPOSTA: ConfigProposta = {
  setupPadrao: 2800,
  instalacaoPorLoja: 1500,
  contratoMeses: 36,
  rolloutMeses: 6,
  isencaoAltaAderencia: true,
  lojasMinimasIsencao: 10,
  coberturaMinimaDiagnostico: 0.3,
};
