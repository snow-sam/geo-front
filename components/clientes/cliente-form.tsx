"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
import type { Cliente } from "@/types/cliente";

const clienteSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  endereco: z
    .string()
    .min(10, { message: "Endereço deve ter no mínimo 10 caracteres" }),
  latitude: z
    .number()
    .min(-90, { message: "Latitude deve estar entre -90 e 90" })
    .max(90, { message: "Latitude deve estar entre -90 e 90" }),
  longitude: z
    .number()
    .min(-180, { message: "Longitude deve estar entre -180 e 180" })
    .max(180, { message: "Longitude deve estar entre -180 e 180" }),
  placeId: z.string().optional(),
  telefone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      { message: "Email inválido" }
    ),
  descricao: z.string().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (values: ClienteFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ClienteForm({
  cliente,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClienteFormProps) {
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente?.nome || "",
      endereco: cliente?.endereco || "",
      latitude: cliente?.latitude,
      longitude: cliente?.longitude,
      placeId: cliente?.placeId || "",
      telefone: cliente?.telefone || "",
      email: cliente?.email || "",
      descricao: cliente?.descricao || "",
    },
  });

  const handleSubmit = (values: ClienteFormValues) => {
    // Transformar strings vazias em undefined para campos opcionais
    const cleanedValues = {
      ...values,
      placeId: values.placeId?.trim() || undefined,
      telefone: values.telefone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      descricao: values.descricao?.trim() || undefined,
    };
    onSubmit(cleanedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do cliente" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço *</FormLabel>
              <FormControl>
                <PlacesAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  onPlaceSelected={(place) => {
                    // Preencher automaticamente os campos relacionados
                    form.setValue("endereco", place.address);
                    form.setValue("latitude", place.latitude);
                    form.setValue("longitude", place.longitude);
                    form.setValue("placeId", place.placeId);
                  }}
                  placeholder="Digite o endereço e selecione da lista"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Digite o endereço e selecione da lista. Latitude e longitude são obrigatórias.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ex: -23.55052"
                    value={field.value?.toString() ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseFloat(value));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ex: -46.633308"
                    value={field.value?.toString() ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseFloat(value));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="placeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google Place ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4" />
              </FormControl>
              <FormDescription>
                ID do local no Google Maps (usado para roteirização)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(11) 99999-9999" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="cliente@exemplo.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Informações adicionais" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Salvando..."
              : cliente
              ? "Atualizar Cliente"
              : "Criar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

