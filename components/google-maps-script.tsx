"use client";

import Script from "next/script";

interface GoogleMapsScriptProps {
  apiKey: string;
}

export function GoogleMapsScript({ apiKey }: GoogleMapsScriptProps) {
  const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&language=pt-BR&loading=async`;

  return (
    <Script
      id="google-maps-script"
      src={scriptUrl}
      strategy="afterInteractive"
      onLoad={() => {
        // Disparar evento para notificar componentes que o Google Maps foi carregado
        setTimeout(() => {
          window.dispatchEvent(new Event("google-maps-loaded"));
        }, 100);
      }}
      onError={(e) => {
        console.error("Erro ao carregar Google Maps:", e);
        console.error("Verifique se a API Key está correta e se as APIs estão habilitadas no Google Cloud Console");
      }}
    />
  );
}

