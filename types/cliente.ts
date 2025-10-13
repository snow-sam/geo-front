export interface Cliente {
  id: string;
  nome: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  telefone?: string;
  email?: string;
  descricao?: string;
  ultimaVisita?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClienteFilters {
  search: string;
  hasEmail: boolean | null;
  hasTelefone: boolean | null;
  hasUltimaVisita: boolean | null;
}

