export type StatusChamado = "aberto" | "em_andamento" | "fechado";

export interface Chamado {
  id: string;
  local: string;
  tipo: string;
  descricao: string;
  dataAbertura: string; // ISO 8601 date string
  status: StatusChamado;
  clienteId?: string;
  clienteNome?: string;
  tecnicoId?: string;
  tecnicoNome?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChamadoFilters {
  status: StatusChamado | "todos";
  dataInicio: string | null;
  dataFim: string | null;
}

export interface ChamadoStats {
  abertos: number;
  emAndamento: number;
  fechados: number;
}

