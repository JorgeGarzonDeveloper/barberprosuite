"use client";

import { motion } from "framer-motion";
import { Check, Crown, Zap } from "lucide-react";
import Link from "next/link";

const BASICO_PRICE = 29900;
const PRO_PRICE = 49900;
const PRO_DISCOUNT = 0.20;
const PRO_FIRST_MONTH = Math.round(PRO_PRICE * (1 - PRO_DISCOUNT));

const plans = [
  {
    id: "basico",
    name: "Básico",
    price: BASICO_PRICE,
    description: "Perfecto para empezar",
    badge: null,
    highlight: false,
    features: [
      "Cola virtual ilimitada",
      "10 citas al mes",
      "QR personalizado",
      "Notificaciones push",
      "Soporte por chat",
    ],
    cta: "Empezar ahora",
    href: "/admin/register?plan=basico",
  },
  {
    id: "profesional",
    name: "Profesional",
    price: PRO_PRICE,
    firstMonthPrice: PRO_FIRST_MONTH,
    description: "Para barberías que crecen",
    badge: "Más popular",
    highlight: true,
    features: [
      "Cola virtual ilimitada",
      "500 citas al mes",
      "QR ilimitado",
      "Estadísticas avanzadas",
      "Notificaciones push",
      "Soporte chat prioritario",
      "Panel admin completo",
    ],
    cta: "Obtener oferta",
    href: "/admin/register?plan=profesional",
    promo: {
      label: "20% OFF primer mes",
      detail: `Paga ${fmtCOP(PRO_FIRST_MONTH)} el 1er mes + ${fmtCOP(PRO_PRICE)} el 2do`,
    },
  },
];

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PricingSection() {
  return (
    <section id="precios" className="py-28 bg-barber-primary relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-gold-500 text-sm font-semibold tracking-[0.2em] uppercase mb-3">Planes</p>
          <h2 className="section-title mb-4">Invierte en tu barbería</h2>
          <div className="gold-line" />
          <p className="text-white/40 text-lg mt-4">Cobro mensual por barbero · Sin contratos anuales</p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-12 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 border transition-all duration-300 flex-1 max-w-sm ${
                plan.highlight
                  ? "bg-gradient-to-b from-gold-600/20 to-gold-500/5 border-gold-500/50 scale-105 shadow-2xl shadow-gold-500/10"
                  : "bg-barber-secondary border-white/10 hover:border-gold-500/20"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gold-500 text-black text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                    <Crown className="w-3 h-3" fill="currentColor" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-white/40 text-sm">{plan.description}</p>
              </div>

              <div className="mb-5">
                <div className={`text-4xl font-bold mb-1 ${plan.highlight ? "gold-text" : "text-white"}`}>
                  {fmtCOP(plan.price)}
                </div>
                <span className="text-white/30 text-sm">/mes · por barbero</span>
              </div>

              {plan.promo && (
                <div className="mb-5 bg-gold-500/10 border border-gold-500/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-gold-400" fill="currentColor" />
                    <span className="text-gold-400 text-xs font-bold uppercase tracking-wide">{plan.promo.label}</span>
                  </div>
                  <p className="text-white/50 text-xs">{plan.promo.detail}</p>
                  <p className="text-white/30 text-xs mt-0.5">*Requiere compromiso de 2 meses</p>
                </div>
              )}

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.highlight ? "bg-gold-500/20" : "bg-white/10"
                    }`}>
                      <Check className={`w-2.5 h-2.5 ${plan.highlight ? "text-gold-400" : "text-white/60"}`} />
                    </div>
                    <span className="text-white/60 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  plan.highlight
                    ? "bg-gold-500 hover:bg-gold-400 text-black"
                    : "border border-white/20 text-white hover:border-gold-500/40 hover:bg-gold-500/10"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
