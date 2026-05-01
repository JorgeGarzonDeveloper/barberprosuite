"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queueApi } from "@/lib/api/queue.api";
import { useQueueStore } from "@/store/queue.store";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn, getStatusLabel } from "@/lib/utils";
import {
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  Scissors,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function QueueDetailPage() {
  const router = useRouter();
  const { entryId } = useParams<{ entryId: string }>();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { leaveQueue, startLocationTracking, stopLocationTracking } = useQueueStore();

  const { data, isLoading } = useQuery({
    queryKey: ["queue-entry", entryId],
    queryFn: () => queueApi.getMyEntry(),
    refetchInterval: 15_000,
  });

  const entry = data?.entry;
  const isCalled = entry?.status === "CALLED";

  useEffect(() => {
    if (entryId) {
      startLocationTracking(entryId);
    }
    return () => stopLocationTracking();
  }, [entryId, startLocationTracking, stopLocationTracking]);

  const leaveMutation = useMutation({
    mutationFn: () => leaveQueue(entryId),
    onSuccess: () => {
      router.replace("/home");
    },
  });

  if (isLoading) return <PageSpinner />;

  if (!entry) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle size={48} className="text-warning" />
        <div className="text-center">
          <p className="text-white font-medium">Cola no encontrada</p>
          <p className="text-text-secondary text-sm mt-1">
            Ya no estás en ninguna cola
          </p>
        </div>
        <Button onClick={() => router.push("/home")}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Tu posición</h1>
        <Badge variant={getStatusVariant(entry.status)}>
          {getStatusLabel(entry.status)}
        </Badge>
      </div>

      {/* Called alert */}
      {isCalled && (
        <div className="mb-6 bg-[rgba(34,197,94,0.08)] border border-success/30 rounded-2xl p-5 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto mb-3 pulse-gold">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h2 className="text-success text-xl font-bold">¡Es tu turno!</h2>
          <p className="text-text-secondary text-sm mt-1">
            Dirígete a la silla de servicio
          </p>
        </div>
      )}

      {/* Position display */}
      {!isCalled && (
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-primary/60 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">
                  {entry.position}
                </span>
              </div>
            </div>
          </div>
          <p className="text-text-secondary text-sm mt-4">
            {entry.position === 1
              ? "¡Eres el siguiente!"
              : `${entry.position - 1} persona${entry.position - 1 > 1 ? "s" : ""} antes que tú`}
          </p>
        </div>
      )}

      {/* Info cards */}
      <div className="flex flex-col gap-3 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Tiempo estimado</p>
              <p className="text-white font-semibold">
                ~{entry.estimatedWaitMinutes} min
              </p>
            </div>
          </div>
        </Card>

        {entry.barbershopName && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center">
                <MapPin size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Barbería</p>
                <p className="text-white font-semibold">{entry.barbershopName}</p>
              </div>
            </div>
          </Card>
        )}

        {entry.barberName && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center">
                <Scissors size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Tu barbero</p>
                <p className="text-white font-semibold">{entry.barberName}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <p className="text-text-tertiary text-xs text-center mb-6">
        Tu posición se actualiza automáticamente cada 15 segundos
      </p>

      <Button
        variant="danger"
        fullWidth
        onClick={() => setShowLeaveModal(true)}
        className="gap-2"
      >
        <AlertTriangle size={16} />
        Abandonar cola
      </Button>

      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="¿Abandonar la cola?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary text-sm">
            Si abandonas la cola perderás tu posición y tendrás que volver a
            escanear el QR para entrar de nuevo.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowLeaveModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
            >
              Sí, salir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
