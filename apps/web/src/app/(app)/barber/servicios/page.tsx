"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Scissors, Clock, Pencil, Trash2, X, Info } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

interface ServiceFormProps {
  visible: boolean;
  service?: Service | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

function ServiceForm({ visible, service, onClose, onSave, isSaving }: ServiceFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (visible) {
      setName(service?.name ?? "");
      setDescription(service?.description ?? "");
      setDuration(String(service?.durationMinutes ?? 30));
      setPrice(service ? String(service.price) : "");
    }
  }, [visible, service]);

  const canSave = name.trim().length >= 2 && Number(price) > 0 && Number(duration) > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), description: description.trim(), durationMinutes: parseInt(duration), price: parseFloat(price) });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
      <div className="bg-[#12121a] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6">
        <div className="w-10 h-1 bg-white/20 rounded mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">{service ? "Editar servicio" : "Nuevo servicio"}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-white/40 text-xs font-semibold block mb-1">Nombre del servicio *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
              placeholder="Ej: Corte de cabello"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50" />
          </div>

          <div>
            <label className="text-white/40 text-xs font-semibold block mb-1">Descripción (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={2}
              placeholder="Describe el servicio..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs font-semibold block mb-1">Duración (min) *</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" min={1} maxLength={4}
                placeholder="30"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs font-semibold block mb-1">Precio (COP) *</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0}
                placeholder="25000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50" />
            </div>
          </div>

          {Number(price) > 0 && (
            <div className="bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl px-3 py-2 flex gap-2 items-center">
              <Info size={14} className="text-[#c9a227]" />
              <p className="text-[#c9a227] text-xs">Comisión de reserva: {fmtCOP(Math.max(Number(price) * 0.1, 2000))}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 border border-white/15 rounded-xl text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!canSave || isSaving}
              className="flex-1 py-3 bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold rounded-xl text-sm disabled:opacity-40 transition-all">
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BarberServiciosPage() {
  const qc = useQueryClient();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["barber-services"],
    queryFn: () => api.get("/barber/services").then((r) => r.data.data ?? r.data),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => api.post("/barber/services", dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["barber-services"] }); setFormVisible(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => api.patch(`/barber/services/${id}`, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["barber-services"] }); setFormVisible(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/barber/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barber-services"] }),
  });

  const handleSave = (dto: any) => {
    if (editing) updateMutation.mutate({ id: editing.id, dto });
    else createMutation.mutate(dto);
  };

  const handleDelete = (s: Service) => {
    if (!confirm(`¿Eliminar "${s.name}"? Los clientes ya no podrán reservarlo.`)) return;
    deleteMutation.mutate(s.id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="px-4 pt-6 pb-8 max-w-2xl mx-auto lg:pt-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Mis servicios</h1>
        <button onClick={() => { setEditing(null); setFormVisible(true); }}
          className="w-9 h-9 bg-[#c9a227] rounded-xl flex items-center justify-center hover:bg-[#e8cc6a] transition-colors">
          <Plus size={20} className="text-black" />
        </button>
      </div>

      <div className="bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl p-3 flex gap-2 mb-5">
        <Info size={14} className="text-[#c9a227] flex-shrink-0 mt-0.5" />
        <p className="text-white/60 text-xs leading-relaxed">
          Define los servicios que ofreces con precio y duración. Los clientes los verán al agendar citas.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#c9a227]/10 border-2 border-[#c9a227]/20 flex items-center justify-center mx-auto mb-4">
            <Scissors size={36} className="text-[#c9a227]" />
          </div>
          <p className="text-white font-semibold mb-1">Sin servicios aún</p>
          <p className="text-white/40 text-sm mb-4">Agrega los servicios que ofreces para que los clientes puedan reservar contigo.</p>
          <button onClick={() => { setEditing(null); setFormVisible(true); }}
            className="bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            + Agregar primer servicio
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-white/40 text-xs mb-2">{services.length} servicio{services.length !== 1 ? "s" : ""}</p>
          {services.map((s) => (
            <div key={s.id} className={`flex items-center bg-[#12121a] border border-white/10 rounded-xl overflow-hidden ${!s.isActive ? "opacity-55" : ""}`}>
              <div className="w-14 flex items-center justify-center py-4 bg-[#c9a227]/5">
                <div className="w-9 h-9 rounded-full bg-[#c9a227]/10 flex items-center justify-center">
                  <Scissors size={18} className={s.isActive ? "text-[#c9a227]" : "text-white/30"} />
                </div>
              </div>
              <div className="flex-1 py-3 px-2">
                <div className="flex items-center gap-2">
                  <p className={`font-bold text-sm ${s.isActive ? "text-white" : "text-white/50"}`}>{s.name}</p>
                  {!s.isActive && <span className="text-xs bg-white/10 text-white/40 px-1.5 py-0.5 rounded">Inactivo</span>}
                </div>
                {s.description && <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{s.description}</p>}
                <div className="flex gap-3 mt-1">
                  <span className="text-white/40 text-xs flex items-center gap-1"><Clock size={10} />{s.durationMinutes} min</span>
                  <span className="text-[#c9a227] text-xs font-bold">{fmtCOP(s.price)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 pr-3 py-3">
                <button onClick={() => { setEditing(s); setFormVisible(true); }}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Pencil size={14} className="text-white/50" />
                </button>
                <button onClick={() => handleDelete(s)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                  <Trash2 size={14} className="text-red-400/70" />
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => { setEditing(null); setFormVisible(true); }}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-xl text-[#c9a227] font-bold text-sm hover:bg-[#c9a227]/20 transition-colors mt-2">
            <Plus size={16} /> Nuevo servicio
          </button>
        </div>
      )}

      <ServiceForm
        visible={formVisible}
        service={editing}
        onClose={() => { setFormVisible(false); setEditing(null); }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
