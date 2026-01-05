import { SolicitacaoForm } from "@/components/solicitacao/solicitacao-form";
import { GoogleMapsScript } from "@/components/google-maps-script";

export const metadata = {
  title: "Abertura de Chamado - RotGo",
  description: "Formulário para abertura de chamado técnico",
};

export default function SolicitacaoPage() {
  return (
    <>
      <GoogleMapsScript />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
              Abertura de Chamado Técnico
            </h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
              Preencha o formulário abaixo para solicitar atendimento técnico
            </p>
          </div>

          {/* Form Container */}
          <div className="mx-auto max-w-3xl">
            <SolicitacaoForm />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Campos marcados com <span className="text-red-500">*</span> são obrigatórios
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


