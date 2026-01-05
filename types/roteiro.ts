import type { Tecnico } from "./tecnico";
import type { Visita } from "./visita";

export interface RoteiroTecnico {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
}

export interface Roteiro {
  id: string;
  workspaceId: string;
  tecnicoId: string;
  tecnicoNome?: string;
  data: string; // ISO 8601 date string
  status: string;
  distanciaTotal?: number | null; // em km
  tempoEstimado?: number | null; // em minutos
  criadoEm?: string;
  atualizadoEm?: string;
  deletadoEm?: string | null;
  // Campos legados para compatibilidade
  createdAt?: string;
  updatedAt?: string;
  // Relacionamentos
  tecnico?: Tecnico | RoteiroTecnico;
  visitas: Visita[];
}

export interface RoteiroFilters {
  tecnicoId: string | null;
  clienteNome: string | null;
  dataInicio: string | null;
  dataFim: string | null;
}

// Tipo para resposta do endpoint POST /agenda/roteiro-dia
export interface ResultadoRoteiroDia {
  data: string;
  roteiros: Roteiro[];
  sucessoTotal: boolean;
  roteirosCriados?: number;
  visitasVinculadas?: number;
}
