"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Route, LogOut, Loader2, Truck } from "lucide-react";
import Link from "next/link";

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

const menuItems = [
  {
    title: "Meus Roteiros",
    url: "/tecnico",
    icon: Route,
  },
];

export function TecnicoSidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      router.push("/tecnico/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar className="border-r border-slate-800 bg-slate-950">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">RotGo</h1>
            <p className="text-xs text-slate-400">Portal do Técnico</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`transition-colors ${
                        isActive
                          ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon
                          className={isActive ? "text-emerald-400" : ""}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
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
          <p className="text-xs text-slate-500 text-center">
            © 2025 RotGo - Portal do Técnico
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

