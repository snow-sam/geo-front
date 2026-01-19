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
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  
  // Interface para o evento do PlaceAutocompleteElement
  interface PlaceSelectEventDetail {
    place: {
      formattedAddress?: string;
      geometry?: {
        location: {
          lat: () => number;
          lng: () => number;
        };
      };
      id?: string;
    };
  }
  
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
    const intervalId = setInterval(() => {
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
    const timeoutId = setTimeout(() => {
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
    if (!isLoaded || !containerRef.current || disabled) return;

    // Limpar elemento anterior se existir
    if (autocompleteElementRef.current && containerRef.current.contains(autocompleteElementRef.current)) {
      containerRef.current.removeChild(autocompleteElementRef.current);
    }

    try {
      // Criar o elemento PlaceAutocompleteElement
      const autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: "br" }, // Restringir para Brasil
      });

      // Configurar tema light via atributo HTML
      autocompleteElement.setAttribute("theme", "light");

      // Adicionar o elemento ao container
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(autocompleteElement);

      // Configurar o input interno do elemento
      const inputElement = autocompleteElement.querySelector("input");
      if (inputElement) {
        if (placeholder) {
          inputElement.placeholder = placeholder;
        }
        inputElement.value = value;
        inputElement.disabled = disabled || false;
        inputElement.setAttribute("autocomplete", "off");
        
        // Aplicar estilos do shadcn/ui Input
        inputElement.className = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
      }

      // Adicionar listener para quando um lugar for selecionado
      const handlePlaceChange = (event: Event) => {
        const customEvent = event as CustomEvent<PlaceSelectEventDetail>;
        const place = customEvent.detail?.place;

        if (!place || !place.geometry?.location) {
          console.error("Nenhum detalhe disponível para o lugar selecionado");
          return;
        }

        const address = place.formattedAddress || "";
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        const placeId = place.id || "";

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
      };

      autocompleteElement.addEventListener("gmp-placeselect", handlePlaceChange);

      // Listener para mudanças no input
      const handleInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        onChange(target.value);
      };

      const inputEl = autocompleteElement.querySelector("input");
      if (inputEl) {
        inputEl.addEventListener("input", handleInputChange);
      }

      autocompleteElementRef.current = autocompleteElement;
      
      // Capturar referências para o cleanup
      const container = containerRef.current;

      return () => {
        autocompleteElement.removeEventListener("gmp-placeselect", handlePlaceChange);
        if (inputEl) {
          inputEl.removeEventListener("input", handleInputChange);
        }
        // Remover elemento do DOM
        if (container && container.contains(autocompleteElement)) {
          container.removeChild(autocompleteElement);
        }
        autocompleteElementRef.current = null;
      };
    } catch (error) {
      console.error("Erro ao inicializar Google Places Autocomplete:", error);
    }
  }, [isLoaded, onChange, onPlaceSelected, disabled, placeholder, value]);

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
      <div ref={containerRef} className="w-full" />
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-md z-10">
          <span className="text-xs text-gray-500">Carregando...</span>
        </div>
      )}
    </div>
  );
}

