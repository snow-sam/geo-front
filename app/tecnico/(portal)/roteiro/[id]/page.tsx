"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  ExternalLink,
  FileText,
} from "lucide-react";
import { getTecnicoRoteiro, createRelatorioVisita } from "@/lib/api";
import { RoteiroMap } from "@/components/tecnico-portal/roteiro-map";
import {
  RelatorioVisitaModal,
  RelatorioVisitaFormValues,
} from "@/components/tecnico-portal/relatorio-visita-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Roteiro } from "@/types/roteiro";
import type { Visita } from "@/types/visita";

export default function RoteiroDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());
  
  // Estado para o modal de relatório
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [isSubmittingRelatorio, setIsSubmittingRelatorio] = useState(false);

  useEffect(() => {
    async function loadRoteiro() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTecnicoRoteiro(params.id as string);
        setRoteiro(data);
        
        // Inicializar paradas já realizadas (com status "realizada" ou com relatório)
        if (data.visitas) {
          const alreadyCompleted = data.visitas
            .filter((v) => v.status === "realizado" || v.realizadoEm)
            .map((v) => v.id);
          
          if (alreadyCompleted.length > 0) {
            setCompletedStops(new Set(alreadyCompleted));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar roteiro:", err);
        setError("Erro ao carregar os detalhes do roteiro");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      loadRoteiro();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    // Extrai apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    // Cria a data usando o horário local (meio-dia para evitar problemas)
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (minutes?: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const handleOpenRelatorio = (visita: Visita) => {
    setSelectedVisita(visita);
    setIsRelatorioModalOpen(true);
  };

  const handleCloseRelatorio = () => {
    setIsRelatorioModalOpen(false);
    setSelectedVisita(null);
  };

  const handleSubmitRelatorio = async (data: RelatorioVisitaFormValues) => {
    setIsSubmittingRelatorio(true);
    try {
      // Envia o relatório para a API
      await createRelatorioVisita({
        visitaId: data.visitaId,
        clienteNome: data.clienteNome,
        endereco: data.endereco,
        data: data.data,
        horarioInicio: data.horarioInicio,
        horarioFim: data.horarioFim,
        descricaoGeral: data.descricaoGeral,
        avaliacao: data.avaliacao,
        observacoesAvaliacao: data.observacoesAvaliacao,
        assinaturaCliente: data.assinaturaCliente,
      });
      
      // Marca a parada como concluída usando o visitaId
      setCompletedStops((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.visitaId);
        return newSet;
      });
      
      handleCloseRelatorio();
    } catch (error) {
      console.error("Erro ao enviar relatório:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao enviar o relatório.");
    } finally {
      setIsSubmittingRelatorio(false);
    }
  };

  const openInMaps = (endereco?: string) => {
    if (!endereco) return;
    // Remove "undefined" do início se existir
    const finalAddress = endereco.replace(/^undefined,?\s*/i, "").trim();
    const encodedAddress = encodeURIComponent(finalAddress);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando roteiro...</p>
        </div>
      </div>
    );
  }

  if (error || !roteiro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-red-900/20 border-red-500/50 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error || "Roteiro não encontrado"}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-500/50 text-red-400 hover:bg-red-500/20"
              onClick={() => router.push("/tecnico")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = completedStops.size;
  const totalCount = roteiro.visitas?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => router.push("/tecnico")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="h-6 w-6 text-emerald-400" />
              {formatDate(roteiro.data)}
            </h1>
            <p className="text-slate-400 mt-1">
              Detalhes do roteiro de visitas
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-lg px-4 py-2 ${
            progressPercent === 100
              ? "border-emerald-500 text-emerald-400"
              : "border-slate-600 text-slate-300"
          }`}
        >
          {completedCount}/{totalCount} paradas
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">Paradas</p>
              <p className="text-xl font-bold text-white">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-xs text-slate-400">Tempo Estimado</p>
              <p className="text-xl font-bold text-white">
                {formatTime(roteiro.tempoEstimado)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4 flex items-center gap-3">
            <Navigation className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">Distância Total</p>
              <p className="text-xl font-bold text-white">
                {roteiro.distanciaTotal
                  ? `${roteiro.distanciaTotal.toFixed(1)} km`
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Map and List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map */}
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-400" />
              Mapa da Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] lg:h-[500px]">
              <RoteiroMap roteiro={roteiro} />
            </div>
          </CardContent>
        </Card>

        {/* Stops List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-400" />
              Lista de Paradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[450px] lg:max-h-[470px] overflow-y-auto pr-2">
              {roteiro.visitas
                ?.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map((visita) => {
                  const isCompleted = completedStops.has(visita.id);
                  return (
                    <div
                      key={visita.id}
                      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                        isCompleted
                          ? "bg-emerald-900/30 border-emerald-500/50"
                          : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                      }`}
                      onClick={() => handleOpenRelatorio(visita)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                          ) : (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold">
                              {visita.ordem || "-"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              isCompleted
                                ? "text-emerald-400 line-through"
                                : "text-white"
                            }`}
                          >
                            {visita.cliente?.nome || "Cliente não encontrado"}
                          </p>
                          <p className="text-sm text-slate-400 truncate">
                            {visita.cliente?.endereco}
                          </p>
                          
                          {/* Contact info */}
                          {(visita.cliente?.telefone || visita.cliente?.email) && (
                            <div className="flex items-center gap-4 mt-2">
                              {visita.cliente?.telefone && (
                                <a
                                  href={`tel:${visita.cliente.telefone}`}
                                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="h-3 w-3" />
                                  {visita.cliente.telefone}
                                </a>
                              )}
                              {visita.cliente?.email && (
                                <a
                                  href={`mailto:${visita.cliente.email}`}
                                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail className="h-3 w-3" />
                                  {visita.cliente.email}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-600/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRelatorio(visita);
                            }}
                            title="Enviar Relatório"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-600/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInMaps(visita.cliente?.endereco);
                            }}
                            title="Abrir no Maps"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Relatório de Visita */}
      <RelatorioVisitaModal
        isOpen={isRelatorioModalOpen}
        onClose={handleCloseRelatorio}
        onSubmit={handleSubmitRelatorio}
        visita={selectedVisita}
        roteiroData={roteiro.data}
        isSubmitting={isSubmittingRelatorio}
      />
    </div>
  );
}
