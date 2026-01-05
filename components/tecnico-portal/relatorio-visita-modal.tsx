"use client";

import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SignatureCanvas, SignatureCanvasRef } from "@/components/ui/signature-canvas";
import { StarRating } from "@/components/ui/star-rating";
import {
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Star,
  PenTool,
  Send,
  Loader2,
} from "lucide-react";
import type { Visita } from "@/types/visita";

const relatorioVisitaSchema = z.object({
  visitaId: z.string(),
  clienteNome: z.string(),
  endereco: z.string(),
  data: z.string(),
  horarioInicio: z.string().min(1, "Horário de início é obrigatório"),
  horarioFim: z.string().optional(),
  descricaoGeral: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  avaliacao: z.number().min(1, "Selecione uma avaliação").max(5),
  observacoesAvaliacao: z.string().optional(),
  assinaturaCliente: z.string().min(1, "Assinatura do cliente é obrigatória"),
});

export type RelatorioVisitaFormValues = z.infer<typeof relatorioVisitaSchema>;

interface RelatorioVisitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RelatorioVisitaFormValues) => void;
  visita: Visita | null;
  roteiroData: string;
  isSubmitting?: boolean;
}

export function RelatorioVisitaModal({
  isOpen,
  onClose,
  onSubmit,
  visita,
  roteiroData,
  isSubmitting = false,
}: RelatorioVisitaModalProps) {
  const signatureRef = useRef<SignatureCanvasRef>(null);

  const form = useForm<RelatorioVisitaFormValues>({
    resolver: zodResolver(relatorioVisitaSchema),
    defaultValues: {
      visitaId: "",
      clienteNome: "",
      endereco: "",
      data: "",
      horarioInicio: "",
      horarioFim: "",
      descricaoGeral: "",
      avaliacao: 0,
      observacoesAvaliacao: "",
      assinaturaCliente: "",
    },
  });

  // Preencher dados quando a visita mudar
  useEffect(() => {
    if (visita && isOpen) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      form.reset({
        visitaId: visita.id,
        clienteNome: visita.cliente?.nome || "",
        endereco: visita.cliente?.endereco || "",
        data: roteiroData.split("T")[0], // YYYY-MM-DD
        horarioInicio: currentTime,
        horarioFim: "",
        descricaoGeral: "",
        avaliacao: 0,
        observacoesAvaliacao: "",
        assinaturaCliente: "",
      });
      signatureRef.current?.clear();
    }
  }, [visita, isOpen, roteiroData, form]);

  const handleSubmit = (values: RelatorioVisitaFormValues) => {
    onSubmit(values);
  };

  const handleClose = () => {
    form.reset();
    signatureRef.current?.clear();
    onClose();
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (!visita) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <FileText className="h-5 w-5 text-emerald-400" />
            Relatório de Visita
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os detalhes da visita técnica realizada
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações do Cliente (Somente Leitura) */}
            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                Informações do Cliente
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clienteNome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Cliente</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="bg-slate-800 border-slate-600 text-white cursor-not-allowed"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Data
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={formatDateDisplay(field.value)}
                          readOnly
                          className="bg-slate-800 border-slate-600 text-white cursor-not-allowed"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Endereço
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className="bg-slate-800 border-slate-600 text-white cursor-not-allowed"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Horários */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Horários
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horarioInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Horário Início *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horarioFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Horário Fim (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Descrição Geral */}
            <FormField
              control={form.control}
              name="descricaoGeral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    Descrição Geral *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva os serviços realizados, observações técnicas, etc."
                      className="bg-slate-800 border-slate-600 text-white min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="bg-slate-700" />

            {/* Avaliação */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-400" />
                Avaliação do Cliente
              </h3>

              <FormField
                control={form.control}
                name="avaliacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Nota *</FormLabel>
                    <FormControl>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        size="lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoesAvaliacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Comentários adicionais sobre a avaliação..."
                        className="bg-slate-800 border-slate-600 text-white min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="bg-slate-700" />

            {/* Assinatura */}
            <FormField
              control={form.control}
              name="assinaturaCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-emerald-400" />
                    Assinatura do Cliente *
                  </FormLabel>
                  <FormControl>
                    <SignatureCanvas
                      ref={signatureRef}
                      onChange={(dataURL) => field.onChange(dataURL)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Relatório
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
