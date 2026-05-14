"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import Link from "next/link";
import { api } from "@/lib/api";
import { MapPin, Search, Scissors, Star, ChevronRight } from "lucide-react";

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function MapaPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [mapCenter] = useState({ lat: 4.711, lng: -74.0721 }); // Bogotá

  const { data: shops } = useQuery({
    queryKey: ["barbershops-map", search],
    queryFn: () =>
      api.get(`/barbershops?isActive=true&limit=50${search ? `&search=${search}` : ""}`).then((r) => r.data.data?.barbershops ?? []),
    retry: false,
  });

  const barbershops: any[] = shops ?? [];

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-0px)]">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 bg-[#0a0a0f] border-b border-white/10 lg:pt-6">
        <h1 className="text-xl font-bold text-white mb-3 lg:text-2xl">Mapa de barberías</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar barbería..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/30"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: 300 }}>
          <APIProvider apiKey={GMAPS_KEY}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={12}
              mapId="bps-map"
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: "100%", height: "100%" }}
            >
              {barbershops.map((s) =>
                s.latitude && s.longitude ? (
                  <AdvancedMarker
                    key={s.id}
                    position={{ lat: Number(s.latitude), lng: Number(s.longitude) }}
                    onClick={() => setSelected(s)}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center ${selected?.id === s.id ? "border-[#c9a227] scale-110" : "border-white/50"} bg-[#0a0a0f] transition-transform`}>
                      {s.coverImageUrl
                        ? <img src={s.coverImageUrl} alt="" className="w-full h-full object-cover" />
                        : <Scissors size={18} className="text-[#c9a227]" />}
                    </div>
                  </AdvancedMarker>
                ) : null
              )}

              {selected && selected.latitude && selected.longitude && (
                <InfoWindow
                  position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="bg-[#0d0d14] rounded-xl p-3 min-w-[200px]">
                    <p className="text-white font-bold text-sm mb-1">{selected.name}</p>
                    <p className="text-white/50 text-xs flex items-center gap-1 mb-2">
                      <MapPin size={10} />{selected.address ?? selected.city ?? ""}
                    </p>
                    <a href={`/barberia/${selected.id}`}
                      className="block w-full text-center bg-[#c9a227] text-black text-xs font-bold py-1.5 rounded-lg hover:bg-[#e8cc6a] transition-colors">
                      Ver barbería →
                    </a>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>

        {/* Barbershop list */}
        <div className="w-full lg:w-80 xl:w-96 bg-[#0d0d14] border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto" style={{ maxHeight: 260, minHeight: 120 }}>
          <div className="p-3 space-y-2">
            {barbershops.length === 0 && (
              <div className="py-8 text-center text-white/30 text-sm">Sin barberías</div>
            )}
            {barbershops.map((s) => (
              <Link key={s.id} href={`/barberia/${s.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selected?.id === s.id ? "border-[#c9a227]/50 bg-[#c9a227]/10" : "border-white/10 bg-white/5 hover:border-[#c9a227]/30"}`}
                onMouseEnter={() => setSelected(s)}>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                  {s.coverImageUrl
                    ? <img src={s.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Scissors size={16} className="text-[#c9a227]" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{s.name}</p>
                  <p className="text-white/40 text-xs truncate">{s.address ?? s.city ?? "Colombia"}</p>
                  {s.averageRating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={10} className="text-[#c9a227] fill-[#c9a227]" />
                      <span className="text-[#c9a227] text-xs">{Number(s.averageRating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
