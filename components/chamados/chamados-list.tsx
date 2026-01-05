"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChamadoCard } from "@/components/chamados/chamado-card";
import type { Chamado, ChamadoFilters, ChamadoStats, StatusChamado } from "@/types/chamado";
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

// Função para obter o início do mês no horário de Brasília
const getBrasiliaMonthStart = () => {
  const now = new Date();
  const brasiliaDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  brasiliaDate.setDate(1);
  brasiliaDate.setHours(0, 0, 0, 0);
  return brasiliaDate.toISOString();
};

// Função para obter o fim do mês no horário de Brasília
const getBrasiliaMonthEnd = () => {
  const now = new Date();
  const brasiliaDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  brasiliaDate.setMonth(brasiliaDate.getMonth() + 1);
  brasiliaDate.setDate(0);
  brasiliaDate.setHours(23, 59, 59, 999);
  return brasiliaDate.toISOString();
};

interface ChamadosListProps {
  initialChamados: Chamado[];
  initialStats: ChamadoStats;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ChamadosList({ initialChamados, initialStats }: ChamadosListProps) {
  const [chamados] = useState<Chamado[]>(initialChamados);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ChamadoFilters>({
    status: "todos",
    dataInicio: getBrasiliaMonthStart(),
    dataFim: getBrasiliaMonthEnd(),
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredChamados = useMemo(() => {
    return chamados.filter((chamado) => {
      // Filtro de busca por texto
      const matchesSearch =
        searchTerm === "" ||
        chamado.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.clienteNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.tecnicoNome?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus =
        filters.status === "todos" || chamado.status === filters.status;

      // Filtro de data
      let matchesDate = true;
      if (filters.dataInicio || filters.dataFim) {
        const chamadoDate = new Date(chamado.dataAbertura);
        if (filters.dataInicio) {
          const dataInicio = new Date(filters.dataInicio);
          matchesDate = matchesDate && chamadoDate >= dataInicio;
        }
        if (filters.dataFim) {
          const dataFim = new Date(filters.dataFim);
          matchesDate = matchesDate && chamadoDate <= dataFim;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [chamados, searchTerm, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredChamados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentChamados = filteredChamados.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    key: keyof ChamadoFilters,
    value: string | null
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "todos",
      dataInicio: getBrasiliaMonthStart(),
      dataFim: getBrasiliaMonthEnd(),
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.status !== "todos";

  const handleDelete = (id: string) => {
    // TODO: Implementar integração com API para delete
    console.log("Deletar chamado:", id);
  };

  const handleEdit = (id: string) => {
    // TODO: Implementar integração com API para edição
    console.log("Editar chamado:", id);
  };

  const handleChangeStatus = (id: string, status: StatusChamado) => {
    // TODO: Implementar integração com API para mudar status
    console.log("Mudar status do chamado:", id, "para", status);
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {/* <ChamadosStats stats={initialStats} /> */}

      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar chamados por local, tipo, descrição, cliente ou técnico..."
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
                      Todos
                    </Button>
                    <Button
                      variant={
                        filters.status === "aberto" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "aberto")}
                    >
                      Abertos
                    </Button>
                    <Button
                      variant={
                        filters.status === "em_andamento" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "em_andamento")}
                    >
                      Em Andamento
                    </Button>
                    <Button
                      variant={
                        filters.status === "fechado" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "fechado")}
                    >
                      Fechados
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
                        const now = new Date();
                        const brasiliaDate = new Date(
                          now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
                        );
                        brasiliaDate.setHours(0, 0, 0, 0);
                        const startOfDay = brasiliaDate.toISOString();
                        
                        brasiliaDate.setHours(23, 59, 59, 999);
                        const endOfDay = brasiliaDate.toISOString();
                        
                        handleFilterChange("dataInicio", startOfDay);
                        handleFilterChange("dataFim", endOfDay);
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
                        handleFilterChange("dataInicio", getBrasiliaMonthStart());
                        handleFilterChange("dataFim", getBrasiliaMonthEnd());
                      }}
                      className="w-full"
                    >
                      Este Mês
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
                      Redefinir filtros para este mês
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Button>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {currentChamados.length} de {filteredChamados.length} chamado(s)
        {filteredChamados.length !== chamados.length && " (filtrados)"}
      </div>

      {/* Lista de chamados */}
      {currentChamados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhum chamado encontrado
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
          {currentChamados.map((chamado) => (
            <ChamadoCard
              key={chamado.id}
              chamado={chamado}
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

