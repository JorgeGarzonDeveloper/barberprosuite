"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.getDashboard, retry: false });
  const { data: revenue, isLoading: loadingRev } = useQuery({ queryKey: ["admin-revenue"], queryFn: adminApi.getRevenue, retry: false });
  const { data: breakdown, isLoading: loadingBD } = useQuery({ queryKey: ["admin-revenue-breakdown"], queryFn: adminApi.getRevenueBreakdown, retry: false });

  const months = Array.isArray(revenue) ? revenue : [];
  const maxRevenue = Math.max(...months.map((d: any) => d.revenue ?? 0), 1);
  const maxUsers = Math.max(...months.map((d: any) => d.newUsers ?? 0), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analíticas</h1>
        <p className="text-white/40 text-sm mt-1">Ingresos, desglose de ganancias y crecimiento</p>
      </div>

      {/* Revenue Breakdown */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-white font-bold text-lg mb-1">Desglose de ingresos de la plataforma</h2>
        <p className="text-white/30 text-sm mb-5">Diferencia entre ganancias de la plataforma vs valor que va a los barberos</p>

        {loadingBD ? (
          <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Suscripciones", value: fmtCOP(breakdown?.subscriptionRevenue ?? 0), sub: `${breakdown?.subscriptionCount ?? 0} pagos`, color: "#f472b6", border: "#f472b620" },
              { label: "Comisiones 10%", value: fmtCOP(breakdown?.commissionRevenue ?? 0), sub: `${breakdown?.appointmentCount ?? 0} citas`, color: "#c9a227", border: "#c9a22720" },
              { label: "Total plataforma", value: fmtCOP(breakdown?.totalPlatformRevenue ?? 0), sub: "Ganancia neta", color: "#4ade80", border: "#4ade8020" },
              { label: "Pago pendiente barberos", value: fmtCOP(breakdown?.pendingBarberPayouts ?? 0), sub: "Por transferir", color: "#fb923c", border: "#fb923c20" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl p-4 border" style={{ borderColor: c.border, backgroundColor: `${c.color}08` }}>
                <p className="text-white/40 text-xs mb-2">{c.label}</p>
                <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-white/30 text-xs mt-1">{c.sub}</p>
              </div>
            ))}
          </div>
        )}

        {(breakdown?.pendingRefunds ?? 0) > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
            ⚠ {breakdown!.pendingRefunds} devolución{breakdown!.pendingRefunds !== 1 ? "es" : ""} pendiente{breakdown!.pendingRefunds !== 1 ? "s" : ""} de revisión.
          </div>
        )}
      </section>

      {/* Monthly chart */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-white font-bold text-lg mb-1">Ingresos por mes</h2>
        <div className="flex gap-4 mb-5">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f472b6]" /><span className="text-white/40 text-xs">Suscripciones</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#c9a227]" /><span className="text-white/40 text-xs">Comisiones</span></div>
        </div>

        {loadingRev ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}</div>
        ) : months.length === 0 ? (
          <p className="text-white/30 text-sm py-6 text-center">Sin datos</p>
        ) : (
          <div className="space-y-4">
            {months.map((d: any) => (
              <div key={d.month} className="flex items-center gap-4">
                <span className="text-white/40 text-xs w-12 flex-shrink-0">{d.month}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Bar value={d.subscriptionRevenue ?? 0} max={maxRevenue} color="#f472b6" />
                    <span className="text-white/30 text-xs w-28 text-right">{fmtCOP(d.subscriptionRevenue ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bar value={d.commissionRevenue ?? 0} max={maxRevenue} color="#c9a227" />
                    <span className="text-white/30 text-xs w-28 text-right">{fmtCOP(d.commissionRevenue ?? 0)}</span>
                  </div>
                </div>
                <span className="text-white text-sm font-bold w-28 text-right flex-shrink-0">{fmtCOP(d.revenue ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New users */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-bold text-lg mb-5">Nuevos usuarios por mes</h2>
        {loadingRev ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {months.map((d: any) => (
              <div key={d.month} className="flex items-center gap-4">
                <span className="text-white/40 text-xs w-12 flex-shrink-0">{d.month}</span>
                <Bar value={d.newUsers ?? 0} max={maxUsers} color="#60a5fa" />
                <span className="text-white/40 text-xs w-20 text-right">{d.newUsers ?? 0} usuarios</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
