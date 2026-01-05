"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X, Route } from "lucide-react";
import { gerarRoteiroDoDia } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoteiroCard } from "@/components/roteiros/roteiro-card";
import { RoteiroDetailDialog } from "@/components/roteiros/roteiro-detail-dialog";
import type { Roteiro, RoteiroFilters } from "@/types/roteiro";
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

interface RoteirosListProps {
  initialRoteiros: Roteiro[];
}

export function RoteirosList({ initialRoteiros }: RoteirosListProps) {
  const router = useRouter();
  const [roteiros] = useState<Roteiro[]>(initialRoteiros);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<RoteiroFilters>({
    tecnicoId: null,
    clienteNome: null,
    dataInicio: null,
    dataFim: null,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRoteiroId, setSelectedRoteiroId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Evita hydration mismatch com componentes Radix (Sheet)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Extrair técnicos únicos para o filtro
  const tecnicos = useMemo(() => {
    const uniqueTecnicos = Array.from(
      new Map(
        roteiros.map((r) => {
          const tecnicoNome = typeof r.tecnico === 'object' && r.tecnico 
            ? r.tecnico.nome 
            : r.tecnicoNome || "Técnico não definido";
          return [r.tecnicoId, { id: r.tecnicoId, nome: tecnicoNome }];
        })
      ).values()
    );
    return uniqueTecnicos.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [roteiros]);

  const filteredRoteiros = useMemo(() => {
    return roteiros.filter((roteiro) => {
      const tecnicoNome = typeof roteiro.tecnico === 'object' && roteiro.tecnico 
        ? roteiro.tecnico.nome 
        : roteiro.tecnicoNome || "";
        
      // Filtro de busca por texto (técnico ou cliente)
      const matchesSearch =
        searchTerm === "" ||
        tecnicoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roteiro.visitas?.some((visita) =>
          visita.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filtro de técnico
      const matchesTecnico =
        !filters.tecnicoId || roteiro.tecnicoId === filters.tecnicoId;

      // Filtro de cliente
      const matchesCliente =
        !filters.clienteNome ||
        roteiro.visitas?.some((visita) =>
          visita.cliente?.nome
            ?.toLowerCase()
            .includes(filters.clienteNome!.toLowerCase())
        );

      // Filtro de data
      let matchesDate = true;
      if (filters.dataInicio || filters.dataFim) {
        const roteiroDate = new Date(roteiro.data);
        if (filters.dataInicio) {
          const dataInicio = new Date(filters.dataInicio);
          matchesDate = matchesDate && roteiroDate >= dataInicio;
        }
        if (filters.dataFim) {
          const dataFim = new Date(filters.dataFim);
          matchesDate = matchesDate && roteiroDate <= dataFim;
        }
      }

      return matchesSearch && matchesTecnico && matchesCliente && matchesDate;
    });
  }, [roteiros, searchTerm, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredRoteiros.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRoteiros = filteredRoteiros.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    key: keyof RoteiroFilters,
    value: string | null
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      tecnicoId: null,
      clienteNome: null,
      dataInicio: null,
      dataFim: null,
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.tecnicoId !== null ||
    filters.clienteNome !== null ||
    filters.dataInicio !== null ||
    filters.dataFim !== null;

  const activeFiltersCount = [
    filters.tecnicoId,
    filters.clienteNome,
    filters.dataInicio,
    filters.dataFim,
  ].filter((f) => f !== null).length;

  const handleView = (id: string) => {
    setSelectedRoteiroId(id);
    setIsDetailDialogOpen(true);
  };

  const handleGerarRoteiro = async () => {
    setIsGenerating(true);
    try {
      // Formata a data de hoje em YYYY-MM-DD
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().split("T")[0];
      
      await gerarRoteiroDoDia(dataFormatada, true);
      
      // Recarrega os roteiros
      router.refresh();
    } catch (error) {
      console.error("Erro ao gerar roteiro:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-6">
      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar roteiros por técnico ou cliente..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {mounted && (
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center">
                      {activeFiltersCount}
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
                {/* Filtro Técnico */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Técnico</label>
                  <div className="space-y-2">
                    <Button
                      variant={filters.tecnicoId === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("tecnicoId", null)}
                      className="w-full"
                    >
                      Todos os Técnicos
                    </Button>
                    {tecnicos.map((tecnico) => (
                      <Button
                        key={tecnico.id}
                        variant={
                          filters.tecnicoId === tecnico.id ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleFilterChange("tecnicoId", tecnico.id)}
                        className="w-full"
                      >
                        {tecnico.nome}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filtro Cliente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Input
                    placeholder="Nome do cliente..."
                    value={filters.clienteNome || ""}
                    onChange={(e) =>
                      handleFilterChange("clienteNome", e.target.value || null)
                    }
                  />
                  {filters.clienteNome && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange("clienteNome", null)}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Filtro Data Início */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="date"
                    value={formatDateForInput(filters.dataInicio)}
                    onChange={(e) =>
                      handleFilterChange(
                        "dataInicio",
                        e.target.value
                          ? new Date(e.target.value + "T00:00:00-03:00").toISOString()
                          : null
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
                    type="date"
                    value={formatDateForInput(filters.dataFim)}
                    onChange={(e) =>
                      handleFilterChange(
                        "dataFim",
                        e.target.value
                          ? new Date(e.target.value + "T23:59:59-03:00").toISOString()
                          : null
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
                      Limpar todos os filtros
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
            </Sheet>
          )}

          <Button onClick={handleGerarRoteiro} disabled={isGenerating}>
            <Route className="mr-2 h-4 w-4" />
            {isGenerating ? "Gerando..." : "Gerar Roteiro"}
          </Button>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {currentRoteiros.length} de {filteredRoteiros.length} roteiro(s)
        {filteredRoteiros.length !== roteiros.length && " (filtrados)"}
      </div>

      {/* Lista de roteiros */}
      {currentRoteiros.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhum roteiro encontrado
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
          {currentRoteiros.map((roteiro) => (
            <RoteiroCard
              key={roteiro.id}
              roteiro={roteiro}
              onView={handleView}
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

      {/* Dialog de Detalhes do Roteiro */}
      <RoteiroDetailDialog
        roteiroId={selectedRoteiroId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}
