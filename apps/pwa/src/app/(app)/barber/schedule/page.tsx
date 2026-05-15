"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { barberApi } from "@/lib/api/barber.api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { ChevronLeft, Clock, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const DAYS = [
  { key: "MONDAY",    label: "Lunes" },
  { key: "TUESDAY",   label: "Martes" },
  { key: "WEDNESDAY", label: "Miércoles" },
  { key: "THURSDAY",  label: "Jueves" },
  { key: "FRIDAY",    label: "Viernes" },
  { key: "SATURDAY",  label: "Sábado" },
  { key: "SUNDAY",    label: "Domingo" },
];

const TIMES: string[] = [];
for (let h = 5; h <= 23; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

interface DaySchedule {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((d) => ({
  dayOfWeek: d.key,
  isOpen: !["SUNDAY"].includes(d.key),
  openTime: "09:00",
  closeTime: "18:00",
}));

export default function BarberSchedulePage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["barber-schedule"],
    queryFn: () => barberApi.getSchedule(),
    retry: false,
  });

  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      const merged = DEFAULT_SCHEDULE.map((def) => {
        const found = (data as any[]).find((d: any) => d.dayOfWeek === def.dayOfWeek);
        return found ? { ...def, ...found } : def;
      });
      setSchedule(merged);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => barberApi.updateSchedule(schedule),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function toggleDay(dayKey: string) {
    setSchedule((s) => s.map((d) => d.dayOfWeek === dayKey ? { ...d, isOpen: !d.isOpen } : d));
  }

  function updateTime(dayKey: string, field: "openTime" | "closeTime", value: string) {
    setSchedule((s) => s.map((d) => d.dayOfWeek === dayKey ? { ...d, [field]: value } : d));
  }

  function copyMondayToAll() {
    const monday = schedule.find((d) => d.dayOfWeek === "MONDAY");
    if (!monday) return;
    setSchedule((s) => s.map((d) => d.isOpen ? { ...d, openTime: monday.openTime, closeTime: monday.closeTime } : d));
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Mi horario</h1>
        <button
          onClick={copyMondayToAll}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl text-text-secondary text-xs hover:text-white transition-colors"
        >
          <Copy size={13} /> Copiar Lunes
        </button>
      </div>

      {saved && (
        <div className="mb-4 bg-[rgba(34,197,94,0.1)] border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <Check size={15} className="text-success" />
          <p className="text-success text-sm font-medium">Horario guardado correctamente</p>
        </div>
      )}

      <p className="text-text-tertiary text-xs mb-4">
        Activa los días que trabajas y define tu horario de atención.
      </p>

      <div className="space-y-3 mb-6">
        {DAYS.map((day) => {
          const dayData = schedule.find((d) => d.dayOfWeek === day.key)!;
          return (
            <Card key={day.key} padding="sm">
              {/* Toggle de día */}
              <div className="flex items-center justify-between mb-3">
                <span className={cn("font-semibold text-sm", dayData.isOpen ? "text-white" : "text-text-tertiary")}>
                  {day.label}
                </span>
                <button
                  onClick={() => toggleDay(day.key)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-all",
                    dayData.isOpen ? "bg-primary" : "bg-[rgba(255,255,255,0.15)]"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    dayData.isOpen ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              {dayData.isOpen && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-text-tertiary text-xs mb-1.5 flex items-center gap-1">
                      <Clock size={11} /> Apertura
                    </label>
                    <select
                      value={dayData.openTime}
                      onChange={(e) => updateTime(day.key, "openTime", e.target.value)}
                      className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40 appearance-none"
                    >
                      {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-text-tertiary text-xs mb-1.5 flex items-center gap-1">
                      <Clock size={11} /> Cierre
                    </label>
                    <select
                      value={dayData.closeTime}
                      onChange={(e) => updateTime(day.key, "closeTime", e.target.value)}
                      className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40 appearance-none"
                    >
                      {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {!dayData.isOpen && (
                <p className="text-text-tertiary text-xs">No trabajo este día</p>
              )}
            </Card>
          );
        })}
      </div>

      <Button fullWidth onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} className="gap-2">
        <Check size={16} /> Guardar horario
      </Button>
    </div>
  );
}
