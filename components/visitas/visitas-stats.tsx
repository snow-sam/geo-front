import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Route } from "lucide-react";
import type { VisitaStats } from "@/types/visita";

interface VisitasStatsProps {
  stats: VisitaStats;
}

export function VisitasStats({ stats }: VisitasStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-white dark:bg-gray-800 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.realizadas}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Visitas concluídas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pendentes}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Aguardando execução
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">No Roteiro</CardTitle>
          <Route className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.noRoteiro}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Em andamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

