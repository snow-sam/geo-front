import { Suspense } from "react";
import { TecnicoLoginForm } from "@/components/tecnico-portal/tecnico-login-form";

export default function TecnicoLoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <TecnicoLoginForm />
    </Suspense>
  );
}

