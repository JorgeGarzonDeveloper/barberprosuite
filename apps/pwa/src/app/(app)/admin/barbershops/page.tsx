"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StarRating from "@/components/StarRating";
import { PageSpinner } from "@/components/ui/Spinner";
import { MapPin, Store, ChevronLeft, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminBarbershopsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-barbershops", page],
    queryFn: () => adminApi.getBarbershops({ page, limit: 20 }),
  });

  const shops = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Barberías</h1>
        <span className="text-text-tertiary text-sm ml-auto">{total} total</span>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : shops.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {shops.map((shop) => (
              <Card key={shop.id}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center shrink-0">
                      <Store size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{shop.name}</p>
                      <p className="text-text-secondary text-xs">{shop.city}</p>
                    </div>
                  </div>
                  <StarRating rating={shop.rating} size={13} />
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <MapPin size={12} className="text-primary" />
                  <span className="truncate">{shop.address}</span>
                </div>
                {shop.phone && (
                  <div className="flex items-center gap-2 text-text-secondary text-xs">
                    <Phone size={12} className="text-primary" />
                    <span>{shop.phone}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {shops.length < total && (
            <Button variant="secondary" fullWidth className="mt-4" onClick={() => setPage((p) => p + 1)}>
              Ver más
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <Store size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No hay barberías registradas</p>
        </div>
      )}
    </div>
  );
}
