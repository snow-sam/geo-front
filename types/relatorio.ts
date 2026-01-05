import type { Cliente } from "./cliente";
import type { Tecnico } from "./tecnico";
import type { Visita } from "./visita";

export interface RelatorioVisita {
  id: string;
  workspaceId: string;
  visitaId: string;
  clienteNome: string;
  endereco: string;
  data: string;
  horarioInicio: string;
  horarioFim?: string | null;
  descricaoGeral: string;
  avaliacao: number;
  observacoesAvaliacao?: string | null;
  assinaturaCliente: string;
  criadoEm: string;
  atualizadoEm: string;
  // Relacionamentos
  visita?: Visita;
}

export interface RelatorioFilters {
  dataInicio: string | null;
  dataFim: string | null;
  clienteNome: string | null;
  avaliacao: number | null;
}

export interface RelatorioStats {
  total: number;
  avaliacaoMedia: number;
  porAvaliacao: {
    [key: number]: number;
  };
}

