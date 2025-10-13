import { RoteirosList } from "@/components/roteiros/roteiros-list";

export default function RoteirosPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Roteiros</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie e visualize os roteiros de visitas dos técnicos
        </p>
      </div>

      <RoteirosList />
    </div>
  );
}

