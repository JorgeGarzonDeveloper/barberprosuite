"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/lib/api/appointments.api";
import { useAuthStore } from "@/store/auth.store";
import { Appointment, AppointmentStatus } from "@/types";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatCOP, getStatusLabel, cn } from "@/lib/utils";

const statusFilters = [
  { value: "", label: "Todas" },
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
];

function AppointmentCard({
  appointment,
  role,
  onAction,
}: {
  appointment: Appointment;
  role: string;
  onAction: (id: string, action: "cancel" | "confirm" | "complete") => void;
}) {
  const isClient = role === "CLIENT";
  const canCancel = ["PENDING", "CONFIRMED"].includes(appointment.status);
  const canConfirm = !isClient && appointment.status === "PENDING";
  const canComplete = !isClient && ["CONFIRMED", "IN_PROGRESS"].includes(appointment.status);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-white text-sm">
            {appointment.barbershop.name}
          </p>
          {isClient ? (
            <p className="text-text-secondary text-xs mt-0.5">
              {appointment.barber.user.firstName}{" "}
              {appointment.barber.user.lastName}
            </p>
          ) : (
            appointment.client && (
              <p className="text-text-secondary text-xs mt-0.5">
                {appointment.client.user.firstName}{" "}
                {appointment.client.user.lastName}
              </p>
            )
          )}
        </div>
        <Badge variant={getStatusVariant(appointment.status)}>
          {getStatusLabel(appointment.status)}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Calendar size={13} className="text-primary" />
          <span>{formatDate(appointment.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <MapPin size={13} className="text-primary" />
          <span className="truncate">{appointment.barbershop.address}</span>
        </div>
        {appointment.totalDurationMinutes && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Clock size={13} className="text-primary" />
            <span>{appointment.totalDurationMinutes} min</span>
          </div>
        )}
      </div>

      {appointment.serviceNames && appointment.serviceNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {appointment.serviceNames.map((s, i) => (
            <span
              key={i}
              className="bg-[rgba(255,255,255,0.06)] text-text-secondary text-xs px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {appointment.totalPrice && (
        <p className="text-primary font-semibold text-sm">
          {formatCOP(appointment.totalPrice)}
        </p>
      )}

      {/* Refund info for cancelled appointments */}
      {appointment.status === "CANCELLED" && isClient && appointment.totalPrice && (
        <div className="flex items-start gap-2 bg-[rgba(255,165,0,0.08)] border border-orange-500/20 rounded-xl p-3">
          <AlertCircle size={13} className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-300 text-xs font-semibold">Devolución</p>
            <p className="text-text-secondary text-xs mt-0.5">
              Puedes solicitar la devolución de hasta el 80% del valor pagado si cancelaste con más de 24h de anticipación (50% si fue menos de 24h).
            </p>
            <a href="/support" className="text-primary text-xs font-semibold mt-1 inline-block hover:underline">
              Solicitar devolución →
            </a>
          </div>
        </div>
      )}

      {(canCancel || canConfirm || canComplete) && (
        <div className="flex gap-2 pt-1 border-t border-[rgba(255,255,255,0.06)]">
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onAction(appointment.id, "cancel")}
              className="flex-1 gap-1.5"
            >
              <XCircle size={14} />
              Cancelar
            </Button>
          )}
          {canConfirm && (
            <Button
              size="sm"
              onClick={() => onAction(appointment.id, "confirm")}
              className="flex-1 gap-1.5"
            >
              <CheckCircle size={14} />
              Confirmar
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              onClick={() => onAction(appointment.id, "complete")}
              className="flex-1 gap-1.5"
            >
              <CheckCircle size={14} />
              Completar
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"client" | "barber">(
    user?.role === "CLIENT" ? "client" : "barber"
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", activeTab, statusFilter, page],
    queryFn: () => {
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
      };
      return activeTab === "client"
        ? appointmentsApi.getMy(params)
        : appointmentsApi.getBarber(params);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "cancel" | "confirm" | "complete";
    }) => {
      if (action === "cancel") return appointmentsApi.cancel(id);
      if (action === "confirm") return appointmentsApi.confirm(id);
      return appointmentsApi.complete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const appointments = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-white mb-4">Citas</h1>

      {/* Role tabs - show if barber/admin */}
      {user?.role !== "CLIENT" && (
        <div className="flex bg-[rgba(255,255,255,0.04)] rounded-xl p-1 mb-4">
          <button
            onClick={() => {
              setActiveTab("client");
              setPage(1);
            }}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "client"
                ? "bg-primary text-black"
                : "text-text-secondary"
            )}
          >
            Mis citas
          </button>
          <button
            onClick={() => {
              setActiveTab("barber");
              setPage(1);
            }}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "barber"
                ? "bg-primary text-black"
                : "text-text-secondary"
            )}
          >
            Citas de clientes
          </button>
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0",
              statusFilter === f.value
                ? "bg-primary text-black"
                : "bg-[rgba(255,255,255,0.06)] text-text-secondary hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : appointments.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                role={activeTab === "client" ? "CLIENT" : "BARBER"}
                onAction={(id, action) =>
                  actionMutation.mutate({ id, action })
                }
              />
            ))}
          </div>
          {appointments.length < total && (
            <Button
              variant="secondary"
              fullWidth
              className="mt-4"
              onClick={() => setPage((p) => p + 1)}
            >
              Ver más ({total - appointments.length} restantes)
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-4">
          <Calendar size={48} className="text-text-tertiary" />
          <div className="text-center">
            <p className="text-white font-medium">No hay citas</p>
            <p className="text-text-secondary text-sm mt-1">
              {statusFilter
                ? "No hay citas con ese filtro"
                : "Aún no tienes citas registradas"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
