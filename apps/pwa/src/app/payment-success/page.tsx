"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Home,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get("status") || "";
  const ref = searchParams.get("ref") || searchParams.get("id") || "";
  const type = searchParams.get("type") || "appointment";
  const appointmentId = searchParams.get("appointmentId") || "";

  const isAppointmentPayment = type === "appointment";

  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isAppointmentPayment);
  const [checkingManually, setCheckingManually] = useState(false);

  useEffect(() => {
    if (isAppointmentPayment) return;

    let tries = 0;
    const MAX = 6;

    async function check() {
      try {
        const res = await api.get("/subscriptions/my");
        const sub = res.data?.data;
        setSubStatus(sub?.status ?? "PENDING_PAYMENT");
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
  }, [isAppointmentPayment, status]);

  const isApproved = status === "APPROVED" || subStatus === "ACTIVE";

  const handleManualCheck = async () => {
    setCheckingManually(true);
    try {
      const res = await api.get("/subscriptions/my");
      setSubStatus(res.data?.data?.status ?? "PENDING_PAYMENT");
    } catch {
      // ignore
    } finally {
      setCheckingManually(false);
    }
  };

  // ─── Pantalla para pago de CITA ────────────────────────────────────────────
  if (isAppointmentPayment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="BarberProSuite"
            width={160}
            height={60}
            className="mb-8 object-contain"
          />

          {status === "APPROVED" ? (
            <>
              <div className="w-28 h-28 rounded-full bg-[rgba(34,197,94,0.12)] border border-success/20 flex items-center justify-center mb-6">
                <CheckCircle size={60} className="text-success" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                ¡Cita confirmada!
              </h1>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                Tu reserva fue pagada y confirmada. El barbero ha sido
                notificado. Recibirás un recordatorio antes de tu cita.
              </p>
              {ref && (
                <div className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-3 mb-8">
                  <p className="text-text-tertiary text-xs mb-1">
                    Referencia de pago
                  </p>
                  <p className="text-primary text-sm font-mono font-semibold">
                    {ref}
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-3 w-full">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => router.replace("/appointments")}
                  className="gap-2"
                >
                  <Calendar size={18} />
                  Ver mis citas
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={() => router.replace("/home")}
                  className="gap-2"
                >
                  <Home size={18} />
                  Ir al inicio
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-28 h-28 rounded-full bg-[rgba(248,113,113,0.12)] border border-error/20 flex items-center justify-center mb-6">
                <XCircle size={60} className="text-error" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Pago no completado
              </h1>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                El pago de tu reserva no fue aprobado. La cita quedó cancelada.
                Puedes intentar reservar de nuevo.
              </p>
              <Button
                fullWidth
                size="lg"
                onClick={() => router.replace("/home")}
                className="gap-2"
              >
                <Home size={18} />
                Volver al inicio
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Pantalla para pago de SUSCRIPCIÓN ────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="BarberProSuite"
          width={160}
          height={60}
          className="mb-8 object-contain"
        />

        {loading ? (
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">
              Verificando tu suscripción...
            </p>
          </div>
        ) : isApproved ? (
          <>
            <div className="w-28 h-28 rounded-full bg-[rgba(34,197,94,0.12)] border border-success/20 flex items-center justify-center mb-6">
              <CheckCircle size={60} className="text-success" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              ¡Pago recibido!
            </h1>
            <p className="text-text-secondary text-sm mb-8 leading-relaxed">
              Tu suscripción está activa. El administrador te asignará una
              barbería pronto y recibirás una notificación cuando puedas
              comenzar.
            </p>
            <Button
              fullWidth
              size="lg"
              onClick={() => router.replace("/home")}
              className="gap-2"
            >
              <Home size={18} />
              Ir al inicio
            </Button>
          </>
        ) : (
          <>
            <div className="w-28 h-28 rounded-full bg-[rgba(201,162,39,0.12)] border border-primary/20 flex items-center justify-center mb-6">
              <Clock size={60} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Pago en revisión
            </h1>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Tu pago está siendo procesado por Wompi. Esto puede tomar unos
              minutos.
              <br />
              <br />
              Una vez confirmado, el administrador te asignará a una barbería y
              podrás comenzar a gestionar tu agenda.
            </p>
            {ref && (
              <div className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-3 mb-8">
                <p className="text-text-tertiary text-xs mb-1">
                  Referencia de pago
                </p>
                <p className="text-primary text-sm font-mono font-semibold">
                  {ref}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full">
              <Button
                fullWidth
                size="lg"
                onClick={() => router.replace("/home")}
                className="gap-2"
              >
                <Home size={18} />
                Entendido
              </Button>
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                loading={checkingManually}
                onClick={handleManualCheck}
                className="gap-2"
              >
                <RefreshCw size={16} />
                Verificar estado
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
