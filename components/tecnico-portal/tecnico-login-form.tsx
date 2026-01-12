"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Truck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { setWorkspaceId } from "@/lib/api";
import { organizationClient } from "@/lib/organization-client";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function TecnicoLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Usar API route local para definir cookies corretamente
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error?.message || "Email ou senha inválidos");
        return;
      }

      // Buscar sessão para obter o workspace ID
      try {
        const sessionRes = await fetch("/api/auth/session", { 
          credentials: "include" 
        });
        const sessionData = await sessionRes.json();
        
        let workspaceId: string | null = null;
        
        // Tentar obter o workspace ID da sessão
        if (sessionData?.session?.activeOrganizationId) {
          workspaceId = sessionData.session.activeOrganizationId;
        } else {
          // Se não houver workspace ativo, buscar a primeira organização
          const orgsResult = await organizationClient.list();
          const orgsData = orgsResult.data 
            ? (Array.isArray(orgsResult.data) ? orgsResult.data : [])
            : [];
          
          if (orgsData.length > 0) {
            const firstOrg = orgsData[0];
            // Definir como ativa
            await organizationClient.setActive({ organizationId: firstOrg.id });
            workspaceId = firstOrg.id;
          }
        }
        
        // Definir o workspace ID no localStorage e cookie
        if (workspaceId) {
          setWorkspaceId(workspaceId);
        }
      } catch (workspaceError) {
        console.error("[TecnicoLogin] Erro ao definir workspace:", workspaceError);
        // Continuar mesmo se houver erro ao definir workspace
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/tecnico";
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
            <Truck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Portal do Técnico</h1>
        <p className="text-slate-400">Acesse sua conta para ver seus roteiros</p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="Sua placa do veículo"
                        className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg shadow-emerald-600/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs text-center">
            Use o email cadastrado e sua placa como senha inicial
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-6">
        © 2025 RotGo - Sistema de Gestão de Rotas
      </p>
    </div>
  );
}

