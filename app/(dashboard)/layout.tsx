import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkspaceProvider } from "@/components/organization/workspace-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-y-auto w-full">
          <div className="flex items-center border-b h-16 px-4">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-semibold">Sistema de Gestão</h2>
          </div>
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}


