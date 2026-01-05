"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Star,
  FileText,
  MessageSquare,
  PenTool,
  Download,
} from "lucide-react";
import type { RelatorioVisita } from "@/types/relatorio";
import Image from "next/image";

interface RelatorioDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  relatorio: RelatorioVisita | null;
  onExportPdf: (relatorio: RelatorioVisita) => void;
}

export function RelatorioDetailDialog({
  isOpen,
  onClose,
  relatorio,
  onExportPdf,
}: RelatorioDetailDialogProps) {
  if (!relatorio) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || "-";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-indigo-600" />
            Relatório de Visita
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do relatório de visita técnica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Cliente */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Informações do Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Cliente:</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {relatorio.visita.cliente.nome}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Data:</span>
                <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(relatorio.visita.dataAgendamento)}
                </p>
              </div>
            </div>

            <div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Endereço:</span>
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {relatorio.visita.cliente.endereco}
              </p>
            </div>
          </div>

          {/* Horários */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              Horários
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Início:</span>
                <p className="font-medium text-lg text-slate-900 dark:text-white">
                  {formatTime(relatorio.horarioInicio)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Fim:</span>
                <p className="font-medium text-lg text-slate-900 dark:text-white">
                  {relatorio.horarioFim ? formatTime(relatorio.horarioFim) : "-"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Descrição Geral */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Descrição Geral
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              {relatorio.descricaoGeral}
            </p>
          </div>

          <Separator />

          {/* Avaliação */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Star className="h-4 w-4 text-indigo-600" />
              Avaliação do Cliente
            </h3>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-1">
                {renderStars(relatorio.avaliacao)}
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {relatorio.avaliacao}/5
              </span>
            </div>

            {relatorio.observacoesAvaliacao && (
              <div className="space-y-2">
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Observações:
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  {relatorio.observacoesAvaliacao}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Assinatura */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-indigo-600" />
              Assinatura do Cliente
            </h3>
            <div className="p-4 bg-white dark:bg-slate-900 border rounded-lg flex justify-center">
              {relatorio.assinaturaCliente && (
                <img
                  src={relatorio.assinaturaCliente}
                  alt="Assinatura do cliente"
                  className="max-w-full h-auto max-h-32"
                />
              )}
            </div>
          </div>

          {/* Botão de exportar */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => onExportPdf(relatorio)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar como PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

