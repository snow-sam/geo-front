export interface RoteiroCliente {
  clienteId: string;
  clienteNome: string;
  clienteEndereco: string;
  ordem: number;
}

export interface Roteiro {
  id: string;
  tecnicoId: string;
  tecnicoNome: string;
  data: string; // ISO 8601 date string
  clientes: RoteiroCliente[];
  distanciaTotal?: number; // em km
  tempoEstimado?: number; // em minutos
  createdAt?: string;
  updatedAt?: string;
}

export interface RoteiroFilters {
  tecnicoId: string | null;
  clienteNome: string | null;
  dataInicio: string | null;
  dataFim: string | null;
}

