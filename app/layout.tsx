import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RotGo - Sistema de Gestão",
  description: "Sistema de gestão para clientes, técnicos, visitas e chamados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 overflow-y-auto w-full">
            <div className="flex items-center border-b h-16 px-4">
              <SidebarTrigger />
              <h2 className="ml-4 text-lg font-semibold">Sistema de Gestão</h2>
            </div>
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
