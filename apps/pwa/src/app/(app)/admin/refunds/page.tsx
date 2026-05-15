"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, RotateCcw, User, Calendar, MessageSquare,
  CheckCircle, XCircle, Clock, Download, ChevronRight, X,
} from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "OPEN", label: "Abiertas" },
  { value: "IN_PROGRESS", label: "En proceso" },
  { value: "RESOLVED", label: "Resueltas" },
  { value: "CLOSED", label: "Cerradas" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: "Abierta",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  IN_PROGRESS: { label: "En proceso", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  RESOLVED:    { label: "Resuelta",   color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  CLOSED:      { label: "Cerrada",    color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(iso: string) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000;
  if (secs < 60) return "Ahora";
  if (secs < 3600) return `Hace ${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `Hace ${Math.floor(secs / 3600)}h`;
  return `Hace ${Math.floor(secs / 86400)}d`;
}

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRefundsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-refunds", statusFilter],
    queryFn: () => adminApi.getRefunds({ status: statusFilter || undefined, limit: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveRefund(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-refunds"] }); setSelectedTicket(null); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectRefund(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-refunds"] }); setSelectedTicket(null); },
  });

  const tickets: any[] = (data?.data ?? []) as any[];
  const total = data?.total ?? 0;

  function handleExportCSV() {
    const rows = tickets.map((t: any) => ({
      ID: t.id,
      Asunto: t.subject ?? t.title ?? "",
      Estado: STATUS_CONFIG[t.status]?.label ?? t.status,
      Usuario: t.user ? `${t.user.firstName} ${t.user.lastName}` : "",
      Email: t.user?.email ?? "",
      Fecha: t.createdAt ? formatDate(t.createdAt) : "",
    }));
    exportCSV(rows, "devoluciones.csv");
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Devoluciones</h1>
        <span className="text-text-tertiary text-sm">{total}</span>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(201,162,39,0.1)] border border-primary/20 rounded-xl text-primary text-xs font-semibold"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all",
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
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <RotateCcw size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">Sin devoluciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => {
            const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full text-left"
              >
                <Card padding="sm" className="hover:border-[rgba(255,255,255,0.15)] transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {ticket.subject ?? ticket.title ?? `Ticket #${ticket.id?.slice(0, 8)}`}
                      </p>
                      {ticket.user && (
                        <p className="text-text-secondary text-xs mt-0.5">
                          {ticket.user.firstName} {ticket.user.lastName} · {ticket.user.email}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-text-tertiary text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{ticket.createdAt ? formatDate(ticket.createdAt) : ""}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={11} />
                      <span>{ticket.replies?.length ?? 0} respuestas</span>
                    </div>
                    <ChevronRight size={14} />
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal detalle */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111118] border border-[rgba(255,255,255,0.08)] rounded-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-white font-bold text-sm">
                  {selectedTicket.subject ?? selectedTicket.title ?? "Detalle"}
                </p>
                {selectedTicket.user && (
                  <p className="text-text-secondary text-xs mt-0.5">
                    {selectedTicket.user.firstName} {selectedTicket.user.lastName}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-text-tertiary hover:text-white shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Historial */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedTicket.replies?.length > 0 ? (
                selectedTicket.replies.map((reply: any, i: number) => (
                  <div key={i} className={cn("flex", reply.isAdmin ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      reply.isAdmin
                        ? "bg-primary/15 text-primary rounded-tr-sm"
                        : "bg-[rgba(255,255,255,0.06)] text-white rounded-tl-sm"
                    )}>
                      <p>{reply.message}</p>
                      <p className={cn("text-xs mt-1", reply.isAdmin ? "text-primary/50" : "text-text-tertiary")}>
                        {reply.createdAt ? timeAgo(reply.createdAt) : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-text-tertiary text-sm text-center py-4">Sin mensajes aún</p>
              )}
            </div>

            {/* Acciones */}
            {["OPEN", "IN_PROGRESS"].includes(selectedTicket.status) && (
              <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => rejectMutation.mutate(selectedTicket.id)}
                  loading={rejectMutation.isPending}
                  className="gap-2 text-red-400 border-red-500/20 hover:border-red-500/40"
                >
                  <XCircle size={16} /> Rechazar
                </Button>
                <Button
                  fullWidth
                  onClick={() => approveMutation.mutate(selectedTicket.id)}
                  loading={approveMutation.isPending}
                  className="gap-2"
                >
                  <CheckCircle size={16} /> Aprobar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
