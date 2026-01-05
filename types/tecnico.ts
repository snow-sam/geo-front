export interface Tecnico {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  placa?: string;
  especialidade?: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Campo para vinculação com usuário (será preenchido pelo backend)
  userId?: string;
}

