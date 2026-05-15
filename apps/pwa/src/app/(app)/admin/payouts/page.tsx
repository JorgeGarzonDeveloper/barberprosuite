"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronDown, ChevronUp, DollarSign,
  User, Download, TrendingUp, CheckCircle, Clock,
  AlertCircle, Paperclip, Loader2, Image as ImageIcon,
  Trash2, Plus,
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

const STATUS_TABS = [
  { value: "PENDING", label: "Pendientes", icon: AlertCircle, color: "text-warning" },
  { value: "IN_PROGRESS", label: "En transacción", icon: Clock, color: "text-primary" },
  { value: "PAID", label: "Pagadas", icon: CheckCircle, color: "text-success" },
];

const RECORD_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:     { label: "Pendiente",       color: "text-warning",  bg: "bg-warning/10",  border: "border-warning/20" },
  IN_PROGRESS: { label: "En transacción",  color: "text-primary",  bg: "bg-primary/10",  border: "border-primary/20" },
  PAID:        { label: "Pagado",           color: "text-success",  bg: "bg-success/10",  border: "border-success/20" },
};

export default function AdminPayoutsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"PENDING" | "IN_PROGRESS" | "PAID">("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal: create payout record
  const [createModal, setCreateModal] = useState<{ barberId: string; barbershopId?: string; totalOwed: number; name: string } | null>(null);
  const [createAmount, setCreateAmount] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  // Proof upload
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProofId, setUploadingProofId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => adminApi.getPayouts(),
  });

  const barbershops: any[] = (data as any)?.barbershops ?? [];
  const totalOwed: number = (data as any)?.totalOwed ?? 0;
  const payoutRecords: any[] = (data as any)?.payoutRecords ?? [];

  // Filter records by tab
  const tabRecords = payoutRecords.filter((r: any) => r.status === activeTab);

  const createMutation = useMutation({
    mutationFn: () => adminApi.createPayoutRecord({
      barberId: createModal!.barberId,
      barbershopId: createModal!.barbershopId,
      amount: parseFloat(createAmount) || createModal!.totalOwed,
      notes: createNotes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      setCreateModal(null);
      setCreateAmount("");
      setCreateNotes("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updatePayoutRecord(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payouts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePayoutRecord(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payouts"] }),
  });

  async function handleProofUpload(recordId: string, file: File) {
    setUploadingProofId(recordId);
    try {
      await adminApi.uploadPayoutProof(recordId, file);
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    } finally {
      setUploadingProofId(null);
    }
  }

  function handleExportCSV() {
    const rows = barbershops.map((b: any) => ({
      Barbero: `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim(),
      Email: b.email ?? "",
      Barbería: b.barbershopName ?? "",
      "Total ganado (COP)": b.totalEarned ?? 0,
      "Total pagado (COP)": b.totalPaid ?? 0,
      "Saldo pendiente (COP)": b.totalOwed ?? 0,
    }));
    exportCSV(rows, "cuadre-pagos.csv");
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

      {/* Barberos con saldo — sección colapsable */}
      {barbershops.length > 0 && (
        <div className="mb-6">
          <p className="text-text-tertiary text-xs font-semibold uppercase tracking-wide mb-3">Barberos</p>
          <div className="space-y-2">
            {barbershops.map((b: any, i: number) => {
              const id = b.barberId ?? String(i);
              const expanded = expandedId === id;
              const owed = b.totalOwed ?? 0;

              return (
                <Card key={id} padding="none">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setExpandedId(expanded ? null : id)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                      {(b.firstName?.[0] ?? "B").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {b.firstName} {b.lastName}
                      </p>
                      <p className="text-text-tertiary text-xs truncate">{b.barbershopName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-bold text-sm", owed > 0 ? "text-primary" : "text-success")}>
                        {formatCOP(owed)}
                      </p>
                      <p className="text-text-tertiary text-xs">pendiente</p>
                    </div>
                    {expanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                  </button>

                  {expanded && (
                    <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="bg-white/5 rounded-xl p-2">
                          <p className="text-white text-xs font-bold">{formatCOP(b.totalEarned ?? 0)}</p>
                          <p className="text-text-tertiary text-[10px] mt-0.5">Ganado</p>
                        </div>
                        <div className="bg-success/10 rounded-xl p-2">
                          <p className="text-success text-xs font-bold">{formatCOP(b.totalPaid ?? 0)}</p>
                          <p className="text-text-tertiary text-[10px] mt-0.5">Pagado</p>
                        </div>
                        <div className="bg-primary/10 rounded-xl p-2">
                          <p className="text-primary text-xs font-bold">{formatCOP(owed)}</p>
                          <p className="text-text-tertiary text-[10px] mt-0.5">Pendiente</p>
                        </div>
                      </div>

                      {owed > 0 && (
                        <button
                          onClick={() => {
                            setCreateModal({ barberId: id, barbershopId: b.barbershopId, totalOwed: owed, name: `${b.firstName} ${b.lastName}` });
                            setCreateAmount(String(owed));
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-semibold hover:bg-primary/15 transition-all"
                        >
                          <Plus size={13} /> Registrar pago
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs: registros de pagos */}
      <div className="flex bg-white/[0.04] rounded-xl p-1 mb-4">
        {STATUS_TABS.map((tab) => {
          const count = payoutRecords.filter((r: any) => r.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                activeTab === tab.value ? "bg-primary text-black" : "text-text-secondary hover:text-white"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "min-w-[16px] h-4 rounded-full text-[10px] flex items-center justify-center px-1",
                  activeTab === tab.value ? "bg-black/20 text-black" : "bg-white/10 text-text-secondary"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Records list */}
      {tabRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8 gap-3">
          <TrendingUp size={36} className="text-text-tertiary" />
          <p className="text-text-secondary text-sm">Sin registros en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabRecords.map((record: any) => {
            const cfg = RECORD_STATUS_CONFIG[record.status] ?? RECORD_STATUS_CONFIG.PENDING;
            const barberName = record.barber?.user
              ? `${record.barber.user.firstName} ${record.barber.user.lastName}`
              : "Barbero";

            return (
              <Card key={record.id} padding="sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{barberName}</p>
                    {record.barbershop && (
                      <p className="text-text-tertiary text-xs">{record.barbershop.name}</p>
                    )}
                    {record.notes && (
                      <p className="text-text-secondary text-xs mt-1 italic">"{record.notes}"</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-primary font-bold text-sm">{formatCOP(record.amount)}</p>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color, cfg.bg, cfg.border)}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                <p className="text-text-tertiary text-xs mb-3">{formatDate(record.createdAt)}</p>

                {/* Proof image */}
                {record.proofUrl && (
                  <a href={record.proofUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline mb-3"
                  >
                    <ImageIcon size={12} /> Ver comprobante
                  </a>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  {/* Upload proof */}
                  <button
                    onClick={() => {
                      if (proofInputRef.current) {
                        proofInputRef.current.dataset.recordId = record.id;
                        proofInputRef.current.click();
                      }
                    }}
                    disabled={uploadingProofId === record.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-text-secondary hover:text-white text-xs transition-colors disabled:opacity-50"
                  >
                    {uploadingProofId === record.id ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                    Comprobante
                  </button>

                  {/* Status progression */}
                  {record.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => updateMutation.mutate({ id: record.id, status: "PAID" })}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg text-success text-xs font-semibold hover:bg-success/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={12} /> Marcar pagado
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar este registro?")) deleteMutation.mutate(record.id);
                    }}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 bg-error/10 border border-error/20 rounded-lg text-error text-xs hover:bg-error/20 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Hidden file input for proof upload */}
      <input
        ref={proofInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const recordId = (e.target as HTMLInputElement).dataset.recordId;
          if (file && recordId) handleProofUpload(recordId, file);
          e.target.value = "";
        }}
      />

      {/* Create payout record modal */}
      <Modal
        isOpen={!!createModal}
        onClose={() => { setCreateModal(null); setCreateAmount(""); setCreateNotes(""); }}
        title="Registrar pago"
      >
        {createModal && (
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary text-sm">
              Registrar pago a <span className="text-white font-semibold">{createModal.name}</span>
            </p>

            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Monto (COP)</label>
              <input
                type="number"
                value={createAmount}
                onChange={(e) => setCreateAmount(e.target.value)}
                placeholder={String(createModal.totalOwed)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-text-tertiary text-xs mt-1">Saldo pendiente: {formatCOP(createModal.totalOwed)}</p>
            </div>

            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Notas (opcional)</label>
              <textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Ej: Transferencia Bancolombia #123456"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <Button
              fullWidth
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Registrar en transacción
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
