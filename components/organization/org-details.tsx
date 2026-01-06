"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Pencil, Loader2, Save, X } from "lucide-react";
import { organizationClient } from "@/lib/organization-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/types/organization";

const orgSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  slug: z
    .string()
    .min(2, { message: "Slug deve ter pelo menos 2 caracteres" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug deve conter apenas letras minúsculas, números e hífens",
    }),
});

type OrgFormValues = z.infer<typeof orgSchema>;

interface OrgDetailsProps {
  organization: Organization | null;
  onUpdate: () => void;
  canEdit: boolean;
}

export function OrgDetails({ organization, onUpdate, canEdit }: OrgDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name || "",
      slug: organization?.slug || "",
    },
  });

  const onSubmit = async (values: OrgFormValues) => {
    if (!organization) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await organizationClient.update({
        name: values.name,
        slug: values.slug,
      });

      if (result.error) {
        setError(result.error.message || "Erro ao atualizar organização");
        return;
      }

      setIsEditing(false);
      onUpdate();
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset({
      name: organization?.name || "",
      slug: organization?.slug || "",
    });
    setIsEditing(false);
    setError(null);
  };

  if (!organization) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma organização selecionada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Detalhes da Organização</CardTitle>
          <CardDescription>
            Informações gerais da sua organização
          </CardDescription>
        </div>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da organização" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="minha-organizacao" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                {organization.logo ? (
                  <img
                    src={organization.logo}
                    alt={organization.name}
                    className="h-12 w-12 rounded"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{organization.name}</h3>
                <p className="text-sm text-muted-foreground">/{organization.slug}</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono">{organization.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span>
                  {new Date(organization.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

