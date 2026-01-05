import { Cliente } from "./cliente";
import { Tecnico } from "./tecnico";
import type { Roteiro } from "./roteiro";

export type StatusVisita = "pendente" | "no_roteiro" | "realizado";
export type TipoVisita = "CALL" | "PREVENTIVE";

export interface Visita {
  id: string;
  workspaceId: string;
  clienteId: string;
  tecnicoId: string;
  roteiroId?: string | null;
  dataAgendamento: string; // ISO 8601 date string
  status: StatusVisita;
  tipo?: TipoVisita | null;
  ordem?: number | null;
  estimativaChegada?: string | null; // ISO 8601 date string
  realizadoEm?: string | null; // ISO 8601 date string
  distanciaProximoKM?: number | null;
  distanciaProximoMinutos?: number | null;
  notas?: string | null;
  observacoes?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  deletadoEm?: string | null;
  // Campos legados para compatibilidade
  createdAt?: string;
  updatedAt?: string;
  // Relacionamentos
  cliente?: Cliente;
  tecnico?: Tecnico;
  roteiro?: Roteiro | null;
}

export interface VisitaFilters {
  status: StatusVisita | "todos";
  dataInicio: string | null;
  dataFim: string | null;
}

export interface VisitaStats {
  realizadas: number;
  pendentes: number;
  noRoteiro: number;
}
