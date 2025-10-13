import { VisitasList } from "@/components/visitas/visitas-list";
import { getVisitas, getVisitasStats } from "@/lib/api";

export default async function VisitasPage() {
  let visitas = [];
  let stats = { realizadas: 0, pendentes: 0, noRoteiro: 0 };
  
  try {
    const [visitasResponse, statsResponse] = await Promise.all([
      getVisitas({ limit: 100 }),
      getVisitasStats(),
    ]);
    visitas = visitasResponse.data;
    stats = statsResponse;
  } catch (error) {
    console.error("Erro ao carregar visitas:", error);
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Visitas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie e acompanhe todas as visitas técnicas agendadas
        </p>
      </div>
      <VisitasList initialVisitas={visitas} initialStats={stats} />
    </div>
  );
}

