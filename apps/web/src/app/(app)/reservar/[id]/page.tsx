"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChevronLeft, Clock, Scissors, Calendar, ChevronRight } from "lucide-react";
import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function ReservarPage() {
  const { id: barbershopId } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  const { data: services } = useQuery({
    queryKey: ["book-services", barbershopId],
    queryFn: () => api.get(`/barbershops/${barbershopId}/services`).then((r) => r.data.data ?? []),
    retry: false,
  });

  const { data: barbers } = useQuery({
    queryKey: ["book-barbers", barbershopId],
    queryFn: () => api.get(`/users/barbers?barbershopId=${barbershopId}`).then((r) => r.data.data ?? []),
    retry: false,
  });

  const { data: slots } = useQuery({
    queryKey: ["book-slots", selectedBarber?.id, format(selectedDate, "yyyy-MM-dd")],
    queryFn: () =>
      api.get(`/appointments/available-slots?barberId=${selectedBarber.id}&date=${format(selectedDate, "yyyy-MM-dd")}&serviceId=${selectedService?.id}`)
        .then((r) => r.data.data ?? [])
        .catch(() => []),
    enabled: !!selectedBarber && !!selectedDate,
    retry: false,
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const handleBook = async () => {
    if (!selectedService || !selectedBarber || !selectedSlot) return;
    setBooking(true);
    setError("");
    try {
      const res = await api.post("/appointments", {
        barbershopId,
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        scheduledAt: selectedSlot,
      });
      const appt = res.data.data;
      if (appt?.paymentUrl) {
        window.location.href = appt.paymentUrl;
      } else {
        router.push("/citas");
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al reservar. Intenta de nuevo.");
    } finally {
      setBooking(false);
    }
  };

  const depositAmount = selectedService ? Math.ceil(selectedService.price * 0.5) : 0;
  const commissionAmount = selectedService ? Math.ceil(selectedService.price * 0.1) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Reservar cita</h1>
          <p className="text-white/30 text-xs">Paso {step} de 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? "bg-[#c9a227]" : "bg-white/10"}`} />
        ))}
      </div>

      {/* Step 1: Service */}
      {step === 1 && (
        <div>
          <h2 className="text-white font-bold mb-4">Selecciona el servicio</h2>
          <div className="space-y-2">
            {(services ?? []).map((s: any) => (
              <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${selectedService?.id === s.id ? "border-[#c9a227] bg-[#c9a227]/10" : "border-white/10 bg-white/5 hover:border-[#c9a227]/30"}`}>
                <div>
                  <p className="text-white font-semibold">{s.name}</p>
                  {s.description && <p className="text-white/40 text-xs mt-0.5">{s.description}</p>}
                  {s.durationMinutes && <p className="text-white/30 text-xs mt-0.5 flex items-center gap-1"><Clock size={10} />{s.durationMinutes} min</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-[#c9a227] font-bold">{fmtCOP(s.price ?? 0)}</p>
                  <ChevronRight size={14} className="text-white/20 ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Barber + Date + Time */}
      {step === 2 && (
        <div>
          <h2 className="text-white font-bold mb-4">Barbero, fecha y hora</h2>

          <p className="text-white/40 text-xs font-bold uppercase mb-2">Barbero</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {(barbers ?? []).map((b: any) => (
              <button key={b.id} onClick={() => setSelectedBarber(b)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border min-w-[80px] flex-shrink-0 transition-all ${selectedBarber?.id === b.id ? "border-[#c9a227] bg-[#c9a227]/10" : "border-white/10 bg-white/5 hover:border-[#c9a227]/30"}`}>
                <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 overflow-hidden flex items-center justify-center">
                  {b.user?.avatarUrl
                    ? <img src={b.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[#c9a227] font-bold">{b.user?.firstName?.[0]}</span>}
                </div>
                <p className="text-white text-xs font-medium text-center">{b.user?.firstName}</p>
              </button>
            ))}
          </div>

          <p className="text-white/40 text-xs font-bold uppercase mb-2">Fecha</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {days.map((d) => (
              <button key={d.toISOString()} onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border min-w-[56px] flex-shrink-0 transition-all ${isSameDay(selectedDate, d) ? "border-[#c9a227] bg-[#c9a227]/10" : "border-white/10 bg-white/5 hover:border-[#c9a227]/30"}`}>
                <span className={`text-xs ${isSameDay(selectedDate, d) ? "text-[#c9a227]" : "text-white/30"}`}>{format(d, "EEE", { locale: es })}</span>
                <span className={`text-base font-bold ${isSameDay(selectedDate, d) ? "text-[#c9a227]" : "text-white"}`}>{format(d, "d")}</span>
              </button>
            ))}
          </div>

          {selectedBarber && (
            <>
              <p className="text-white/40 text-xs font-bold uppercase mb-2">Hora disponible</p>
              {!slots?.length
                ? <p className="text-white/30 text-sm py-4 text-center">Sin disponibilidad este día</p>
                : (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {(slots ?? []).map((slot: string) => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-xl text-sm border transition-all ${selectedSlot === slot ? "border-[#c9a227] bg-[#c9a227]/10 text-[#c9a227] font-bold" : "border-white/10 bg-white/5 text-white/60 hover:border-[#c9a227]/30"}`}>
                        {new Date(slot).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    ))}
                  </div>
                )}
            </>
          )}

          <button onClick={() => setStep(3)} disabled={!selectedBarber || !selectedSlot}
            className="w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3 rounded-xl disabled:opacity-30 transition-all">
            Continuar →
          </button>
        </div>
      )}

      {/* Step 3: Confirm + Pay */}
      {step === 3 && selectedService && selectedBarber && selectedSlot && (
        <div>
          <h2 className="text-white font-bold mb-4">Confirmar y pagar</h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 mb-4">
            <Row label="Servicio" value={selectedService.name} />
            <Row label="Barbero" value={`${selectedBarber.user?.firstName} ${selectedBarber.user?.lastName}`} />
            <Row label="Fecha" value={format(new Date(selectedSlot), "EEEE d 'de' MMMM", { locale: es })} />
            <Row label="Hora" value={new Date(selectedSlot).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} />
            <div className="border-t border-white/10 pt-3 space-y-2">
              <Row label="Valor del servicio" value={fmtCOP(selectedService.price)} />
              <Row label="Pago ahora (50%)" value={fmtCOP(depositAmount)} gold />
              <Row label="Comisión plataforma (10%)" value={fmtCOP(commissionAmount)} />
              <Row label="Pago al barbero el día del servicio" value={fmtCOP(depositAmount)} />
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-300 text-xs mb-4">
            Pagarás <strong>{fmtCOP(depositAmount + commissionAmount)}</strong> ahora (50% del servicio + comisión de plataforma). El restante lo pagas al barbero el día de la cita.
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-4">{error}</div>}

          <button onClick={handleBook} disabled={booking}
            className="w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3 rounded-xl disabled:opacity-50 transition-all">
            {booking ? "Procesando..." : `Pagar ${fmtCOP(depositAmount + commissionAmount)} →`}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-sm">{label}</span>
      <span className={`text-sm font-semibold ${gold ? "text-[#c9a227]" : "text-white"}`}>{value}</span>
    </div>
  );
}
