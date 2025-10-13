import { ChamadosList } from "@/components/chamados/chamados-list";
import { getChamados, getChamadosStats } from "@/lib/api";

export default async function ChamadosPage() {
  let chamados = [];
  let stats = { abertos: 0, emAndamento: 0, fechados: 0 };
  
  try {
    const [chamadosResponse, statsResponse] = await Promise.all([
      getChamados({ limit: 100 }),
      getChamadosStats(),
    ]);
    chamados = chamadosResponse.data;
    stats = statsResponse;
  } catch (error) {
    console.error("Erro ao carregar chamados:", error);
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chamados</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie e acompanhe todos os chamados técnicos e solicitações de serviço
        </p>
      </div>
      <ChamadosList initialChamados={chamados} initialStats={stats} />
    </div>
  );
}

