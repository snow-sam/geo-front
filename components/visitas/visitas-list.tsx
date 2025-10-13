"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VisitaCard } from "@/components/visitas/visita-card";
import { VisitasStats } from "@/components/visitas/visitas-stats";
import type { Visita, VisitaFilters, VisitaStats, StatusVisita } from "@/types/visita";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const ITEMS_PER_PAGE = 6;

// Função para obter a data atual no horário de Brasília (início do dia)
const getBrasiliaDateStart = () => {
  const now = new Date();
  const brasiliaDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  brasiliaDate.setHours(0, 0, 0, 0);
  return brasiliaDate.toISOString();
};

// Função para obter o fim do dia no horário de Brasília
const getBrasiliaDateEnd = () => {
  const now = new Date();
  const brasiliaDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  brasiliaDate.setHours(23, 59, 59, 999);
  return brasiliaDate.toISOString();
};

interface VisitasListProps {
  initialVisitas: Visita[];
  initialStats: VisitaStats;
}

export function VisitasList({ initialVisitas, initialStats }: VisitasListProps) {
  const [visitas] = useState<Visita[]>(initialVisitas);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<VisitaFilters>({
    status: "todos",
    dataInicio: getBrasiliaDateStart(),
    dataFim: getBrasiliaDateEnd(),
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredVisitas = useMemo(() => {
    return visitas.filter((visita) => {
      // Filtro de busca por texto
      const matchesSearch =
        searchTerm === "" ||
        visita.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visita.tecnicoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visita.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus =
        filters.status === "todos" || visita.status === filters.status;

      // Filtro de data
      let matchesDate = true;
      if (filters.dataInicio || filters.dataFim) {
        const visitaDate = new Date(visita.dataMarcada);
        if (filters.dataInicio) {
          const dataInicio = new Date(filters.dataInicio);
          matchesDate = matchesDate && visitaDate >= dataInicio;
        }
        if (filters.dataFim) {
          const dataFim = new Date(filters.dataFim);
          matchesDate = matchesDate && visitaDate <= dataFim;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [visitas, searchTerm, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredVisitas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVisitas = filteredVisitas.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    key: keyof VisitaFilters,
    value: string | null
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "todos",
      dataInicio: getBrasiliaDateStart(),
      dataFim: getBrasiliaDateEnd(),
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.status !== "todos";

  const handleDelete = (id: string) => {
    // TODO: Implementar integração com API para delete
    console.log("Deletar visita:", id);
  };

  const handleEdit = (id: string) => {
    // TODO: Implementar integração com API para edição
    console.log("Editar visita:", id);
  };

  const handleChangeStatus = (id: string, status: StatusVisita) => {
    // TODO: Implementar integração com API para mudar status
    console.log("Mudar status da visita:", id, "para", status);
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <VisitasStats stats={initialStats} />

      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar visitas por cliente, técnico ou observações..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center">
                    1
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Refine sua busca com filtros avançados
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 pb-8 px-8">
                {/* Filtro Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={filters.status === "todos" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("status", "todos")}
                    >
                      Todas
                    </Button>
                    <Button
                      variant={
                        filters.status === "realizada" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "realizada")}
                    >
                      Realizadas
                    </Button>
                    <Button
                      variant={
                        filters.status === "pendente" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "pendente")}
                    >
                      Pendentes
                    </Button>
                    <Button
                      variant={
                        filters.status === "no_roteiro" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "no_roteiro")}
                    >
                      No Roteiro
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Filtro Data Início */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="datetime-local"
                    value={formatDateForInput(filters.dataInicio)}
                    onChange={(e) =>
                      handleFilterChange(
                        "dataInicio",
                        e.target.value ? new Date(e.target.value).toISOString() : null
                      )
                    }
                  />
                  {filters.dataInicio && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("dataInicio", null)}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Filtro Data Fim */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fim</label>
                  <Input
                    type="datetime-local"
                    value={formatDateForInput(filters.dataFim)}
                    onChange={(e) =>
                      handleFilterChange(
                        "dataFim",
                        e.target.value ? new Date(e.target.value).toISOString() : null
                      )
                    }
                  />
                  {filters.dataFim && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("dataFim", null)}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Botões de ação rápida */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ações Rápidas</label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilterChange("dataInicio", getBrasiliaDateStart());
                        handleFilterChange("dataFim", getBrasiliaDateEnd());
                      }}
                      className="w-full"
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        const brasiliaDate = new Date(
                          now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
                        );
                        const startOfWeek = new Date(brasiliaDate);
                        startOfWeek.setDate(brasiliaDate.getDate() - brasiliaDate.getDay());
                        startOfWeek.setHours(0, 0, 0, 0);
                        
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        endOfWeek.setHours(23, 59, 59, 999);
                        
                        handleFilterChange("dataInicio", startOfWeek.toISOString());
                        handleFilterChange("dataFim", endOfWeek.toISOString());
                      }}
                      className="w-full"
                    >
                      Esta Semana
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilterChange("dataInicio", null);
                        handleFilterChange("dataFim", null);
                      }}
                      className="w-full"
                    >
                      Todas as Datas
                    </Button>
                  </div>
                </div>

                {hasActiveFilters && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Redefinir filtros para hoje
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Visita
          </Button>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {currentVisitas.length} de {filteredVisitas.length} visita(s)
        {filteredVisitas.length !== visitas.length && " (filtradas)"}
      </div>

      {/* Lista de visitas */}
      {currentVisitas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhuma visita encontrada
          </p>
          {searchTerm || hasActiveFilters ? (
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm("");
                clearFilters();
              }}
              className="mt-2"
            >
              Limpar busca e filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentVisitas.map((visita) => (
            <VisitaCard
              key={visita.id}
              visita={visita}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onChangeStatus={handleChangeStatus}
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

