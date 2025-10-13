import { VisitasList } from "@/components/visitas/visitas-list";

export default function VisitasPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Visitas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie e acompanhe todas as visitas técnicas agendadas
        </p>
      </div>
      <VisitasList />
    </div>
  );
}

