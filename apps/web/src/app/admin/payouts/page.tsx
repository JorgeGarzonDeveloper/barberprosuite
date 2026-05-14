"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { ChevronDown, ChevronUp, FileSpreadsheet, Download } from "lucide-react";
import { exportPayoutsExcel, exportTransactionsExcel } from "@/lib/excel-export";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function PayoutsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: payouts, isLoading } = useQuery<any[]>({
    queryKey: ["admin-payouts"],
    queryFn: adminApi.getPayouts,
    retry: false,
  });

  const totalPending = (payouts ?? []).reduce((s, b) => s + b.totalOwed, 0);

  const [exportingTx, setExportingTx] = useState(false);

  const handleExportBarbers = () => {
    if (!payouts || payouts.length === 0) return;
    exportPayoutsExcel(payouts);
  };

  const handleExportAllTransactions = async () => {
    setExportingTx(true);
    try {
      const txs = await adminApi.getTransactionsExport();
      if (txs.length) exportTransactionsExcel(txs);
    } catch { /* ok */ } finally {
      setExportingTx(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cuadre de pagos</h1>
          <p className="text-white/40 text-sm mt-1">Montos pendientes de transferir a barberos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportBarbers}
            disabled={!payouts?.length}
            className="flex items-center gap-2 px-4 py-2 bg-[#c9a227]/15 border border-[#c9a227]/30 text-[#c9a227] rounded-xl text-sm font-semibold hover:bg-[#c9a227]/25 transition-all disabled:opacity-40"
          >
            <FileSpreadsheet size={15} />
            Cuadre Excel
          </button>
          <button
            onClick={handleExportAllTransactions}
            disabled={exportingTx}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl text-sm font-semibold hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <Download size={15} />
            {exportingTx ? "Generando..." : "Todas las transacciones (.xlsx)"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-[#c9a227]/70 text-sm mb-1">Total a transferir</p>
          <p className="text-[#c9a227] text-3xl font-bold">{fmtCOP(totalPending)}</p>
          <p className="text-white/30 text-xs mt-1">{(payouts ?? []).length} barbero{(payouts ?? []).length !== 1 ? "s" : ""}</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-[#c9a227]/20 flex items-center justify-center">
          <span className="text-[#c9a227] text-2xl font-bold">$</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : !payouts || payouts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/30">Sin pagos pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((b) => {
            const isOpen = expanded === b.barberId;
            return (
              <div key={b.barberId} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : b.barberId)}
                >
                  <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center text-[#c9a227] font-bold flex-shrink-0">
                    {b.firstName?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{b.firstName} {b.lastName}</p>
                    <p className="text-[#c9a227]/70 text-xs">{b.barbershopName}</p>
                    <p className="text-white/30 text-xs">{b.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-400 font-bold text-base">{fmtCOP(b.totalOwed)}</p>
                    <p className="text-white/30 text-xs">{b.transactions.length} cita{b.transactions.length !== 1 ? "s" : ""}</p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={16} className="text-white/30 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-3">
                    <div className="space-y-2 mb-3">
                      {b.transactions.map((tx: any) => (
                        <div key={tx.paymentId} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div>
                            <p className="text-white/80 text-sm font-medium">{tx.service}</p>
                            <p className="text-white/30 text-xs">{fmt(tx.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 text-sm font-bold">{fmtCOP(tx.barberAmount)}</p>
                            <p className="text-white/30 text-xs">Total cita: {fmtCOP(tx.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                      <span className="text-white/60 text-sm font-semibold">Total a transferir</span>
                      <span className="text-green-400 text-lg font-bold">{fmtCOP(b.totalOwed)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
