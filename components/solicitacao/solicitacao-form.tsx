"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, MapPin, Wrench, Camera, ClipboardList, Loader2, CheckCircle } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";

import { solicitacaoSchema, type SolicitacaoFormValues } from "@/types/solicitacao";
import { createSolicitacao } from "@/lib/api";

interface SolicitacaoFormProps {
  onSuccess?: () => void;
}

export function SolicitacaoForm({ onSuccess }: SolicitacaoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SolicitacaoFormValues>({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
      nomeEmpresa: "",
      nomeFuncao: "",
      telefoneContato: "",
      enderecoCompleto: "",
      precisaAutorizacao: false,
      procedimentoAutorizacao: "",
      equipamentoModelo: "",
      descricaoProblema: "",
      fotoEquipamento: "",
      fotoVideoProblema: "",
      responsavelNome: "",
      responsavelTelefone: "",
      horarioDisponivel: "",
    },
  });

  const precisaAutorizacao = form.watch("precisaAutorizacao");

  const onSubmit = async (values: SolicitacaoFormValues) => {
    setIsLoading(true);
    try {
      // Remove as imagens temporariamente para evitar "request entity too large"
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fotoEquipamento, fotoVideoProblema, ...dadosSemImagens } = values;
      await createSolicitacao({
        ...dadosSemImagens,
        fotoEquipamento: "", // TODO: implementar upload separado
        fotoVideoProblema: "", // TODO: implementar upload separado
      });
      setIsSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
          <h2 className="mt-4 text-2xl font-bold text-green-800 dark:text-green-200">
            Solicitação enviada com sucesso!
          </h2>
          <p className="mt-2 text-center text-green-700 dark:text-green-300">
            Em breve entraremos em contato para confirmar o atendimento.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setIsSuccess(false);
              form.reset();
            }}
          >
            Enviar nova solicitação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção 1: Dados do Solicitante */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              1. Dados do Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nomeEmpresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da empresa *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o nome da empresa"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeFuncao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu nome e função *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: João Silva - Gerente de TI"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefoneContato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone para contato *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="(11) 99999-9999"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Seção 2: Local do Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              2. Local do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enderecoCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço completo do atendimento *</FormLabel>
                  <FormControl>
                    <PlacesAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      onPlaceSelected={(place) => {
                        form.setValue("enderecoCompleto", place.address);
                      }}
                      placeholder="Digite o endereço e selecione da lista"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Digite o endereço completo incluindo número, bairro e cidade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="precisaAutorizacao"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>
                    Precisa de autorização ou integração para entrar no local? *
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value: string) => field.onChange(value === "sim")}
                      value={field.value ? "sim" : "nao"}
                      className="flex gap-6"
                      disabled={isLoading}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="autorizacao-sim" />
                        <label htmlFor="autorizacao-sim" className="cursor-pointer">
                          Sim
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="autorizacao-nao" />
                        <label htmlFor="autorizacao-nao" className="cursor-pointer">
                          Não
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {precisaAutorizacao && (
              <FormField
                control={form.control}
                name="procedimentoAutorizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informe o procedimento *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva como obter autorização ou integração para entrar no local..."
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Seção 3: Sobre o Equipamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              3. Sobre o Equipamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="equipamentoModelo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qual equipamento precisa de atendimento? *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Modelo ou tipo do equipamento"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o modelo ou tipo do equipamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricaoProblema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que está acontecendo? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva brevemente o problema que está ocorrendo..."
                      disabled={isLoading}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descrição do problema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Seção 4: Evidências do Problema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              4. Evidências do Problema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="fotoEquipamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Envie 1 foto do equipamento (opcional)</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      accept="image/*"
                      maxSize={5}
                      maxWidth={1200}
                      quality={0.7}
                      disabled={isLoading}
                      placeholder="Arraste uma foto ou clique para selecionar"
                    />
                  </FormControl>
                  <FormDescription>
                    Em breve o upload de imagens estará disponível
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fotoVideoProblema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Envie 1 foto mostrando o problema (opcional)</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      accept="image/*"
                      maxSize={5}
                      maxWidth={1200}
                      quality={0.7}
                      disabled={isLoading}
                      placeholder="Arraste uma foto ou clique para selecionar"
                    />
                  </FormControl>
                  <FormDescription>
                    Em breve o upload de imagens estará disponível
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Seção 5: Informações Finais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              5. Informações Finais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="responsavelNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável para acompanhar o técnico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome do responsável"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Opcional - se houver alguém específico
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavelTelefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do responsável</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="(11) 99999-9999"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Opcional
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="horarioDisponivel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário disponível para o atendimento *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Segunda a Sexta, das 8h às 18h"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botão de Submit */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px]">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Solicitação"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}


