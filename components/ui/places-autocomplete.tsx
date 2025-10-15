"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: {
    address: string;
    latitude: number;
    longitude: number;
    placeId: string;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  disabled,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(() => {
    // Verificar imediatamente no estado inicial
    return typeof window !== "undefined" && 
           typeof google !== "undefined" && 
           !!google.maps?.places;
  });
  const [loadError, setLoadError] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Evitar múltiplas verificações
    if (hasChecked.current || isLoaded) return;
    hasChecked.current = true;

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    // Verificar se o Google Maps já está carregado
    const checkGoogleMapsLoaded = () => {
      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        setIsLoaded(true);
        setLoadError(false);
        return true;
      }
      return false;
    };

    // Verificar imediatamente
    if (checkGoogleMapsLoaded()) {
      return;
    }

    // Se não estiver carregado, verificar periodicamente a cada 300ms
    intervalId = setInterval(() => {
      if (checkGoogleMapsLoaded()) {
        clearInterval(intervalId);
      }
    }, 300);

    // Listener para o evento customizado
    const handleLoaded = () => {
      if (checkGoogleMapsLoaded()) {
        clearInterval(intervalId);
      }
    };

    window.addEventListener("google-maps-loaded", handleLoaded);

    // Timeout de 10 segundos para detectar falha no carregamento
    timeoutId = setTimeout(() => {
      const stillChecking = !checkGoogleMapsLoaded();
      if (stillChecking) {
        console.warn("Google Maps não carregou após 10 segundos. Verifique a API Key.");
        setLoadError(true);
        clearInterval(intervalId);
      }
    }, 10000);

    return () => {
      window.removeEventListener("google-maps-loaded", handleLoaded);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled) return;

    try {
      // Inicializar autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "br" }, // Restringir para Brasil
          fields: ["address_components", "formatted_address", "geometry", "place_id"],
          types: ["address"], // Focar em endereços
        }
      );

      // Adicionar listener para quando um lugar for selecionado
      const listener = autocompleteRef.current.addListener(
        "place_changed",
        () => {
          const place = autocompleteRef.current?.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            console.error("Nenhum detalhe disponível para o lugar selecionado");
            return;
          }

          const address = place.formatted_address || "";
          const latitude = place.geometry.location.lat();
          const longitude = place.geometry.location.lng();
          const placeId = place.place_id || "";

          // Atualizar o valor do input
          onChange(address);

          // Chamar callback com os dados completos
          if (onPlaceSelected) {
            onPlaceSelected({
              address,
              latitude,
              longitude,
              placeId,
            });
          }
        }
      );

      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (error) {
      console.error("Erro ao inicializar Google Places Autocomplete:", error);
    }
  }, [isLoaded, onChange, onPlaceSelected, disabled]);

  // Se houver erro no carregamento, mostrar input normal com aviso
  if (loadError) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
          <AlertCircle className="h-3 w-3" />
          <span>
            Google Maps não carregado. Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no arquivo .env.local
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || !isLoaded}
        autoComplete="off"
      />
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-md">
          <span className="text-xs text-gray-500">Carregando...</span>
        </div>
      )}
    </div>
  );
}

