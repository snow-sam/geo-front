export interface Cliente {
  id: string;
  nome: string;
  endereco: string;
  telefone?: string;
  email?: string;
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

