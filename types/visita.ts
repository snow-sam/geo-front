export type StatusVisita = "pendente" | "no_roteiro" | "realizada";

export interface Visita {
  id: string;
  clienteId: string;
  clienteNome: string;
  tecnicoId: string;
  tecnicoNome: string;
  dataMarcada: string; // ISO 8601 date string
  status: StatusVisita;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
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

