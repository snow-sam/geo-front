"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Star,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import type { RelatorioVisita } from "@/types/relatorio";

interface RelatorioCardProps {
  relatorio: RelatorioVisita;
  onView: (relatorio: RelatorioVisita) => void;
  onExportPdf: (relatorio: RelatorioVisita) => void;
}

export function RelatorioCard({
  relatorio,
  onView,
  onExportPdf,
}: RelatorioCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || "-";
  };

  const getAvaliacaoColor = (avaliacao: number) => {
    if (avaliacao >= 4) return "bg-emerald-500";
    if (avaliacao >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
        }`}
      />
    ));
  };
  console.log("relatorio", relatorio);
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                {relatorio.visita.cliente.nome}
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {relatorio.visita.cliente.endereco.length > 40
                  ? `${relatorio.visita.cliente.endereco.substring(0, 40)}...`
                  : relatorio.visita.cliente.endereco}
              </p>
            </div>
          </div>
          <Badge
            className={`${getAvaliacaoColor(relatorio.avaliacao)} text-white`}
          >
            {relatorio.avaliacao}/5
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações principais */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{formatDate(relatorio.visita.dataAgendamento)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>
              {formatTime(relatorio.horarioInicio)}
              {relatorio.horarioFim && ` - ${formatTime(relatorio.horarioFim)}`}
            </span>
          </div>
        </div>

        {/* Avaliação com estrelas */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Avaliação:
          </span>
          <div className="flex">{renderStars(relatorio.avaliacao)}</div>
        </div>

        {/* Descrição prévia */}
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
          {relatorio.descricaoGeral}
        </p>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(relatorio)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onExportPdf(relatorio)}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

