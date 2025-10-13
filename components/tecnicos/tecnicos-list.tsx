"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TecnicoCard } from "@/components/tecnicos/tecnico-card";
import type { Tecnico } from "@/types/tecnico";

// Dados mock - remover quando integrar com API real
const mockTecnicos: Tecnico[] = [
  {
    id: "1",
    nome: "Carlos Alberto Silva",
    endereco: "Rua dos Técnicos, 100, São Paulo - SP",
    placa: "ABC-1234",
    telefone: "(11) 98765-4321",
  },
  {
    id: "2",
    nome: "Roberto Fernandes",
    endereco: "Av. Industrial, 500, São Paulo - SP",
    placa: "DEF-5678",
    telefone: "(11) 97654-3210",
  },
  {
    id: "3",
    nome: "Paulo Henrique Costa",
    endereco: "Rua das Máquinas, 250, São Paulo - SP",
    placa: "GHI-9012",
  },
  {
    id: "4",
    nome: "José Augusto Pereira",
    endereco: "Av. dos Engenheiros, 750, São Paulo - SP",
    placa: "JKL-3456",
    telefone: "(11) 96543-2109",
  },
  {
    id: "5",
    nome: "Marcos Vinicius Santos",
    endereco: "Rua da Manutenção, 320, São Paulo - SP",
    placa: "MNO-7890",
    telefone: "(11) 95432-1098",
  },
  {
    id: "6",
    nome: "Fernando Almeida",
    endereco: "Av. Tecnológica, 180, São Paulo - SP",
    placa: "PQR-1234",
  },
  {
    id: "7",
    nome: "André Luiz Moreira",
    endereco: "Rua dos Mecânicos, 420, São Paulo - SP",
    placa: "STU-5678",
    telefone: "(11) 94321-0987",
  },
  {
    id: "8",
    nome: "Ricardo Oliveira",
    endereco: "Av. da Indústria, 900, São Paulo - SP",
    placa: "VWX-9012",
  },
  {
    id: "9",
    nome: "Thiago Martins",
    endereco: "Rua dos Operadores, 650, São Paulo - SP",
    placa: "YZA-3456",
    telefone: "(11) 93210-9876",
  },
  {
    id: "10",
    nome: "Leonardo Rodrigues",
    endereco: "Av. dos Profissionais, 1200, São Paulo - SP",
    placa: "BCD-7890",
    telefone: "(11) 92109-8765",
  },
];

const ITEMS_PER_PAGE = 6;

export function TecnicosList() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>(mockTecnicos);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTecnicos = useMemo(() => {
    return tecnicos.filter((tecnico) => {
      // Filtro de busca por texto
      const matchesSearch =
        searchTerm === "" ||
        tecnico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.telefone?.includes(searchTerm);

      return matchesSearch;
    });
  }, [tecnicos, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredTecnicos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTecnicos = filteredTecnicos.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    setTecnicos((prev) => prev.filter((tecnico) => tecnico.id !== id));
  };

  const handleEdit = (id: string) => {
    // TODO: Implementar edição de técnico
    console.log("Editar técnico:", id);
  };

  const handleNewTecnico = () => {
    // TODO: Implementar criação de técnico
    console.log("Novo técnico");
  };

  return (
    <div className="space-y-6">
      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar técnicos por nome, endereço, placa ou telefone..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleNewTecnico}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Técnico
        </Button>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {currentTecnicos.length} de {filteredTecnicos.length}{" "}
        técnico(s)
        {filteredTecnicos.length !== tecnicos.length && " (filtrados)"}
      </div>

      {/* Lista de técnicos */}
      {currentTecnicos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhum técnico encontrado
          </p>
          {searchTerm ? (
            <Button
              variant="link"
              onClick={() => setSearchTerm("")}
              className="mt-2"
            >
              Limpar busca
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTecnicos.map((tecnico) => (
            <TecnicoCard
              key={tecnico.id}
              tecnico={tecnico}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}

