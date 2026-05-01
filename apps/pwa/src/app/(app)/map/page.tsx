"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { barbershopsApi } from "@/lib/api/barbershops.api";
import { Barbershop } from "@/types";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import StarRating from "@/components/StarRating";
import {
  MapPin,
  Search,
  ChevronRight,
  Scissors,
  Navigation,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Barbershop | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => setUserCoords({ lat: 4.711, lng: -74.0721 })
      );
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["barbershops-nearby", userCoords],
    queryFn: () =>
      barbershopsApi.getNearby({
        lat: userCoords!.lat,
        lng: userCoords!.lng,
        radius: 20000,
      }),
    enabled: !!userCoords,
  });

  const shops = (data || []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const hasGoogleMaps = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="max-w-md mx-auto w-full px-4 pt-4 pb-3 z-10">
        <h1 className="text-xl font-bold text-white mb-3">Barberías</h1>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            placeholder="Buscar barbería..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Map or list */}
      {hasGoogleMaps && userCoords ? (
        <div className="flex-1 relative overflow-hidden">
          <MapView
            shops={shops}
            userCoords={userCoords}
            onSelectShop={setSelectedShop}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          />
          {selectedShop && (
            <div className="absolute bottom-24 left-0 right-0 px-4 max-w-md mx-auto">
              <Card className="shadow-xl border-primary/20">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.06)] overflow-hidden shrink-0">
                    {selectedShop.coverImageUrl ? (
                      <Image
                        src={selectedShop.coverImageUrl}
                        alt={selectedShop.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors size={18} className="text-text-tertiary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">
                      {selectedShop.name}
                    </p>
                    <StarRating rating={selectedShop.rating} size={12} />
                    <p className="text-text-secondary text-xs mt-0.5 truncate">
                      {selectedShop.address}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/barbershop/${selectedShop.id}`)}
                    className="self-center text-primary"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-w-md mx-auto w-full px-4 pb-24">
          {isLoading ? (
            <div className="flex flex-col gap-3 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton h-20 rounded-2xl"
                />
              ))}
            </div>
          ) : shops.length > 0 ? (
            <div className="flex flex-col gap-3 mt-2">
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => router.push(`/barbershop/${shop.id}`)}
                  className="flex gap-3 p-4 bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-all text-left w-full"
                >
                  <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.06)] overflow-hidden shrink-0">
                    {shop.coverImageUrl ? (
                      <Image
                        src={shop.coverImageUrl}
                        alt={shop.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors size={18} className="text-text-tertiary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">
                      {shop.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating rating={shop.rating} size={12} />
                      <span className="text-text-tertiary text-xs">
                        ({shop.totalReviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={11} className="text-text-tertiary" />
                      <p className="text-text-secondary text-xs truncate">
                        {shop.address}
                      </p>
                    </div>
                    {shop.distanceMeters && (
                      <p className="text-primary text-xs font-medium mt-0.5">
                        {shop.distanceMeters < 1000
                          ? `${Math.round(shop.distanceMeters)}m`
                          : `${(shop.distanceMeters / 1000).toFixed(1)}km`}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-text-tertiary shrink-0 self-center" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-16 gap-4">
              <MapPin size={40} className="text-text-tertiary" />
              <p className="text-text-secondary text-center">
                {search
                  ? "No se encontraron barberías con ese nombre"
                  : "No hay barberías cercanas"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
