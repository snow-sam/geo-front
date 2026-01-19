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

interface PlaceSelectEventDetail {
  place: {
    formattedAddress?: string;
    placeId?: string;
    geometry?: {
      location: {
        lat: () => number;
        lng: () => number;
      };
    };
  };
}

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

      autocompleteElement.setAttribute("theme", "light");

      containerRef.current.replaceChildren(autocompleteElement);

      const input = autocompleteElement.querySelector(
        "input"
      ) as HTMLInputElement | null;

      if (input) {
        inputRef.current = input;
        input.placeholder = placeholder ?? "";
        input.value = value;
        input.disabled = !!disabled;
        input.autocomplete = "off";

        input.className =
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

        input.addEventListener("input", (e) => {
          onChange((e.target as HTMLInputElement).value);
        });
      }

      const handlePlaceSelect = (
        event: CustomEvent<PlaceSelectEventDetail>
      ) => {
        const place = event.detail.place;

        if (!place?.geometry?.location) return;

        const address = place.formattedAddress ?? "";
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        const placeId = place.placeId ?? "";

        onChange(address);

        onPlaceSelected?.({
          address,
          latitude,
          longitude,
          placeId,
        });
      };

      autocompleteElement.addEventListener(
        "gmp-placeselect",
        handlePlaceSelect as EventListener
      );

      autocompleteElementRef.current = autocompleteElement;

      return () => {
        autocompleteElement.removeEventListener(
          "gmp-placeselect",
          handlePlaceSelect as EventListener
        );
        containerRef.current?.replaceChildren();
        autocompleteElementRef.current = null;
        inputRef.current = null;
      };
    } catch (err) {
      console.error("Erro ao inicializar Places Autocomplete:", err);
      setLoadError(true);
    }
  }, [isLoaded, disabled, placeholder, onChange, onPlaceSelected, value]);

  /**
   * Sincroniza value externo → input interno
   */
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

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
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
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
      <div ref={containerRef} className="w-full" />
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/50 dark:bg-gray-800/50">
          <span className="text-xs text-gray-500">Carregando...</span>
        </div>
      )}
    </div>
  );
}
