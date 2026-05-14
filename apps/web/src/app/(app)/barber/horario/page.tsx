"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChevronDown, Info } from "lucide-react";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
interface DaySchedule { enabled: boolean; start: string; end: string; }
type Schedule = Record<DayKey, DaySchedule>;

const DAY_LABELS: Record<DayKey, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
};
const DAYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex-1">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/10 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-white text-sm font-semibold appearance-none focus:outline-none focus:border-[#c9a227]/50">
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t} className="bg-[#12121a]">{t}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
      </div>
    </div>
  );
}

export default function BarberHorarioPage() {
  const qc = useQueryClient();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<Schedule>({
    queryKey: ["barber-schedule"],
    queryFn: () => api.get("/barber/schedule").then((r) => r.data),
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (data) setSchedule(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (s: Schedule) => api.patch("/barber/schedule", s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["barber-schedule"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const updateDay = (day: DayKey, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) => prev ? { ...prev, [day]: { ...prev[day], [field]: value } } : prev);
  };

  const copyMonday = () => {
    if (!schedule) return;
    const lunes = schedule.monday;
    if (!confirm(`¿Aplicar ${lunes.start}–${lunes.end} a todos los días activos?`)) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      DAYS.forEach((d) => {
        if (updated[d].enabled) updated[d] = { ...updated[d], start: lunes.start, end: lunes.end };
      });
      return updated;
    });
  };

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto lg:pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi horario</h1>
          <p className="text-white/40 text-sm">Configura tu disponibilidad semanal</p>
        </div>
        <button
          onClick={() => schedule && mutation.mutate(schedule)}
          disabled={mutation.isPending || !schedule}
          className="bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-40 transition-all">
          {mutation.isPending ? "Guardando..." : saved ? "¡Guardado!" : "Guardar"}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5 flex gap-2">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-white/60 text-xs leading-relaxed">
          Configura los días y horarios en que estás disponible. Los clientes solo podrán reservar citas en tus horarios activos.
        </p>
      </div>

      {isLoading || !schedule ? (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {DAYS.map((day) => {
            const d = schedule[day];
            return (
              <div key={day} className={`bg-white/5 border rounded-xl p-4 transition-all ${d.enabled ? "border-white/10" : "border-white/5 opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-bold ${d.enabled ? "text-white" : "text-white/50"}`}>{DAY_LABELS[day]}</p>
                    {!d.enabled && <p className="text-red-400 text-xs mt-0.5">No laboral</p>}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={(e) => updateDay(day, "enabled", e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${d.enabled ? "bg-[#c9a227]" : "bg-white/15"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5 ${d.enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </label>
                </div>

                {d.enabled && (
                  <div className="flex items-end gap-3 mt-3 pt-3 border-t border-white/10">
                    <TimeSelect value={d.start} onChange={(v) => updateDay(day, "start", v)} label="Entrada" />
                    <div className="text-white/30 text-sm mb-2 flex-shrink-0">→</div>
                    <TimeSelect value={d.end} onChange={(v) => updateDay(day, "end", v)} label="Salida" />
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={copyMonday}
            className="flex items-center gap-2 text-[#c9a227] text-sm py-3 hover:underline">
            Copiar horario de Lunes a todos los días activos
          </button>
        </div>
      )}
    </div>
  );
}
