"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";
import { CheckCircle, CreditCard, Lock, AlertCircle, ChevronLeft, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  description?: string;
}

interface Subscription {
  id: string;
  status: string;
  planId: string;
  endDate?: string;
  plan?: Plan;
}

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export default function SuscripcionPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadSubscription(); }, []);

  async function loadSubscription() {
    setLoading(true);
    try {
      const res = await api.get("/subscriptions/my");
      setSubscription(res.data.data ?? null);
    } catch (e: any) {
      if (e?.response?.status === 404) setSubscription(null);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const needsPayment = !subscription || subscription.status === "PENDING_PAYMENT";
    if (!loading && needsPayment && plans.length === 0) loadPlans();
  }, [loading, subscription]);

  async function loadPlans() {
    setLoadingPlans(true);
    try {
      const res = await api.get("/subscriptions/plans");
      const all: Plan[] = res.data.data ?? res.data ?? [];
      setPlans(all.filter((p) => p.priceMonthly > 0));
    } catch { setError("No se pudieron cargar los planes. Intenta más tarde."); }
    finally { setLoadingPlans(false); }
  }

  async function handleCheckout() {
    if (!selectedPlanId) { setError("Selecciona un plan para continuar."); return; }
    setError("");
    setLoadingCheckout(true);
    try {
      let subId = subscription?.id;
      if (!subId) {
        const subRes = await api.post(`/subscriptions/user/subscribe/${selectedPlanId}`);
        subId = subRes.data.data?.id ?? subRes.data?.id;
      }
      const planName = plans.find((p) => p.id === selectedPlanId)?.displayName ?? "Plan";
      const linkRes = await api.post("/payments/checkout-link", { subscriptionId: subId, planName });
      const checkoutUrl = linkRes.data.checkoutUrl ?? linkRes.data.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error("No se recibió URL de pago");
      window.location.href = checkoutUrl;
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e.message ?? "Error al procesar el pago.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally { setLoadingCheckout(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 size={32} className="text-[#c9a227] animate-spin" />
      </div>
    );
  }

  const isActive = subscription?.status === "ACTIVE";
  const needsPayment = !subscription || subscription.status === "PENDING_PAYMENT";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Mi suscripción</h1>
          <p className="text-white/40 text-xs">{user?.firstName} {user?.lastName}</p>
        </div>
      </div>

      <div className="px-4 pb-24 max-w-md mx-auto">
        {/* ACTIVA */}
        {isActive && subscription && (
          <>
            <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-6 text-center mb-4">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
              <h2 className="text-white text-xl font-bold mb-1">Suscripción activa</h2>
              <p className="text-green-400 font-semibold">{subscription.plan?.displayName ?? "Plan activo"}</p>

              <div className="mt-5 pt-5 border-t border-white/10 space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Estado</span>
                  <span className="px-2.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg">ACTIVA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Precio</span>
                  <span className="text-white text-sm font-semibold">{fmtCOP(subscription.plan?.priceMonthly ?? 0)}/mes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Vence</span>
                  <span className="text-white text-sm font-semibold">{fmtDate(subscription.endDate)}</span>
                </div>
              </div>
            </div>
            <p className="text-white/30 text-xs text-center leading-relaxed">
              El administrador de BarberProSuite gestiona la renovación de tu plan. Si tienes dudas, contáctanos por Soporte.
            </p>
          </>
        )}

        {/* PENDIENTE / SIN SUSCRIPCIÓN */}
        {needsPayment && (
          <>
            <div className="bg-[#c9a227]/10 border border-[#c9a227]/25 rounded-2xl p-5 text-center mb-6">
              <AlertCircle size={32} className="text-[#c9a227] mx-auto mb-2" />
              <h2 className="text-[#c9a227] font-bold text-lg mb-1">
                {subscription ? "Pago pendiente" : "Sin suscripción activa"}
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                {subscription
                  ? "Tu pago aún no ha sido confirmado. Puedes reintentar el pago seleccionando un plan."
                  : "Para gestionar tu agenda y recibir clientes necesitas activar un plan."}
              </p>
            </div>

            <h3 className="text-white font-bold text-base mb-3">Elige tu plan</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {loadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="text-[#c9a227] animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {plans.map((plan) => {
                  const selected = selectedPlanId === plan.id;
                  return (
                    <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        selected ? "border-[#c9a227] bg-[#c9a227]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? "border-[#c9a227]" : "border-white/30"}`}>
                          {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a227]" />}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${selected ? "text-white" : "text-white/70"}`}>{plan.displayName}</p>
                          <p className="text-white/30 text-xs">por mes</p>
                        </div>
                      </div>
                      <span className={`font-bold text-base ${selected ? "text-[#c9a227]" : "text-white/50"}`}>{fmtCOP(plan.priceMonthly)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={handleCheckout} disabled={!selectedPlanId || loadingCheckout}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-2xl text-base transition-all disabled:opacity-50">
              {loadingCheckout ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
              {loadingCheckout ? "Procesando..." : "Ir a pagar con Wompi"}
            </button>

            <p className="text-white/25 text-xs text-center mt-3 flex items-center justify-center gap-1">
              <Lock size={11} /> Pago seguro procesado por Wompi
            </p>
          </>
        )}
      </div>
    </div>
  );
}
