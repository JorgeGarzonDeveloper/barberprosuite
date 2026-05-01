"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";
import { barbershopsApi } from "@/lib/api/barbershops.api";
import { formatCOP, getGreeting } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import QueueCard from "@/components/QueueCard";
import StarRating from "@/components/StarRating";
import {
  MapPin,
  ChevronRight,
  AlertCircle,
  Scissors,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

function BarbershopSkeleton() {
  return (
    <div className="flex gap-3 p-4 bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.06)]">
      <div className="skeleton w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentEntry, fetchCurrentEntry } = useQueueStore();
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    fetchCurrentEntry();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () =>
          setUserCoords({ lat: 4.7110, lng: -74.0721 }) // Bogotá fallback
      );
    }
  }, [fetchCurrentEntry]);

  const { data: nearbyData, isLoading: nearbyLoading } = useQuery({
    queryKey: ["barbershops-nearby", userCoords],
    queryFn: () =>
      barbershopsApi.getNearby({
        lat: userCoords!.lat,
        lng: userCoords!.lng,
        radius: 10000,
      }),
    enabled: !!userCoords,
  });

  const nearby = (nearbyData || []).slice(0, 5);

  const hasPendingSubscription =
    user?.role === "BARBER" && false; // Would check from subscription store

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <p className="text-text-secondary text-sm">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-white">
          {user?.firstName || "Usuario"} 👋
        </h1>
      </div>

      {/* Pending subscription banner for barbers */}
      {hasPendingSubscription && (
        <div className="mb-4 bg-[rgba(245,158,11,0.1)] border border-warning/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-warning text-sm font-medium">
              Suscripción pendiente
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              Activa tu plan para que los clientes puedan verte
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-warning hover:text-warning mt-2 px-0"
              onClick={() => router.push("/subscription")}
            >
              Ver planes →
            </Button>
          </div>
        </div>
      )}

      {/* Active queue */}
      {currentEntry && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
            Cola activa
          </h2>
          <QueueCard entry={currentEntry} />
        </div>
      )}

      {/* Quick actions by role */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {user?.role === "CLIENT" && (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/map")}
              className="flex-col h-auto py-4 gap-2"
            >
              <MapPin size={20} className="text-primary" />
              <span className="text-xs">Buscar barbería</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/scan")}
              className="flex-col h-auto py-4 gap-2"
            >
              <Scissors size={20} className="text-primary" />
              <span className="text-xs">Unirse a cola</span>
            </Button>
          </>
        )}
        {(user?.role === "BARBER" || user?.role === "ADMIN") && (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/barber-queue")}
              className="flex-col h-auto py-4 gap-2"
            >
              <Scissors size={20} className="text-primary" />
              <span className="text-xs">Gestionar cola</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/appointments")}
              className="flex-col h-auto py-4 gap-2"
            >
              <Calendar size={20} className="text-primary" />
              <span className="text-xs">Mis citas</span>
            </Button>
          </>
        )}
      </div>

      {/* Nearby barbershops */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Barberías cercanas
          </h2>
          <button
            onClick={() => router.push("/map")}
            className="text-primary text-xs flex items-center gap-1 hover:text-primary-dark transition-colors"
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {nearbyLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <BarbershopSkeleton key={i} />
              ))
            : nearby.length > 0
            ? nearby.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => router.push(`/barbershop/${shop.id}`)}
                  className="flex gap-3 p-4 bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-all text-left w-full active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.06)] overflow-hidden shrink-0">
                    {shop.coverImageUrl || shop.bannerUrl ? (
                      <Image
                        src={shop.coverImageUrl || shop.bannerUrl || ""}
                        alt={shop.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors size={20} className="text-text-tertiary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {shop.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating rating={shop.rating} size={12} />
                      <span className="text-text-tertiary text-xs">
                        ({shop.totalReviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={11} className="text-text-tertiary shrink-0" />
                      <p className="text-text-secondary text-xs truncate">
                        {shop.address}
                      </p>
                    </div>
                    {shop.distanceMeters && (
                      <p className="text-primary text-xs mt-0.5">
                        {shop.distanceMeters < 1000
                          ? `${Math.round(shop.distanceMeters)}m`
                          : `${(shop.distanceMeters / 1000).toFixed(1)}km`}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-text-tertiary shrink-0 self-center" />
                </button>
              ))
            : !nearbyLoading && (
                <Card className="text-center py-8">
                  <MapPin size={32} className="text-text-tertiary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">
                    No hay barberías cercanas
                  </p>
                  <p className="text-text-tertiary text-xs mt-1">
                    Intenta ampliar el radio de búsqueda
                  </p>
                </Card>
              )}
        </div>
      </div>
    </div>
  );
}
