import { ClientesList } from "@/components/clientes/clientes-list";
import { getClientesServer } from "@/lib/api-server";

export default async function ClientesPage() {
  let clientes = [];
  
  try {
    const response = await getClientesServer({ limit: 100 });
    clientes = response.data;
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie todos os seus clientes cadastrados
        </p>
      </div>
      <ClientesList initialClientes={clientes} />
    </div>
  );
}


