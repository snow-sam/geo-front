import { ChamadosList } from "@/components/chamados/chamados-list";

export default function ChamadosPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chamados</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie e acompanhe todos os chamados técnicos e solicitações de serviço
        </p>
      </div>
      <ChamadosList />
    </div>
  );
}

