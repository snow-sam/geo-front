import * as z from "zod";

// Schema Zod para validação do formulário de solicitação
export const solicitacaoSchema = z.object({
  // 1. Dados do Solicitante
  nomeEmpresa: z.string().min(2, { message: "Nome da empresa deve ter no mínimo 2 caracteres" }),
  nomeFuncao: z.string().min(2, { message: "Nome e função devem ter no mínimo 2 caracteres" }),
  telefoneContato: z.string().min(10, { message: "Telefone deve ter no mínimo 10 caracteres" }),

  // 2. Local do Atendimento
  enderecoCompleto: z.string().min(10, { message: "Endereço deve ter no mínimo 10 caracteres" }),
  precisaAutorizacao: z.boolean(),
  procedimentoAutorizacao: z.string().optional(),

  // 3. Sobre o Equipamento
  equipamentoModelo: z.string().min(2, { message: "Modelo do equipamento deve ter no mínimo 2 caracteres" }),
  descricaoProblema: z.string().min(10, { message: "Descrição do problema deve ter no mínimo 10 caracteres" }),

  // 4. Evidências (Base64) - temporariamente opcional
  fotoEquipamento: z.string().optional(),
  fotoVideoProblema: z.string().optional(),

  // 5. Informações Finais
  responsavelNome: z.string().optional(),
  responsavelTelefone: z.string().optional(),
  horarioDisponivel: z.string().min(2, { message: "Horário disponível deve ter no mínimo 2 caracteres" }),
}).refine((data) => {
  // Se precisa autorização, o procedimento é obrigatório
  if (data.precisaAutorizacao && (!data.procedimentoAutorizacao || data.procedimentoAutorizacao.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Procedimento de autorização é obrigatório quando autorização é necessária",
  path: ["procedimentoAutorizacao"],
});

// Tipo inferido do schema
export type SolicitacaoFormValues = z.infer<typeof solicitacaoSchema>;

// Interface para a solicitação salva no banco
export interface Solicitacao {
  id: string;
  
  // Dados do Solicitante
  nomeEmpresa: string;
  nomeFuncao: string;
  telefoneContato: string;

  // Local do Atendimento
  enderecoCompleto: string;
  precisaAutorizacao: boolean;
  procedimentoAutorizacao?: string;

  // Sobre o Equipamento
  equipamentoModelo: string;
  descricaoProblema: string;

  // Evidências
  fotoEquipamento: string;
  fotoVideoProblema: string;

  // Informações Finais
  responsavelNome?: string;
  responsavelTelefone?: string;
  horarioDisponivel: string;

  // Metadados
  status: "pendente" | "em_analise" | "aprovado" | "recusado";
  createdAt: string;
  updatedAt?: string;
}


