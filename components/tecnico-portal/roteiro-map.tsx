"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { Roteiro } from "@/types/roteiro";

interface RoteiroMapProps {
  roteiro: Roteiro;
  tecnicoLocation?: { lat: number; lng: number };
}

// Função para criar elemento HTML customizado para o marcador
function createMarkerContent(order: number, isFirst: boolean): HTMLElement {
  const container = document.createElement("div");
  container.className = "marker-container";
  container.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: ${isFirst ? "#059669" : "#10b981"};
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: pointer;
  `;

  const label = document.createElement("span");
  label.textContent = String(order);
  label.style.cssText = `
    color: white;
    font-weight: bold;
    font-size: 14px;
  `;

  container.appendChild(label);
  return container;
}

export function RoteiroMap({ roteiro, tecnicoLocation }: RoteiroMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Verificar se o Google Maps está completamente carregado
  useEffect(() => {
    const checkGoogleMaps = () => {
      // Verificar se todos os construtores necessários estão disponíveis
      if (
        typeof google !== "undefined" &&
        google.maps &&
        typeof google.maps.Map === "function" &&
        typeof google.maps.InfoWindow === "function" &&
        typeof google.maps.DirectionsService === "function" &&
        google.maps.marker &&
        typeof google.maps.marker.AdvancedMarkerElement === "function"
      ) {
        setIsGoogleLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    // Escutar o evento disparado pelo GoogleMapsScript
    const handleGoogleMapsLoaded = () => {
      // Aguardar um pouco para garantir que a API está inicializada
      setTimeout(() => {
        if (checkGoogleMaps()) {
          setIsGoogleLoaded(true);
        }
      }, 100);
    };

    window.addEventListener("google-maps-loaded", handleGoogleMapsLoaded);

    // Polling como fallback
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isGoogleLoaded) {
        setError("Google Maps não carregou. Verifique sua conexão.");
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      window.removeEventListener("google-maps-loaded", handleGoogleMapsLoaded);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isGoogleLoaded]);

  // Inicializar mapa quando o Google Maps estiver carregado
  useEffect(() => {
    if (!isGoogleLoaded || !mapRef.current || !roteiro.visitas?.length) return;

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificação de segurança adicional
        if (typeof google.maps.Map !== "function") {
          throw new Error("Google Maps API não está pronta");
        }

        // Limpar marcadores anteriores
        markersRef.current.forEach((marker) => {
          marker.map = null;
        });
        markersRef.current = [];

        // Obter coordenadas dos clientes das visitas
        const visitasComCoords = roteiro.visitas
          .filter((v) => v.cliente?.latitude && v.cliente?.longitude)
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        if (visitasComCoords.length === 0) {
          setError("Nenhum cliente com coordenadas válidas");
          setIsLoading(false);
          return;
        }

        // Centro inicial no primeiro cliente
        const firstVisita = visitasComCoords[0];
        const center = {
          lat: firstVisita.cliente!.latitude!,
          lng: firstVisita.cliente!.longitude!,
        };

        // Criar mapa com mapId para suporte a AdvancedMarkerElement
        if (!mapInstance.current && mapRef.current) {
          mapInstance.current = new google.maps.Map(mapRef.current, {
            center,
            zoom: 12,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
            styles: [
              { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#334155" }],
              },
              {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#475569" }],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#0f172a" }],
              },
              {
                featureType: "poi",
                elementType: "geometry",
                stylers: [{ color: "#1e3a5f" }],
              },
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }

        // Adicionar marcadores para cada visita usando AdvancedMarkerElement
        visitasComCoords.forEach((visita, index) => {
          const markerContent = createMarkerContent(
            visita.ordem || index + 1,
            index === 0
          );

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: {
              lat: visita.cliente!.latitude!,
              lng: visita.cliente!.longitude!,
            },
            map: mapInstance.current,
            title: visita.cliente?.nome || "Cliente",
            content: markerContent,
          });

          // Info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; color: #1e293b;">
                <strong>${visita.cliente?.nome || "Cliente"}</strong>
                <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
                  ${visita.cliente?.endereco || ""}
                </p>
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open(mapInstance.current, marker);
          });

          markersRef.current.push(marker);
        });

        // Calcular e exibir rota
        if (visitasComCoords.length >= 2) {
          const directionsService = new google.maps.DirectionsService();
          
          if (!directionsRenderer.current) {
            directionsRenderer.current = new google.maps.DirectionsRenderer({
              suppressMarkers: true, // Usamos nossos próprios marcadores
              polylineOptions: {
                strokeColor: "#10b981",
                strokeWeight: 4,
                strokeOpacity: 0.8,
              },
            });
          }
          directionsRenderer.current.setMap(mapInstance.current);

          const waypoints = visitasComCoords.slice(1, -1).map((v) => ({
            location: new google.maps.LatLng(
              v.cliente!.latitude!,
              v.cliente!.longitude!
            ),
            stopover: true,
          }));

          const origin = tecnicoLocation
            ? new google.maps.LatLng(tecnicoLocation.lat, tecnicoLocation.lng)
            : new google.maps.LatLng(
                visitasComCoords[0].cliente!.latitude!,
                visitasComCoords[0].cliente!.longitude!
              );

          const destination = new google.maps.LatLng(
            visitasComCoords[visitasComCoords.length - 1].cliente!.latitude!,
            visitasComCoords[visitasComCoords.length - 1].cliente!.longitude!
          );

          // Se a origem é a localização do técnico, adicionar a primeira visita como waypoint
          const allWaypoints = tecnicoLocation
            ? [
                {
                  location: new google.maps.LatLng(
                    visitasComCoords[0].cliente!.latitude!,
                    visitasComCoords[0].cliente!.longitude!
                  ),
                  stopover: true,
                },
                ...waypoints,
              ]
            : waypoints;

          try {
            const result = await directionsService.route({
              origin,
              destination,
              waypoints: allWaypoints,
              optimizeWaypoints: false, // Manter a ordem definida
              travelMode: google.maps.TravelMode.DRIVING,
            });

            directionsRenderer.current.setDirections(result);
          } catch (routeError) {
            console.error("Erro ao calcular rota:", routeError);
            // Fallback: ajustar bounds para mostrar todos os marcadores
            const bounds = new google.maps.LatLngBounds();
            visitasComCoords.forEach((v) => {
              bounds.extend({
                lat: v.cliente!.latitude!,
                lng: v.cliente!.longitude!,
              });
            });
            mapInstance.current?.fitBounds(bounds);
          }
        } else {
          // Apenas uma visita, centralizar nela
          mapInstance.current?.setCenter(center);
          mapInstance.current?.setZoom(15);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao inicializar mapa:", err);
        setError("Erro ao carregar o mapa");
        setIsLoading(false);
      }
    };

    initMap();
  }, [isGoogleLoaded, roteiro, tecnicoLocation]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-400">Carregando mapa...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
