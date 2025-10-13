import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Tag, MoreVertical, AlertCircle, Clock, CheckCircle2, User, Wrench } from "lucide-react";
import type { Chamado } from "@/types/chamado";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChamadoCardProps {
  chamado: Chamado;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onChangeStatus: (id: string, status: "aberto" | "em_andamento" | "fechado") => void;
}

export function ChamadoCard({ chamado, onDelete, onEdit, onChangeStatus }: ChamadoCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  };

  const getStatusBadge = () => {
    switch (chamado.status) {
      case "fechado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3" />
            Fechado
          </span>
        );
      case "aberto":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            <AlertCircle className="h-3 w-3" />
            Aberto
          </span>
        );
      case "em_andamento":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Clock className="h-3 w-3" />
            Em Andamento
          </span>
        );
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1">
            {getStatusBadge()}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ações do Chamado</DialogTitle>
                <DialogDescription>
                  Escolha uma ação para este chamado
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onEdit(chamado.id)}
                >
                  Editar Chamado
                </Button>
                
                {chamado.status !== "em_andamento" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onChangeStatus(chamado.id, "em_andamento")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Marcar como Em Andamento
                  </Button>
                )}
                
                {chamado.status !== "fechado" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onChangeStatus(chamado.id, "fechado")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Fechado
                  </Button>
                )}
                
                {chamado.status !== "aberto" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onChangeStatus(chamado.id, "aberto")}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Reabrir Chamado
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => onDelete(chamado.id)}
                >
                  Excluir Chamado
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {chamado.local}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Local</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {chamado.tipo}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tipo</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(chamado.dataAbertura)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Data de abertura
              </p>
            </div>
          </div>

          {chamado.clienteNome && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {chamado.clienteNome}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cliente</p>
              </div>
            </div>
          )}

          {chamado.tecnicoNome && (
            <div className="flex items-start gap-2">
              <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {chamado.tecnicoNome}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Técnico</p>
              </div>
            </div>
          )}
        </div>

        {chamado.descricao && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {chamado.descricao}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

