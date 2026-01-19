"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlaceResult = any;

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  disabled,
}: PlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Refs para callbacks estáveis
  const onChangeRef = useRef(onChange);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const valueRef = useRef(value);

  // Atualiza refs quando props mudam
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const [isLoaded, setIsLoaded] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof google !== "undefined" &&
      !!google.maps?.places
  );
  const [loadError, setLoadError] = useState(false);

  /**
   * Aguarda carregamento do Google Maps
   */
  useEffect(() => {
    if (isLoaded) return;

    const checkLoaded = () => {
      if (typeof google !== "undefined" && google.maps?.places) {
        setIsLoaded(true);
        setLoadError(false);
        return true;
      }
      return false;
    };

    if (checkLoaded()) return;

    const intervalId = setInterval(() => {
      if (checkLoaded()) {
        clearInterval(intervalId);
      }
    }, 300);

    const timeoutId = setTimeout(() => {
      if (!checkLoaded()) {
        console.warn("Google Maps não carregou. Verifique a API Key.");
        setLoadError(true);
        clearInterval(intervalId);
      }
    }, 10_000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isLoaded]);

  /**
   * Handler para seleção de lugar - usa fetchFields para obter dados completos
   */
  const handlePlaceSelect = useCallback(async (event: CustomEvent) => {
    try {
      const place: PlaceResult = event.detail?.place;
      
      if (!place) {
        console.warn("Place não encontrado no evento");
        return;
      }

      // Busca os campos necessários (location e formattedAddress)
      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "id"],
      });

      const location = place.location;
      
      if (!location) {
        console.warn("Location não disponível após fetchFields");
        return;
      }

      const address = place.formattedAddress ?? "";
      
      // Na nova API, location pode ser um objeto LatLng com métodos ou propriedades diretas
      const latitude = typeof location.lat === "function" ? location.lat() : location.lat;
      const longitude = typeof location.lng === "function" ? location.lng() : location.lng;
      const placeId = place.id ?? "";

      console.log("Place selecionado:", { address, latitude, longitude, placeId });

      // Atualiza o valor do input
      if (inputRef.current) {
        inputRef.current.value = address;
      }

      // Chama os callbacks usando refs
      onChangeRef.current(address);
      onPlaceSelectedRef.current?.({
        address,
        latitude,
        longitude,
        placeId,
      });
    } catch (err) {
      console.error("Erro ao processar lugar selecionado:", err);
    }
  }, []);

  /**
   * Inicializa o PlaceAutocompleteElement uma única vez
   */
  useEffect(() => {
    if (!isLoaded || !containerRef.current || disabled) return;
    if (autocompleteElementRef.current) return;

    try {
      const autocompleteElement =
        new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: "br" },
        });

      // Força tema claro via style inline
      autocompleteElement.style.colorScheme = "light";

      containerRef.current.replaceChildren(autocompleteElement);

      // Aguarda um pouco para o elemento ser renderizado
      setTimeout(() => {
        const input = autocompleteElement.querySelector(
          "input"
        ) as HTMLInputElement | null;

        if (input) {
          inputRef.current = input;
          input.placeholder = placeholder ?? "";
          input.value = valueRef.current;
          input.disabled = !!disabled;
          input.autocomplete = "off";

          // Estilização consistente com o Input padrão do shadcn/ui
          input.className =
            "file:text-foreground placeholder:text-muted-foreground border-input h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base text-gray-900 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

          input.addEventListener("input", (e) => {
            onChangeRef.current((e.target as HTMLInputElement).value);
          });
        }
      }, 50);

      const placeSelectHandler = ((event: Event) => {
        handlePlaceSelect(event as CustomEvent);
      }) as EventListener;

      autocompleteElement.addEventListener("gmp-placeselect", placeSelectHandler);

      autocompleteElementRef.current = autocompleteElement;

      return () => {
        autocompleteElement.removeEventListener("gmp-placeselect", placeSelectHandler);
      };
    } catch (err) {
      console.error("Erro ao inicializar Places Autocomplete:", err);
      setLoadError(true);
    }
  }, [isLoaded, disabled, placeholder, handlePlaceSelect]);

  /**
   * Sincroniza value externo → input interno (apenas se diferente)
   */
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value && value !== "") {
      inputRef.current.value = value;
    }
  }, [value]);

  /**
   * Atualiza placeholder quando mudar
   */
  useEffect(() => {
    if (inputRef.current && placeholder) {
      inputRef.current.placeholder = placeholder;
    }
  }, [placeholder]);

  /**
   * Fallback quando Google Maps falhar
   */
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
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          <span>
            Google Maps não carregado. Configure
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no .env.local
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="w-full [color-scheme:light]"
        style={{ colorScheme: "light" }}
      />
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80">
          <span className="text-xs text-gray-500">Carregando...</span>
        </div>
      )}
    </div>
  );
}
