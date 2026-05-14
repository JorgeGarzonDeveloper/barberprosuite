"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Scissors, AlertTriangle, CheckCircle, Info } from "lucide-react";

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

function PnLRow({
  label, value, sub, color = "text-white", indent = false, bold = false, border = false,
}: {
  label: string; value: string; sub?: string; color?: string; indent?: boolean; bold?: boolean; border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${border ? "border-t border-white/15 mt-1 pt-3.5" : ""}`}>
      <div className={indent ? "pl-4" : ""}>
        <p className={`text-sm ${bold ? "font-bold text-white" : "text-white/70"}`}>{label}</p>
        {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: revenue, isLoading: loadingRev } = useQuery({ queryKey: ["admin-revenue"], queryFn: adminApi.getRevenue, retry: false });
  const { data: bd, isLoading: loadingBD } = useQuery({ queryKey: ["admin-revenue-breakdown"], queryFn: adminApi.getRevenueBreakdown, retry: false });

  const months = Array.isArray(revenue) ? revenue : [];
  const maxRevenue = Math.max(...months.map((d: any) => d.revenue ?? 0), 1);
  const maxUsers = Math.max(...months.map((d: any) => d.newUsers ?? 0), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analíticas financieras</h1>
        <p className="text-white/40 text-sm mt-1">Estado de resultados, desglose de ingresos y crecimiento</p>
      </div>

      {/* ── ESTADO DE RESULTADOS ────────────────────────────────────────────── */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign size={18} className="text-[#c9a227]" />
          <h2 className="text-white font-bold text-lg">Estado de resultados</h2>
        </div>
        <p className="text-white/30 text-xs mb-5">Diferencia entre lo que entra, lo que es ganancia tuya y lo que le pertenece a los barberos</p>

        {loadingBD ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}</div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* INGRESOS BRUTOS */}
            <div className="pb-3">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">+ Ingresos brutos (todo lo que entró)</p>
              <PnLRow
                label="Suscripciones barberos"
                value={fmtCOP(bd?.subscriptionRevenue ?? 0)}
                sub={`${bd?.subscriptionCount ?? 0} pagos de suscripción`}
                color="text-green-400"
                indent
              />
              <PnLRow
                label="Depósitos de citas (50% + comisión)"
                value={fmtCOP(bd?.grossApptRevenue ?? 0)}
                sub={`${bd?.appointmentCount ?? 0} citas pagadas — incluye 50% para barbero + 10% tuyo`}
                color="text-green-400"
                indent
              />
              <div className="flex items-center justify-between py-2 mt-1">
                <p className="text-sm font-bold text-white">Total bruto recibido</p>
                <p className="text-base font-black text-green-400">{fmtCOP(bd?.grossTotalRevenue ?? 0)}</p>
              </div>
            </div>

            {/* MENOS OBLIGACIONES */}
            <div className="py-3">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">− Obligaciones con barberos (no es tuyo)</p>
              <PnLRow
                label="Depósitos a transferir a barberos (50%)"
                value={`− ${fmtCOP(bd?.pendingBarberPayouts ?? 0)}`}
                sub="Cada barbero recibe el 50% del servicio que tú retuviste"
                color="text-orange-400"
                indent
              />
            </div>

            {/* GANANCIA NETA */}
            <div className="pt-3">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">= Ganancia neta de la plataforma</p>
              <PnLRow
                label="Comisiones cobradas (10% de citas)"
                value={fmtCOP(bd?.commissionRevenue ?? 0)}
                sub={`Comisión del 10% sobre ${bd?.appointmentCount ?? 0} citas`}
                color="text-[#c9a227]"
                indent
              />
              <PnLRow
                label="Suscripciones (ingreso 100% tuyo)"
                value={fmtCOP(bd?.subscriptionRevenue ?? 0)}
                sub={`${bd?.subscriptionCount ?? 0} barberías suscritas`}
                color="text-[#c9a227]"
                indent
              />
              <div className="flex items-center justify-between bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-xl px-4 py-3 mt-2">
                <div>
                  <p className="text-white font-black text-base">Ganancia neta total</p>
                  <p className="text-white/40 text-xs">Suscripciones + comisiones de citas</p>
                </div>
                <p className="text-[#c9a227] text-xl font-black">{fmtCOP(bd?.totalPlatformRevenue ?? 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Alertas */}
        {!loadingBD && (
          <div className="mt-4 space-y-2">
            {(bd?.pendingRefunds ?? 0) > 0 && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span><strong>{bd!.pendingRefunds}</strong> solicitud{bd!.pendingRefunds !== 1 ? "es" : ""} de devolución pendiente{bd!.pendingRefunds !== 1 ? "s" : ""} de revisar.</span>
              </div>
            )}
            {(bd?.approvedRefunds ?? 0) > 0 && (
              <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-400 text-sm">
                <CheckCircle size={16} className="flex-shrink-0" />
                <span><strong>{bd!.approvedRefunds}</strong> devolución{bd!.approvedRefunds !== 1 ? "es" : ""} aprobada{bd!.approvedRefunds !== 1 ? "s" : ""}. Asegúrate de haber procesado el reembolso por Wompi.</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── TARJETAS RESUMEN ─────────────────────────────────────────────────── */}
      {!loadingBD && bd && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Suscripciones", value: fmtCOP(bd.subscriptionRevenue), sub: `${bd.subscriptionCount} pagos`, icon: CreditCard, color: "#f472b6", bg: "#f472b610" },
            { label: "Comisiones (10%)", value: fmtCOP(bd.commissionRevenue), sub: `${bd.appointmentCount} citas`, icon: Scissors, color: "#c9a227", bg: "#c9a22710" },
            { label: "Ganancia neta", value: fmtCOP(bd.totalPlatformRevenue), sub: "Lo que es tuyo", icon: TrendingUp, color: "#4ade80", bg: "#4ade8010" },
            { label: "Pendiente barberos", value: fmtCOP(bd.pendingBarberPayouts), sub: "Por cuadrar", icon: TrendingDown, color: "#fb923c", bg: "#fb923c10" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl p-4 border border-white/8" style={{ backgroundColor: c.bg }}>
              <div className="flex items-center gap-2 mb-2">
                <c.icon size={14} style={{ color: c.color }} />
                <p className="text-white/40 text-xs">{c.label}</p>
              </div>
              <p className="text-lg font-black" style={{ color: c.color }}>{c.value}</p>
              <p className="text-white/25 text-xs mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── CITAS RESUMEN ────────────────────────────────────────────────────── */}
      {!loadingBD && bd && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Citas pagadas", value: bd.appointmentCount, color: "#60a5fa" },
            { label: "Completadas", value: bd.completedAppointments, color: "#4ade80" },
            { label: "Canceladas", value: bd.cancelledAppointments, color: "#f87171" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value ?? 0}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── NOTA INFORMATIVA ─────────────────────────────────────────────────── */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 mb-6">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-white/60 space-y-1">
          <p><strong className="text-white/80">Suscripciones:</strong> El 100% es ganancia tuya. Barberos pagan mensualmente por usar la plataforma.</p>
          <p><strong className="text-white/80">Citas — comisión (10%):</strong> Es tu ganancia por intermediar el pago.</p>
          <p><strong className="text-white/80">Citas — depósito (50%):</strong> Lo retienes hasta cuadrar con el barbero. No es tuyo hasta deducir la comisión.</p>
          <p><strong className="text-white/80">Pago al barbero el día:</strong> El cliente paga directamente el 50% restante al barbero.</p>
        </div>
      </div>

      {/* ── INGRESOS POR MES ─────────────────────────────────────────────────── */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-white font-bold text-lg mb-1">Ganancia neta por mes</h2>
        <p className="text-white/30 text-xs mb-4">Suscripciones + comisiones de citas (lo que es 100% tuyo)</p>
        <div className="flex gap-4 mb-5">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f472b6]" /><span className="text-white/40 text-xs">Suscripciones</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#c9a227]" /><span className="text-white/40 text-xs">Comisiones citas</span></div>
        </div>

        {loadingRev ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}</div>
        ) : months.length === 0 ? (
          <p className="text-white/30 text-sm py-6 text-center">Sin datos</p>
        ) : (
          <div className="space-y-5">
            {months.map((d: any) => (
              <div key={d.month}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/50 text-xs font-semibold">{d.month}</span>
                  <span className="text-white text-sm font-bold">{fmtCOP(d.revenue ?? 0)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs w-28">Suscripciones</span>
                    <Bar value={d.subscriptionRevenue ?? 0} max={maxRevenue} color="#f472b6" />
                    <span className="text-white/30 text-xs w-24 text-right">{fmtCOP(d.subscriptionRevenue ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs w-28">Comisiones</span>
                    <Bar value={d.commissionRevenue ?? 0} max={maxRevenue} color="#c9a227" />
                    <span className="text-white/30 text-xs w-24 text-right">{fmtCOP(d.commissionRevenue ?? 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── NUEVOS USUARIOS ──────────────────────────────────────────────────── */}
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
