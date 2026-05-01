"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { Activity, ChevronLeft, Users, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminQueuePage() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-queues"],
    queryFn: () => adminApi.getQueues(),
    refetchInterval: 15_000,
  });

  const queues = (data?.data as Array<{
    barbershopName?: string;
    totalWaiting?: number;
    inService?: number;
    barbershopId?: string;
  }>) || [];

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Monitoreo de colas</h1>
      </div>

      <p className="text-text-tertiary text-xs mb-4">
        Actualización automática cada 15 segundos
      </p>

      {isLoading ? (
        <PageSpinner />
      ) : queues.length > 0 ? (
        <div className="flex flex-col gap-3">
          {queues.map((queue, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">
                  {queue.barbershopName || `Barbería ${i + 1}`}
                </h3>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-warning" />
                  <div>
                    <p className="text-xs text-text-tertiary">Esperando</p>
                    <p className="text-white font-semibold">{queue.totalWaiting || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-success" />
                  <div>
                    <p className="text-xs text-text-tertiary">En servicio</p>
                    <p className="text-white font-semibold">{queue.inService || 0}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <Activity size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No hay colas activas</p>
        </div>
      )}
    </div>
  );
}
