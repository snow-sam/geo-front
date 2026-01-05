import { TecnicoSidebar } from "@/components/tecnico-portal/tecnico-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function TecnicoPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-900">
        <TecnicoSidebar />
        <main className="flex-1 overflow-y-auto w-full">
          <div className="flex items-center border-b border-slate-800 h-16 px-4 bg-slate-950">
            <SidebarTrigger className="text-slate-300 hover:text-white hover:bg-slate-800" />
            <h2 className="ml-4 text-lg font-semibold text-white">
              Portal do Técnico
            </h2>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}

