"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatorioCard } from "./relatorio-card";
import { RelatorioDetailDialog } from "./relatorio-detail-dialog";
import {
  FileText,
  Search,
  Calendar,
  Star,
  Download,
  Loader2,
  AlertCircle,
  FileX,
  Filter,
  X,
} from "lucide-react";
import { getRelatoriosVisita } from "@/lib/api";
import { generateRelatorioPdf, generateRelatoriosBatchPdf } from "@/lib/pdf-generator";
import type { RelatorioVisita } from "@/types/relatorio";

export function RelatoriosList() {
  const [relatorios, setRelatorios] = useState<RelatorioVisita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioVisita | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [avaliacaoFilter, setAvaliacaoFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchRelatorios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page, limit };
      if (searchTerm) params.clienteNome = searchTerm;
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      if (avaliacaoFilter && avaliacaoFilter !== "all") {
        params.avaliacao = parseInt(avaliacaoFilter);
      }

      const response = await getRelatoriosVisita(params);
      setRelatorios(response.data);
      setTotalPages(response.pageCount ?? 1);
      setTotal(response.count ?? 0);
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
      setError("Erro ao carregar relatórios. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, dataInicio, dataFim, avaliacaoFilter]);

  useEffect(() => {
    fetchRelatorios();
  }, [fetchRelatorios]);

  const handleView = (relatorio: RelatorioVisita) => {
    setSelectedRelatorio(relatorio);
    setIsDialogOpen(true);
  };

  const handleExportPdf = (relatorio: RelatorioVisita) => {
    generateRelatorioPdf(relatorio);
  };

  const handleExportAllPdf = () => {
    if (relatorios.length > 0) {
      generateRelatoriosBatchPdf(relatorios);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDataInicio("");
    setDataFim("");
    setAvaliacaoFilter("all");
    setPage(1);
  };

  const hasFilters = searchTerm || dataInicio || dataFim || avaliacaoFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Relatórios de Visitas
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {total} relatório(s) encontrado(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-slate-100 dark:bg-slate-800" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasFilters && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                  !
                </span>
              )}
            </Button>
            <Button
              onClick={handleExportAllPdf}
              disabled={relatorios.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Todos
            </Button>
          </div>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Filtrar Relatórios
              </h3>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca por cliente */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Cliente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Data Início */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Data Início
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => {
                      setDataInicio(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Data Fim
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => {
                      setDataFim(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Avaliação */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Avaliação
                </label>
                <Select
                  value={avaliacaoFilter}
                  onValueChange={(value) => {
                    setAvaliacaoFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <Star className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="5">5 Estrelas</SelectItem>
                    <SelectItem value="4">4 Estrelas</SelectItem>
                    <SelectItem value="3">3 Estrelas</SelectItem>
                    <SelectItem value="2">2 Estrelas</SelectItem>
                    <SelectItem value="1">1 Estrela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Erro ao carregar relatórios
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {error}
          </p>
          <Button onClick={fetchRelatorios} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : relatorios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <FileX className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Nenhum relatório encontrado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {hasFilters
              ? "Tente ajustar os filtros para encontrar relatórios."
              : "Os relatórios de visitas técnicas aparecerão aqui."}
          </p>
        </div>
      ) : (
        <>
          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatorios.map((relatorio) => (
              <RelatorioCard
                key={relatorio.id}
                relatorio={relatorio}
                onView={handleView}
                onExportPdf={handleExportPdf}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog de Detalhes */}
      <RelatorioDetailDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        relatorio={selectedRelatorio}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
}

