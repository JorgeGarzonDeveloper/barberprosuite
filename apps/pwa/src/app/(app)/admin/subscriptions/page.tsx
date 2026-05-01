"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { getStatusLabel, formatDate, cn } from "@/lib/utils";
import { Crown, ChevronLeft, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page],
    queryFn: () => adminApi.getSubscriptions({ page, limit: 20 }),
  });

  const subscriptions = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Suscripciones</h1>
        <span className="text-text-tertiary text-sm ml-auto">{total} total</span>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : subscriptions.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {subscriptions.map((sub) => (
              <Card key={sub.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-primary" />
                    <span className="text-white font-medium text-sm">
                      {sub.plan?.displayName || "Plan"}
                    </span>
                  </div>
                  <Badge variant={getStatusVariant(sub.status)}>
                    {getStatusLabel(sub.status)}
                  </Badge>
                </div>
                {sub.endDate && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar size={12} className="text-primary" />
                    <span>Vence: {formatDate(sub.endDate)}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {subscriptions.length < total && (
            <Button variant="secondary" fullWidth className="mt-4" onClick={() => setPage((p) => p + 1)}>
              Ver más
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <Crown size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No hay suscripciones</p>
        </div>
      )}
    </div>
  );
}
