import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import type { ChamadoStats } from "@/types/chamado";

interface ChamadosStatsProps {
  stats: ChamadoStats;
}

export function ChamadosStats({ stats }: ChamadosStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Abertos</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.abertos}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Aguardando atendimento
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.emAndamento}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Sendo atendidos
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fechados</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.fechados}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Atendimentos concluídos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

