"use client";

import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import Link from "next/link";

const PRICE = 59900;
const FIRST_MONTH = Math.round(PRICE * 0.5); // 29.950

const FEATURES = [
  "Cola virtual ilimitada",
  "Citas ilimitadas",
  "QR personalizado",
  "Estadísticas avanzadas",
  "Pagos online con Wompi",
  "Notificaciones push",
  "Panel admin completo",
  "Soporte prioritario",
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
          <p className="text-white/40 text-lg mt-4">Todo incluido · Sin contratos anuales · Cancela cuando quieras</p>
        </motion.div>

        <div className="flex justify-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl p-8 border bg-gradient-to-b from-gold-600/20 to-gold-500/5 border-gold-500/50 shadow-2xl shadow-gold-500/10 w-full max-w-md"
          >
            {/* Badge oferta primer mes */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gold-500 text-black text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                <Zap className="w-3 h-3" fill="currentColor" />
                Primer mes 50% OFF
              </span>
            </div>

            <div className="mb-5">
              <h3 className="text-2xl font-bold text-white mb-1">BarberPro</h3>
              <p className="text-white/40 text-sm">Todo lo que tu barbería necesita</p>
            </div>

            {/* Precio */}
            <div className="mb-5">
              <div className="flex items-end gap-3 mb-1">
                <span className="text-5xl font-bold gold-text">{fmtCOP(FIRST_MONTH)}</span>
                <span className="text-white/40 line-through text-xl mb-1">{fmtCOP(PRICE)}</span>
              </div>
              <span className="text-white/30 text-sm">primer mes · luego {fmtCOP(PRICE)}/mes</span>
            </div>

            {/* Promo box */}
            <div className="mb-6 bg-gold-500/10 border border-gold-500/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-gold-400" fill="currentColor" />
                <span className="text-gold-400 text-xs font-bold uppercase tracking-wide">Oferta de lanzamiento</span>
              </div>
              <p className="text-white/50 text-xs">
                Tu primera suscripción cuesta {fmtCOP(FIRST_MONTH)}. A partir del segundo mes pagas {fmtCOP(PRICE)}/mes.
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-gold-500/20">
                    <Check className="w-2.5 h-2.5 text-gold-400" />
                  </div>
                  <span className="text-white/60 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/admin/register?plan=pro"
              className="block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 bg-gold-500 hover:bg-gold-400 text-black"
            >
              Empezar ahora — {fmtCOP(FIRST_MONTH)} el primer mes
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
