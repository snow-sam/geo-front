"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TecnicoCard } from "@/components/tecnicos/tecnico-card";
import type { Tecnico } from "@/types/tecnico";

const ITEMS_PER_PAGE = 6;

interface TecnicosListProps {
  initialTecnicos: Tecnico[];
}

export function TecnicosList({ initialTecnicos }: TecnicosListProps) {
  const [tecnicos] = useState<Tecnico[]>(initialTecnicos);
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
    // TODO: Implementar integração com API para delete
    console.log("Deletar técnico:", id);
  };

  const handleEdit = (id: string) => {
    // TODO: Implementar integração com API para edição
    console.log("Editar técnico:", id);
  };

  const handleNewTecnico = () => {
    // TODO: Implementar integração com API para criação
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

