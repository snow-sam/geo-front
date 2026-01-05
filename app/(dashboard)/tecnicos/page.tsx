import { TecnicosList } from "@/components/tecnicos/tecnicos-list";
import { getTecnicosServer } from "@/lib/api-server";

export default async function TecnicosPage() {
  let tecnicos = [];
  
  try {
    const response = await getTecnicosServer({ limit: 100 });
    tecnicos = response.data;
  } catch (error) {
    console.error("Erro ao carregar técnicos:", error);
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Técnicos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie todos os técnicos cadastrados
        </p>
      </div>
      <TecnicosList initialTecnicos={tecnicos} />
    </div>
  );
}


