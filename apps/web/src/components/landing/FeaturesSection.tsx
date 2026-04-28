"use client";

import { motion } from "framer-motion";
import { QrCode, MapPin, Bell, CreditCard, Calendar, Users, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Cola Virtual con QR",
    description: "Escanea el QR único y únete a la fila digitalmente. Sin esperas físicas, sin incomodidades.",
  },
  {
    icon: MapPin,
    title: "Mapa Interactivo",
    description: "Encuentra barberías cercanas con disponibilidad en tiempo real y distancias exactas.",
  },
  {
    icon: Bell,
    title: "Notificaciones Inteligentes",
    description: "Alertas de turno, recordatorios de citas y geofencing cuando te alejas más de 500m.",
  },
  {
    icon: CreditCard,
    title: "Pagos PSE y Nequi",
    description: "Métodos de pago colombianos: PSE, tarjeta de crédito, Nequi y DaviPlata integrados.",
  },
  {
    icon: Calendar,
    title: "Gestión de Citas",
    description: "Agenda con tu barbero favorito, elige horario y servicio. Cancelación fácil.",
  },
  {
    icon: Users,
    title: "Panel Administrativo",
    description: "Control total: gestiona barberos, servicios, horarios y métricas de tu negocio.",
  },
  {
    icon: Shield,
    title: "Geofencing 500m",
    description: "Si un cliente se aleja más de 500m pierde su lugar automáticamente con aviso previo.",
  },
  {
    icon: Zap,
    title: "Alta Concurrencia",
    description: "Arquitectura con Redis y WebSockets para miles de usuarios simultáneos en la cola.",
  },
];

export function FeaturesSection() {
  return (
    <section id="caracteristicas" className="py-28 bg-barber-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-gold-500 text-sm font-semibold tracking-[0.2em] uppercase mb-3">Funcionalidades</p>
          <h2 className="section-title mb-4">Todo lo que necesita tu barbería</h2>
          <div className="gold-line" />
          <p className="text-white/40 text-lg max-w-xl mx-auto mt-4">
            Una plataforma completa que digitaliza y potencia tu negocio
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card-dark group p-6 relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10">
                <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:border-gold-500/50 group-hover:bg-gold-500/15 transition-all duration-300">
                  <feature.icon className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-white/40 text-xs leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
