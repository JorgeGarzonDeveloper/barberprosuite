"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, formatDate, cn } from "@/lib/utils";
import { Crown, ChevronLeft, ChevronRight, Calendar, User, Store } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminSubscription {
  id: string;
  status: string;
  startDate?: string;
  endDate?: string;
  plan?: { name: string; displayName?: string; price?: number; priceMonthly?: number };
  barbershop?: { name: string; city: string };
  user?: { firstName: string; lastName: string; email: string };
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "text-success bg-success/10 border-success/20",
  EXPIRED: "text-error bg-error/10 border-error/20",
  TRIAL: "text-warning bg-warning/10 border-warning/20",
  CANCELLED: "text-text-tertiary bg-white/5 border-white/10",
  PENDING_PAYMENT: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activa",
  EXPIRED: "Vencida",
  TRIAL: "Trial",
  CANCELLED: "Cancelada",
  PENDING_PAYMENT: "Pago pendiente",
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page],
    queryFn: () => adminApi.getSubscriptions({ page, limit: LIMIT }),
  });

  const subscriptions = (data?.data ?? []) as AdminSubscription[];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Suscripciones</h1>
        <span className="text-text-tertiary text-sm">{total} total</span>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : subscriptions.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {subscriptions.map((sub) => (
              <Card key={sub.id} padding="sm">
                {/* Header: plan + status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown size={15} className="text-primary shrink-0" />
                    <span className="text-white font-semibold text-sm">
                      {sub.plan?.displayName ?? sub.plan?.name ?? "Plan"}
                    </span>
                    {(sub.plan?.priceMonthly ?? sub.plan?.price) && (
                      <span className="text-primary text-xs font-medium">
                        {formatCOP(sub.plan!.priceMonthly ?? sub.plan!.price ?? 0)}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full border",
                    STATUS_STYLES[sub.status] ?? STATUS_STYLES.CANCELLED
                  )}>
                    {STATUS_LABELS[sub.status] ?? sub.status}
                  </span>
                </div>

                {/* User info */}
                {sub.user && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                    <User size={11} className="text-primary shrink-0" />
                    <span className="font-medium text-white">
                      {sub.user.firstName} {sub.user.lastName}
                    </span>
                    <span className="text-text-tertiary">·</span>
                    <span className="truncate">{sub.user.email}</span>
                  </div>
                )}

                {/* Barbershop */}
                {sub.barbershop && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                    <Store size={11} className="text-primary shrink-0" />
                    <span>{sub.barbershop.name}</span>
                    {sub.barbershop.city && (
                      <span className="text-text-tertiary">· {sub.barbershop.city}</span>
                    )}
                  </div>
                )}

                {/* Dates */}
                {sub.endDate && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                    <Calendar size={11} className="text-primary shrink-0" />
                    <span>Vence: {formatDate(sub.endDate)}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-text-secondary text-sm">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
