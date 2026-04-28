"use client";

import { motion } from "framer-motion";
import { QrCode, MapPin, Bell, CheckCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: MapPin,
    title: "Encuentra tu barbería",
    description: "Busca en el mapa las barberías cercanas, ve reseñas, servicios y disponibilidad en tiempo real.",
  },
  {
    step: "02",
    icon: QrCode,
    title: "Escanea el QR",
    description: "Al llegar, escanea el código QR único de la barbería y únete a la fila virtual automáticamente.",
  },
  {
    step: "03",
    icon: Bell,
    title: "Recibe notificaciones",
    description: "Te avisamos cuando se acerque tu turno. Si te alejas más de 500m, recibirás una advertencia.",
  },
  {
    step: "04",
    icon: CheckCircle,
    title: "Disfruta tu corte",
    description: "Cuando llegue tu turno el barbero te llama. Vive una experiencia de lujo sin esperas.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-28 bg-barber-secondary relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-gold-500 text-sm font-semibold tracking-[0.2em] uppercase mb-3">Proceso</p>
          <h2 className="section-title mb-4">¿Cómo funciona?</h2>
          <div className="gold-line" />
          <p className="text-white/40 text-lg mt-4">4 pasos simples para una experiencia de lujo</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative z-10 text-center group"
            >
              {/* Step circle */}
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gold-500/10 rounded-full border border-gold-500/20 group-hover:border-gold-500/60 group-hover:bg-gold-500/15 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-gold-500" />
                </div>
                {/* Step number */}
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-bold">{i + 1}</span>
                </div>
              </div>

              <span className="text-6xl font-display font-bold text-white/5 absolute -top-4 left-1/2 -translate-x-1/2 select-none">
                {step.step}
              </span>

              <h3 className="font-semibold text-white text-base mb-3">{step.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
