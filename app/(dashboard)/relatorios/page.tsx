import { RelatoriosList } from "@/components/relatorios/relatorios-list";

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize e exporte relatórios de visitas técnicas
        </p>
      </div>

      <RelatoriosList />
    </div>
  );
}

