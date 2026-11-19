// Camada de dados. Hoje: memória do servidor com os dados de exemplo.
// Próximo passo: implementação Postgres/Supabase sobre o esquema em supabase/migrations.
import { estadoDeExemplo } from "@/dominio/exemplo";
import type { Estado } from "@/dominio/tipos";

export interface Repositorio {
  carregar(): Promise<Estado>;
  salvar(estado: Estado): Promise<void>;
  restaurarExemplo(): Promise<void>;
}

// Guardado em globalThis para sobreviver ao recarregamento de módulos no `next dev`.
const g = globalThis as unknown as { __estado3s?: Estado };

class RepositorioMemoria implements Repositorio {
  async carregar() {
    g.__estado3s ??= estadoDeExemplo();
    return structuredClone(g.__estado3s);
  }
  async salvar(estado: Estado) {
    g.__estado3s = structuredClone(estado);
  }
  async restaurarExemplo() {
    g.__estado3s = estadoDeExemplo();
  }
}

export const repositorio: Repositorio = new RepositorioMemoria();
