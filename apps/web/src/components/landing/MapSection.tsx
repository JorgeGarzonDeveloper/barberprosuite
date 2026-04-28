"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

// Barberías demo para mostrar en el mapa de la landing
const demoBarbershops = [
  { id: 1, name: "Elite Barber Shop", lat: 4.6721, lng: -74.0447, rating: 4.8 },
  { id: 2, name: "Classic Cuts", lat: 4.6780, lng: -74.0500, rating: 4.6 },
  { id: 3, name: "Urban Style", lat: 4.6650, lng: -74.0380, rating: 4.7 },
  { id: 4, name: "The Barber Room", lat: 4.6830, lng: -74.0420, rating: 4.9 },
];

export function MapSection() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <section id="mapa" className="py-24 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="section-title mb-4">
            Barberías en tu ciudad
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Encuentra la barbería más cercana y ve su disponibilidad en tiempo real
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl h-[500px] border border-gray-200 dark:border-gray-700">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={{ lat: 4.6721, lng: -74.0447 }}
                defaultZoom={13}
                mapId="barberprosuite-map"
                disableDefaultUI={false}
                gestureHandling="cooperative"
              >
                {demoBarbershops.map((shop) => (
                  <AdvancedMarker
                    key={shop.id}
                    position={{ lat: shop.lat, lng: shop.lng }}
                    title={shop.name}
                  >
                    <div className="bg-barber-accent rounded-full p-2 shadow-lg border-2 border-white">
                      <MapPin className="w-4 h-4 text-white" fill="currentColor" />
                    </div>
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          ) : (
            // Placeholder cuando no hay API key configurada
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-barber-accent mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">
                  Mapa Interactivo
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Google Maps se mostrará aquí con NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {demoBarbershops.map((shop) => (
                    <div key={shop.id} className="bg-white dark:bg-gray-600 rounded-xl p-3 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3 h-3 text-barber-accent" />
                        <span className="text-xs font-semibold text-gray-800 dark:text-white">
                          {shop.name}
                        </span>
                      </div>
                      <span className="text-yellow-500 text-xs">★ {shop.rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
