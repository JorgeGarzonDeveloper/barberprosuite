"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Barbershop } from "@/types";
import { MapPin } from "lucide-react";

interface MapViewProps {
  shops: Barbershop[];
  userCoords: { lat: number; lng: number };
  onSelectShop: (shop: Barbershop) => void;
  apiKey: string;
}

export default function MapView({
  shops,
  userCoords,
  onSelectShop,
  apiKey,
}: MapViewProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={userCoords}
        defaultZoom={14}
        mapId="barberprosuite-map"
        style={{ width: "100%", height: "100%" }}
        styles={[
          { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#2a2a3e" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0a0a1a" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#151525" }],
          },
        ]}
      >
        {/* User position */}
        <AdvancedMarker position={userCoords}>
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
        </AdvancedMarker>

        {/* Barbershop markers */}
        {shops.map((shop) => (
          <AdvancedMarker
            key={shop.id}
            position={{ lat: shop.latitude, lng: shop.longitude }}
            onClick={() => onSelectShop(shop)}
          >
            <div className="flex flex-col items-center cursor-pointer">
              <div className="bg-primary text-black text-xs font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap max-w-[100px] truncate">
                {shop.name}
              </div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary" />
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
