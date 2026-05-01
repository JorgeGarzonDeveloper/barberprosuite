"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { CheckCircle, Home, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  const type = searchParams.get("type") || "appointment";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto mb-6 border-2 border-success/20">
          <CheckCircle size={48} className="text-success" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">¡Pago exitoso!</h1>
        <p className="text-text-secondary text-sm mb-8">
          {type === "subscription"
            ? "Tu suscripción ha sido activada. Ya puedes recibir clientes."
            : "Tu cita ha sido registrada. Recibirás una confirmación pronto."}
        </p>

        {appointmentId && (
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 mb-8 text-left">
            <p className="text-text-secondary text-xs mb-1">ID de transacción</p>
            <p className="text-white text-sm font-mono">{appointmentId}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push("/appointments")}
            className="gap-2"
          >
            <Calendar size={18} />
            Ver mis citas
          </Button>
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => router.push("/home")}
            className="gap-2"
          >
            <Home size={18} />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
