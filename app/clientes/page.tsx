import { ClientesList } from "@/components/clientes/clientes-list";

export default function ClientesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie todos os seus clientes cadastrados
        </p>
      </div>
      <ClientesList />
    </div>
  );
}

