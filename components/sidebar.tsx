"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Wrench,
  ClipboardList,
  Phone,
  Route,
  LogOut,
  Loader2,
  Building2,
  LayoutDashboard,
  FileText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { OrgSelector } from "@/components/organization/org-selector";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Técnicos",
    url: "/tecnicos",
    icon: Wrench,
  },
  {
    title: "Visitas",
    url: "/visitas",
    icon: ClipboardList,
  },
  {
    title: "Roteiros",
    url: "/roteiros",
    icon: Route,
  },
  {
    title: "Chamados",
    url: "/chamados",
    icon: Phone,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: FileText,
  },
  {
    title: "Organização",
    url: "/organizacao",
    icon: Building2,
  },
];

export function AppSidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-col gap-3 px-4 py-4">
          <h1 className="text-xl font-bold">RotGo</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-3">
          <OrgSelector />
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saindo...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            © 2025 RotGo
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
