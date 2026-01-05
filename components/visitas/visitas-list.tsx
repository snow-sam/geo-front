"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Filter, X, Calendar } from "lucide-react";
import { gerarVisitasDoMes, updateVisita } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VisitaCard } from "@/components/visitas/visita-card";
import { VisitasStats } from "@/components/visitas/visitas-stats";
import { TecnicoSelectDialog } from "@/components/visitas/tecnico-select-dialog";
import { DataSelectDialog } from "@/components/visitas/data-select-dialog";
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
  const router = useRouter();
  const [visitas, setVisitas] = useState<Visita[]>(initialVisitas);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<VisitaFilters>({
    status: "todos",
    dataInicio: getBrasiliaDateStart(),
    dataFim: getBrasiliaDateEnd(),
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVisitaId, setSelectedVisitaId] = useState<string | null>(null);
  const [isTecnicoDialogOpen, setIsTecnicoDialogOpen] = useState(false);
  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  console.log(visitas)
  const filteredVisitas = useMemo(() => {
    return visitas.filter((visita) => {
      // Filtro de busca por texto
      const matchesSearch =
        searchTerm === "" ||
        visita.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visita.tecnico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visita.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus =
        filters.status === "todos" || visita.status === filters.status;

      // Filtro de data
      let matchesDate = true;
      if (filters.dataInicio || filters.dataFim) {
        const visitaDate = new Date(visita.dataAgendamento);
        if (filters.dataInicio) {
          const dataInicio = new Date(filters.dataInicio);
          matchesDate = matchesDate && visitaDate >= dataInicio;
        }
        if (filters.dataFim) {
          const dataFim = new Date(filters.dataFim);
          matchesDate = matchesDate && visitaDate <= dataFim;
        }
        console.log(filters)
      }
      matchesDate = true;
      // console.log(matchesSearch, matchesStatus, matchesDate)
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

  const handleChangeDate = (id: string) => {
    setSelectedVisitaId(id);
    setIsDataDialogOpen(true);
  };

  const handleDateSelect = async (newDate: string) => {
    if (!selectedVisitaId) return;

    setIsUpdating(true);
    try {
      const updatedVisita = await updateVisita(selectedVisitaId, { dataAgendamento: newDate });
      
      // Atualiza a visita na lista local
      setVisitas((prev) =>
        prev.map((v) => (v.id === selectedVisitaId ? updatedVisita : v))
      );

      // Fecha o dialog
      setIsDataDialogOpen(false);
      setSelectedVisitaId(null);
      
      // Recarrega para garantir dados atualizados
      router.refresh();
    } catch (error) {
      console.error("Erro ao alterar data:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao alterar a data.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeStatus = async (id: string, status: StatusVisita) => {
    try {
      const updatedVisita = await updateVisita(id, { status });
      
      // Atualiza a visita na lista local
      setVisitas((prev) =>
        prev.map((v) => (v.id === id ? updatedVisita : v))
      );
      
      // Recarrega para garantir dados atualizados
      router.refresh();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao alterar o status.");
    }
  };

  const handleChangeTecnico = (id: string) => {
    setSelectedVisitaId(id);
    setIsTecnicoDialogOpen(true);
  };

  const handleTecnicoSelect = async (tecnicoId: string) => {
    if (!selectedVisitaId) return;

    setIsUpdating(true);
    try {
      const updatedVisita = await updateVisita(selectedVisitaId, { tecnicoId });
      
      // Atualiza a visita na lista local
      setVisitas((prev) =>
        prev.map((v) => (v.id === selectedVisitaId ? updatedVisita : v))
      );

      // Fecha o dialog
      setIsTecnicoDialogOpen(false);
      setSelectedVisitaId(null);
      
      // Recarrega para garantir dados atualizados
      router.refresh();
    } catch (error) {
      console.error("Erro ao alterar técnico:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao alterar o técnico.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Encontra a visita selecionada para passar o tecnicoId atual
  const selectedVisita = visitas.find((v) => v.id === selectedVisitaId);

  const handleGerarVisitas = async () => {
    setIsGenerating(true);
    try {
      // Formata a data de hoje em YYYY-MM-DD
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().split("T")[0];
      
      await gerarVisitasDoMes(dataFormatada, true);
      
      // Recarrega as visitas
      router.refresh();
    } catch (error) {
      console.error("Erro ao gerar visitas:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {/* <VisitasStats stats={initialStats} /> */}

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

          <Button onClick={handleGerarVisitas} disabled={isGenerating}>
            <Calendar className="mr-2 h-4 w-4" />
            {isGenerating ? "Gerando..." : "Gerar Visitas"}
          </Button>
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
        <div className="flex flex-col gap-3">
          {currentVisitas.map((visita) => (
            <VisitaCard
              key={visita.id}
              visita={visita}
              onDelete={handleDelete}
              onChangeDate={handleChangeDate}
              onChangeStatus={handleChangeStatus}
              onChangeTecnico={handleChangeTecnico}
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

      {/* Dialog de Seleção de Técnico */}
      <TecnicoSelectDialog
        open={isTecnicoDialogOpen}
        onOpenChange={setIsTecnicoDialogOpen}
        currentTecnicoId={selectedVisita?.tecnicoId || ""}
        onSelect={handleTecnicoSelect}
      />

      {/* Dialog de Seleção de Data */}
      <DataSelectDialog
        open={isDataDialogOpen}
        onOpenChange={setIsDataDialogOpen}
        currentDate={selectedVisita?.dataAgendamento || ""}
        onSelect={handleDateSelect}
      />
    </div>
  );
}

