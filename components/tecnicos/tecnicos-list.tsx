"use client";

import { useState, useMemo } from "react";
import { Search, Plus, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TecnicoCard } from "@/components/tecnicos/tecnico-card";
import { TecnicoForm } from "@/components/tecnicos/tecnico-form";
import { TecnicoImport } from "@/components/tecnicos/tecnico-import";
import type { Tecnico } from "@/types/tecnico";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createTecnico,
  updateTecnico,
  deleteTecnico,
  type CreateTecnicoData,
  type UpdateTecnicoData,
} from "@/lib/api";

const ITEMS_PER_PAGE = 6;

interface TecnicosListProps {
  initialTecnicos: Tecnico[];
}

export function TecnicosList({ initialTecnicos }: TecnicosListProps) {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>(initialTecnicos);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedTecnico, setSelectedTecnico] = useState<Tecnico | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredTecnicos = useMemo(() => {
    return tecnicos.filter((tecnico) => {
      // Filtro de busca por texto
      const matchesSearch =
        searchTerm === "" ||
        tecnico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.telefone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.especialidade?.toLowerCase().includes(searchTerm.toLowerCase());

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

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteTecnico(id);
      setTecnicos((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Erro ao deletar técnico:", error);
      alert("Erro ao deletar técnico. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const tecnico = tecnicos.find((t) => t.id === id);
    if (tecnico) {
      setSelectedTecnico(tecnico);
      setIsEditDialogOpen(true);
    }
  };

  const handleCreate = async (values: CreateTecnicoData) => {
    try {
      setIsLoading(true);
      console.log(values);
      const newTecnico = await createTecnico(values);
      setTecnicos((prev) => [newTecnico, ...prev]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Erro ao criar técnico:", error);
      alert("Erro ao criar técnico. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (values: UpdateTecnicoData) => {
    if (!selectedTecnico) return;

    try {
      setIsLoading(true);
      const updatedTecnico = await updateTecnico(selectedTecnico.id, values);
      setTecnicos((prev) =>
        prev.map((t) => (t.id === selectedTecnico.id ? updatedTecnico : t))
      );
      setIsEditDialogOpen(false);
      setSelectedTecnico(null);
    } catch (error) {
      console.error("Erro ao atualizar técnico:", error);
      alert("Erro ao atualizar técnico. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSuccess = (importedTecnicos: Tecnico[]) => {
    setTecnicos((prev) => [...importedTecnicos, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar técnicos por nome, endereço, telefone, email, placa ou especialidade..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsImportDialogOpen(true)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Importar Excel
        </Button>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
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

      {/* Modal de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Técnico</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo técnico. Campos marcados com * são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <TecnicoForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Técnico</DialogTitle>
            <DialogDescription>
              Atualize os dados do técnico. Campos marcados com * são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>
          {selectedTecnico && (
            <TecnicoForm
              tecnico={selectedTecnico}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedTecnico(null);
              }}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Importação */}
      <TecnicoImport
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

