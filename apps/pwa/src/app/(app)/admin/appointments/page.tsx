"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDate, formatCOP, getStatusLabel, cn } from "@/lib/utils";
import { Calendar, ChevronLeft, MapPin, User } from "lucide-react";
import { useRouter } from "next/navigation";

const statusFilters = [
  { value: "", label: "Todas" },
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
];

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-appointments", page, statusFilter],
    queryFn: () => adminApi.getAppointments({ page, limit: 20, status: statusFilter || undefined }),
  });

  const appointments = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Citas</h1>
        <span className="text-text-tertiary text-sm ml-auto">{total} total</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0",
              statusFilter === f.value ? "bg-primary text-black" : "bg-[rgba(255,255,255,0.06)] text-text-secondary hover:text-white"
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
              <Card key={appt.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{appt.barbershop.name}</p>
                    <p className="text-text-secondary text-xs">{appt.barber.user.firstName} {appt.barber.user.lastName}</p>
                  </div>
                  <Badge variant={getStatusVariant(appt.status)}>{getStatusLabel(appt.status)}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Calendar size={12} className="text-primary" />
                  <span>{formatDate(appt.scheduledAt)}</span>
                </div>
                {appt.client && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                    <User size={12} className="text-primary" />
                    <span>{appt.client.user.firstName} {appt.client.user.lastName}</span>
                  </div>
                )}
                {appt.totalPrice && (
                  <p className="text-primary text-sm font-semibold mt-2">{formatCOP(appt.totalPrice)}</p>
                )}
              </Card>
            ))}
          </div>
          {appointments.length < total && (
            <Button variant="secondary" fullWidth className="mt-4" onClick={() => setPage((p) => p + 1)}>
              Ver más
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <Calendar size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No hay citas</p>
        </div>
      )}
    </div>
  );
}
