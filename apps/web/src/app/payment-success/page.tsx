"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Clock, Scissors, User, MapPin, Calendar } from "lucide-react";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();

  const status = searchParams.get("status") ?? searchParams.get("payment_status");
  const ref = searchParams.get("ref") ?? searchParams.get("id");
  const type = searchParams.get("type");
  const appointmentId = searchParams.get("appointmentId");

  const isAppointmentPayment = type === "appointment";
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isAppointmentPayment);
  const [appointmentData, setAppointmentData] = useState<any>(null);

  useEffect(() => {
    if (isAppointmentPayment && status === "APPROVED") {
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
      if (appointmentId) {
        api.get(`/appointments/${appointmentId}`)
          .then((r) => setAppointmentData(r.data.data ?? r.data))
          .catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (isAppointmentPayment) return;

    let tries = 0;
    const MAX = 6;

    async function check() {
      try {
        const res = await api.get("/subscriptions/my");
        setSubStatus(res.data.data?.status ?? "PENDING_PAYMENT");
      } catch {
        setSubStatus("PENDING_PAYMENT");
      } finally {
        setLoading(false);
      }
    }

    check();

    if (status === "APPROVED") {
      const interval = setInterval(() => {
        tries++;
        check();
        if (tries >= MAX) clearInterval(interval);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const isApproved = status === "APPROVED" || subStatus === "ACTIVE";

  // ─── Appointment payment ──────────────────────────────────────────────────
  if (isAppointmentPayment) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          {status === "APPROVED" ? (
            <>
              <div className="w-28 h-28 rounded-full bg-white/5 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={64} className="text-green-500" />
              </div>
              <h1 className="text-white text-2xl font-black mb-3">¡Cita confirmada!</h1>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Tu reserva fue pagada y confirmada. El barbero ha sido notificado. Recibirás un recordatorio antes de tu cita.
              </p>

              {appointmentData && (
                <div className="bg-white/5 border border-[#c9a227]/20 rounded-2xl p-5 text-left mb-5 space-y-3">
                  <p className="text-[#c9a227] text-xs font-bold uppercase tracking-wide mb-1">Detalles de tu cita</p>
                  {appointmentData.service && (
                    <div className="flex items-center gap-3">
                      <Scissors size={16} className="text-[#c9a227] flex-shrink-0" />
                      <div>
                        <span className="text-white/40 text-xs">Servicio: </span>
                        <span className="text-white text-sm font-semibold">{appointmentData.service.name}</span>
                      </div>
                    </div>
                  )}
                  {appointmentData.barber?.user && (
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-[#c9a227] flex-shrink-0" />
                      <div>
                        <span className="text-white/40 text-xs">Barbero: </span>
                        <span className="text-white text-sm font-semibold">{appointmentData.barber.user.firstName} {appointmentData.barber.user.lastName}</span>
                      </div>
                    </div>
                  )}
                  {appointmentData.barbershop && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[#c9a227] flex-shrink-0" />
                      <div>
                        <span className="text-white/40 text-xs">Barbería: </span>
                        <span className="text-white text-sm font-semibold">{appointmentData.barbershop.name}</span>
                      </div>
                    </div>
                  )}
                  {appointmentData.scheduledAt && (
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-[#c9a227] flex-shrink-0" />
                      <div>
                        <span className="text-white/40 text-xs">Fecha: </span>
                        <span className="text-white text-sm font-semibold">
                          {new Date(appointmentData.scheduledAt).toLocaleDateString("es-CO", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  {appointmentData.totalPrice && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      <div className="text-white/40 text-xs">Total: </div>
                      <div className="text-[#c9a227] font-bold">{fmtCOP(appointmentData.totalPrice)}</div>
                    </div>
                  )}
                  <p className="text-white/25 text-xs pt-1 border-t border-white/10 leading-relaxed">
                    Puedes cancelar hasta 2 horas antes de la cita para solicitar devolución.
                  </p>
                </div>
              )}

              {ref && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5">
                  <p className="text-white/40 text-xs mb-1">Referencia de pago</p>
                  <p className="text-[#c9a227] font-semibold text-sm tracking-wide">{ref}</p>
                </div>
              )}

              <Link href="/citas"
                className="flex items-center justify-center w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3.5 rounded-xl mb-3 transition-colors">
                Ver mis citas
              </Link>
              <Link href="/home"
                className="flex items-center justify-center w-full border border-white/15 text-white/60 font-semibold py-3 rounded-xl text-sm hover:bg-white/5 transition-colors">
                Ir al inicio
              </Link>
            </>
          ) : (
            <>
              <div className="w-28 h-28 rounded-full bg-white/5 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle size={64} className="text-red-400" />
              </div>
              <h1 className="text-white text-2xl font-black mb-3">Pago no completado</h1>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                El pago de tu reserva no fue aprobado. La cita quedó cancelada. Puedes intentar reservar de nuevo.
              </p>
              <Link href="/mapa"
                className="flex items-center justify-center w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3.5 rounded-xl transition-colors">
                Volver al inicio
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Subscription payment ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
            <p className="text-white/50">Verificando pago...</p>
          </div>
        ) : isApproved ? (
          <>
            <div className="w-28 h-28 rounded-full bg-white/5 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <h1 className="text-white text-2xl font-black mb-3">¡Pago recibido!</h1>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Tu suscripción está activa. El administrador te asignará una barbería pronto y recibirás una notificación cuando puedas comenzar.
            </p>
            <Link href="/home"
              className="flex items-center justify-center w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3.5 rounded-xl transition-colors">
              Ir al inicio
            </Link>
          </>
        ) : (
          <>
            <div className="w-28 h-28 rounded-full bg-white/5 border border-[#c9a227]/20 flex items-center justify-center mx-auto mb-6">
              <Clock size={64} className="text-[#c9a227]" />
            </div>
            <h1 className="text-white text-2xl font-black mb-3">Pago en revisión</h1>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Tu pago está siendo procesado por Wompi. Esto puede tomar unos minutos.
              <br /><br />
              Una vez confirmado, el administrador te asignará a una barbería y podrás comenzar a gestionar tu agenda.
            </p>

            {ref && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5">
                <p className="text-white/40 text-xs mb-1">Referencia de pago</p>
                <p className="text-[#c9a227] font-semibold text-sm tracking-wide">{ref}</p>
              </div>
            )}

            <Link href="/home"
              className="flex items-center justify-center w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3.5 rounded-xl mb-3 transition-colors">
              Entendido
            </Link>
            <button
              onClick={() => {
                setLoading(true);
                api.get("/subscriptions/my")
                  .then((r) => setSubStatus(r.data.data?.status ?? "PENDING_PAYMENT"))
                  .catch(() => {})
                  .finally(() => setLoading(false));
              }}
              className="flex items-center justify-center w-full border border-white/15 text-white/60 font-semibold py-3 rounded-xl text-sm hover:bg-white/5 transition-colors">
              Verificar estado
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
