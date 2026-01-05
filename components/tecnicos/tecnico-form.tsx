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
import type { Tecnico } from "@/types/tecnico";

const tecnicoSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  telefone: z.string().min(10, { message: "Telefone é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
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
  placa: z
    .string()
    .regex(/^[A-Z]{3}-?\d{1}[A-Z0-9]{1}\d{2}$|^[A-Z]{3}-\d{4}$/, {
      message: "Formato de placa inválido. Use ABC-1234 ou ABC1D23",
    })
    .optional(),
  especialidade: z.string().optional(),
});

type TecnicoFormValues = z.infer<typeof tecnicoSchema>;

interface TecnicoFormProps {
  tecnico?: Tecnico;
  onSubmit: (values: TecnicoFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TecnicoForm({
  tecnico,
  onSubmit,
  onCancel,
  isLoading = false,
}: TecnicoFormProps) {
  const form = useForm<TecnicoFormValues>({
    resolver: zodResolver(tecnicoSchema),
    defaultValues: {
      nome: tecnico?.nome || "",
      telefone: tecnico?.telefone || "",
      email: tecnico?.email || "",
      endereco: tecnico?.endereco || "",
      latitude: tecnico?.latitude,
      longitude: tecnico?.longitude,
      placeId: tecnico?.placeId || "",
      placa: tecnico?.placa || "",
      especialidade: tecnico?.especialidade || "",
    },
  });

  const handleSubmit = (values: TecnicoFormValues) => {
    // Transformar strings vazias em undefined para campos opcionais
    const cleanedValues = {
      ...values,
      placeId: values.placeId?.trim() || undefined,
      placa: values.placa?.trim() || undefined,
      especialidade: values.especialidade?.trim() || undefined,
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
                <Input {...field} placeholder="Nome do técnico" disabled={isLoading} />
              </FormControl>
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
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(11) 99999-9999" disabled={isLoading} />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="tecnico@exemplo.com" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                <Input {...field} placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4" disabled={isLoading} />
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
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa do Veículo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ABC-1234 ou ABC1D23" disabled={isLoading} />
                </FormControl>
                <FormDescription>
                  Placa do veículo (formato antigo ou Mercosul)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="especialidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidade</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Instalação, Manutenção, Elétrica" disabled={isLoading} />
                </FormControl>
                <FormDescription>
                  Área de especialização do técnico
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
              : tecnico
              ? "Atualizar Técnico"
              : "Criar Técnico"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

