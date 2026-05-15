"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronDown, ChevronUp, DollarSign, Store,
  User, Calendar, Download, TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => adminApi.getPayouts(),
  });

  const { data: transactions } = useQuery({
    queryKey: ["admin-payout-transactions"],
    queryFn: () => adminApi.getPayoutTransactions(),
  });

  const barbershops: any[] = (data as any)?.barbershops ?? (Array.isArray(data) ? data : []);
  const totalOwed: number = (data as any)?.totalOwed ?? barbershops.reduce((s: number, b: any) => s + (b.totalOwed ?? b.amountOwed ?? 0), 0);
  const txList: any[] = Array.isArray(transactions) ? transactions : [];

  function handleExportCSV() {
    const rows = barbershops.map((b: any) => ({
      Barbería: b.barbershopName ?? b.name ?? "",
      Barbero: `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim(),
      Email: b.email ?? "",
      "Total a pagar (COP)": b.totalOwed ?? b.amountOwed ?? 0,
    }));
    exportCSV(rows, "cuadre-pagos.csv");
  }

  function handleExportTxCSV() {
    const rows = txList.map((t: any) => ({
      Fecha: t.date ? formatDate(t.date) : "",
      Servicio: t.service ?? t.serviceName ?? "",
      "Total cita": t.amount ?? t.totalAmount ?? 0,
      "Parte barbero": t.barberAmount ?? 0,
      "Comisión plataforma": t.commissionAmount ?? 0,
      Barbería: t.barbershopName ?? "",
    }));
    exportCSV(rows, "transacciones.csv");
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Cuadre de pagos</h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(201,162,39,0.1)] border border-primary/20 rounded-xl text-primary text-xs font-semibold hover:bg-primary/15 transition-all"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Total resumen */}
      <Card className="mb-5 bg-[rgba(201,162,39,0.06)] border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <DollarSign size={22} className="text-primary" />
          </div>
          <div>
            <p className="text-text-tertiary text-xs">Total pendiente de pago</p>
            <p className="text-2xl font-extrabold text-primary">{formatCOP(totalOwed)}</p>
          </div>
        </div>
      </Card>

      {/* Lista de barberos */}
      {barbershops.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <TrendingUp size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">Sin pagos pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {barbershops.map((b: any, i: number) => {
            const id = b.barberId ?? b.id ?? String(i);
            const expanded = expandedId === id;
            const owed = b.totalOwed ?? b.amountOwed ?? 0;
            const barberTx = txList.filter((t: any) => t.barberId === id || t.barbershopId === b.barbershopId);

            return (
              <Card key={id} padding="none">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left"
                  onClick={() => setExpandedId(expanded ? null : id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                    {(b.firstName?.[0] ?? b.name?.[0] ?? "B").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : (b.barbershopName ?? b.name ?? "Barbero")}
                    </p>
                    <p className="text-text-tertiary text-xs truncate">
                      {b.barbershopName ?? b.email ?? ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-primary font-bold text-sm">{formatCOP(owed)}</p>
                    <p className="text-text-tertiary text-xs">a pagar</p>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-text-tertiary shrink-0" /> : <ChevronDown size={16} className="text-text-tertiary shrink-0" />}
                </button>

                {expanded && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] px-4 pb-4 pt-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {b.email && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <User size={12} className="text-primary" />
                          <span className="truncate">{b.email}</span>
                        </div>
                      )}
                      {b.phone && (
                        <div className="text-xs text-text-secondary truncate">{b.phone}</div>
                      )}
                    </div>

                    {barberTx.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">Transacciones</p>
                        {barberTx.map((t: any, ti: number) => (
                          <div key={ti} className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white text-xs font-medium">{t.service ?? t.serviceName ?? "Servicio"}</span>
                              <span className="text-primary text-xs font-bold">{formatCOP(t.barberAmount ?? 0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-text-tertiary text-xs">
                              <span>{t.date ? formatDate(t.date) : ""}</span>
                              <span>Total: {formatCOP(t.amount ?? t.totalAmount ?? 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-tertiary text-xs text-center py-2">Sin transacciones detalladas</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {txList.length > 0 && (
        <button
          onClick={handleExportTxCSV}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-text-secondary text-sm hover:text-white hover:border-white/20 transition-all"
        >
          <Download size={16} /> Exportar todas las transacciones (.csv)
        </button>
      )}
    </div>
  );
}
