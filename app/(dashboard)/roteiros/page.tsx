import { RoteirosList } from "@/components/roteiros/roteiros-list";
import { getRoteirosServer } from "@/lib/api-server";
import type { Roteiro } from "@/types/roteiro";

export const dynamic = "force-dynamic";

export default async function RoteirosPage() {
  let roteiros: Roteiro[] = [];
  
  try {
    const response = await getRoteirosServer({ limit: 100 });
    roteiros = response.data;
  } catch (error) {
    console.error("Erro ao carregar roteiros:", error);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Roteiros</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie e visualize os roteiros de visitas dos técnicos
        </p>
      </div>

      <RoteirosList initialRoteiros={roteiros} />
    </div>
  );
}


