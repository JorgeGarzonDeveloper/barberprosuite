"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { paymentsApi } from "@/lib/api/payments.api";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, formatDate, cn } from "@/lib/utils";
import {
  Crown,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  Lock,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Plan } from "@/types";

export default function SubscriptionPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subscriptionsApi.getMy().catch(() => null),
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => subscriptionsApi.getPlans(),
  });

  const subscription = subData?.data;
  const plans = (plansData?.data ?? []).filter((p: Plan) => p.priceMonthly > 0);

  const isActive = subscription?.status === "ACTIVE";
  const needsPayment = !subscription || subscription.status === "PENDING_PAYMENT";

  const handleCheckout = async () => {
    if (!selectedPlanId) return;
    setLoadingCheckout(true);
    setCheckoutError("");
    try {
      let subId = subscription?.id;

      // Si no tiene suscripción, crearla primero (igual que mobile)
      if (!subId) {
        const subRes = await api.post(`/subscriptions/user/subscribe/${selectedPlanId}`);
        subId = subRes.data?.data?.id ?? subRes.data?.id;
      }

      const planName =
        plans.find((p: Plan) => p.id === selectedPlanId)?.displayName ?? "Plan";

      const res = await api.post("/payments/checkout-link", {
        subscriptionId: subId,
        planName,
      });

      const checkoutUrl = res.data?.checkoutUrl ?? res.data?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error("No se recibió URL de pago");

      window.open(checkoutUrl, "_blank");
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.[0] ??
        e?.response?.data?.message ??
        e?.message ??
        "Error al procesar el pago.";
      setCheckoutError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (subLoading || plansLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <Crown size={22} className="text-primary" />
        <h1 className="text-xl font-bold text-white">Mi suscripción</h1>
      </div>

      {/* ── ACTIVA ── */}
      {isActive && subscription && (
        <>
          <div className="bg-success/8 border border-success/20 rounded-2xl p-6 flex flex-col items-center text-center mb-5">
            <CheckCircle size={48} className="text-success mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Suscripción activa</h2>
            <p className="text-success font-semibold text-sm mb-5">
              {subscription.plan?.displayName ?? "Plan activo"}
            </p>

            <div className="w-full border-t border-white/10 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">Estado</span>
                <span className="text-xs font-bold text-success bg-success/15 px-2.5 py-1 rounded-full">
                  ACTIVA
                </span>
              </div>
              {subscription.plan?.priceMonthly && (
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Precio</span>
                  <span className="text-white font-semibold text-sm">
                    {formatCOP(subscription.plan.priceMonthly)}/mes
                  </span>
                </div>
              )}
              {subscription.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Vence</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" />
                    <span className="text-white text-sm font-medium">
                      {formatDate(subscription.endDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-text-tertiary text-xs text-center">
            El administrador de BarberProSuite gestiona la renovación de tu plan.
            Si tienes dudas, contáctanos por Soporte.
          </p>
        </>
      )}

      {/* ── PENDIENTE / SIN SUSCRIPCIÓN ── */}
      {needsPayment && (
        <>
          {/* Banner aviso */}
          <div className="bg-primary/8 border border-primary/20 rounded-xl p-5 flex flex-col items-center text-center mb-6">
            <AlertCircle size={28} className="text-primary mb-2" />
            <p className="text-primary font-bold text-base mb-1.5">
              {subscription ? "Pago pendiente" : "Sin suscripción activa"}
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              {subscription
                ? "Tu pago aún no ha sido confirmado. Puedes reintentar el pago seleccionando un plan."
                : "Para gestionar tu agenda y recibir clientes necesitas activar un plan."}
            </p>
          </div>

          {/* Selección de plan */}
          <p className="text-white font-bold text-base mb-3">Elige tu plan</p>

          <div className="flex flex-col gap-3 mb-5">
            {plans.map((plan: Plan) => {
              const selected = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-4 rounded-xl border transition-all text-left",
                    selected
                      ? "border-primary bg-primary/8"
                      : "border-white/10 bg-white/4 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      selected ? "border-primary" : "border-white/30"
                    )}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className={cn("font-semibold text-sm", selected ? "text-white" : "text-text-secondary")}>
                        {plan.displayName}
                      </p>
                      <p className="text-text-tertiary text-xs">por mes</p>
                    </div>
                  </div>
                  <p className={cn("font-bold text-base", selected ? "text-primary" : "text-text-secondary")}>
                    {formatCOP(plan.priceMonthly)}
                  </p>
                </button>
              );
            })}
          </div>

          {checkoutError && (
            <div className="mb-4 bg-error/10 border border-error/20 rounded-xl p-3">
              <p className="text-error text-sm">{checkoutError}</p>
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            disabled={!selectedPlanId}
            loading={loadingCheckout}
            onClick={handleCheckout}
            className="gap-2 mb-3"
          >
            <CreditCard size={18} />
            Ir a pagar con Wompi
          </Button>

          <div className="flex items-center justify-center gap-1.5">
            <Lock size={11} className="text-text-tertiary" />
            <p className="text-text-tertiary text-xs">Pago seguro procesado por Wompi</p>
          </div>
        </>
      )}
    </div>
  );
}
