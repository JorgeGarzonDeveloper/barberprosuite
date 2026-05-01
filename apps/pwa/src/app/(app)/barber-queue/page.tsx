"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi } from "@/lib/api/queue.api";
import { useAuthStore } from "@/store/auth.store";
import { QueueEntry } from "@/types";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn, getStatusLabel } from "@/lib/utils";
import { Users, CheckCircle, ChevronRight, Bell, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BarberQueuePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Guard
  useEffect(() => {
    if (user && user.role === "CLIENT") {
      router.replace("/home");
    }
  }, [user, router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["barber-queue"],
    queryFn: () => queueApi.getMyQueue(),
    refetchInterval: 20_000,
  });

  const callNextMutation = useMutation({
    mutationFn: () => queueApi.callNext(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["barber-queue"] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => queueApi.completeCurrent(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["barber-queue"] }),
  });

  const queue = data?.queue || [];
  const inService = queue.find((e) => e.status === "IN_SERVICE");
  const waiting = queue.filter((e) => e.status === "WAITING");
  const called = queue.filter((e) => e.status === "CALLED");

  if (isLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Cola de espera</h1>
          {data?.barbershopName && (
            <p className="text-text-secondary text-sm">{data.barbershopName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-[rgba(255,255,255,0.04)] px-3 py-1.5 rounded-full">
          <Users size={13} />
          <span>{data?.totalWaiting || 0} esperando</span>
        </div>
      </div>

      {/* Current in service */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
          En servicio
        </h2>
        {inService ? (
          <Card className="border-primary/20 bg-[rgba(201,162,39,0.04)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center">
                <CheckCircle size={22} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  {inService.clientName || "Cliente"}
                </p>
                <p className="text-text-secondary text-xs">En servicio</p>
              </div>
            </div>
            <Button
              loading={completeMutation.isPending}
              fullWidth
              onClick={() => completeMutation.mutate()}
              className="gap-2"
            >
              <CheckCircle size={16} />
              Completar servicio
            </Button>
          </Card>
        ) : (
          <Card className="text-center py-6">
            <p className="text-text-secondary text-sm">Ningún cliente en servicio</p>
            <Button
              loading={callNextMutation.isPending}
              disabled={waiting.length === 0 && called.length === 0}
              className="mt-3 mx-auto gap-2"
              onClick={() => callNextMutation.mutate()}
            >
              <Bell size={16} />
              Llamar siguiente
            </Button>
          </Card>
        )}
      </div>

      {/* Called but not in service */}
      {called.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
            Llamados
          </h2>
          <div className="flex flex-col gap-3">
            {called.map((entry) => (
              <QueueEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* Call next button (if in service) */}
      {inService && (
        <Button
          variant="secondary"
          loading={callNextMutation.isPending}
          disabled={waiting.length === 0}
          fullWidth
          className="mb-6 gap-2"
          onClick={() => callNextMutation.mutate()}
        >
          <Bell size={16} />
          Llamar siguiente ({waiting.length})
        </Button>
      )}

      {/* Waiting list */}
      <div>
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
          Lista de espera ({waiting.length})
        </h2>
        {waiting.length > 0 ? (
          <div className="flex flex-col gap-2">
            {waiting.map((entry, i) => (
              <QueueEntryRow key={entry.id} entry={entry} position={i + 1} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-6">
            <Users size={32} className="text-text-tertiary mx-auto mb-2" />
            <p className="text-text-secondary text-sm">Cola vacía</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function QueueEntryRow({
  entry,
  position,
}: {
  entry: QueueEntry;
  position?: number;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.06)]">
      <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-sm font-bold text-text-secondary shrink-0">
        {position || entry.position}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">
          {entry.clientName || "Cliente"}
        </p>
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <Clock size={11} />
          <span>~{entry.estimatedWaitMinutes} min</span>
        </div>
      </div>
      <Badge variant={getStatusVariant(entry.status)} className="text-xs">
        {getStatusLabel(entry.status)}
      </Badge>
    </div>
  );
}
