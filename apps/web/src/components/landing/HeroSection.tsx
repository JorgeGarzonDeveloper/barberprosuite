"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Scissors, Star, Users, MapPin, Crown } from "lucide-react";

const stats = [
  { label: "Barberías activas", value: "500+" },
  { label: "Barberos registrados", value: "2,000+" },
  { label: "Clientes satisfechos", value: "50,000+" },
  { label: "Ciudades en Colombia", value: "30+" },
];

export function HeroSection() {
  return (
    <section className="gradient-hero min-h-screen flex items-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#c9a227 1px, transparent 1px), linear-gradient(90deg, #c9a227 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      <div className="container mx-auto px-6 py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 border border-gold-500/40 bg-gold-500/10 rounded-full px-4 py-2 mb-8"
            >
              <Crown className="w-4 h-4 text-gold-400" fill="currentColor" />
              <span className="text-gold-400 text-sm font-medium tracking-wide">
                #1 Plataforma para barberías en Colombia
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-[1.05]">
              Eleva tu
              <br />
              <span className="gold-text">barbería</span>
              <br />
              al siguiente nivel
            </h1>

            {/* Gold divider */}
            <div className="w-20 h-0.5 bg-gradient-to-r from-gold-500 to-transparent mb-6" />

            <p className="text-white/50 text-lg mb-10 leading-relaxed max-w-lg">
              Cola virtual inteligente, citas online, mapas interactivos y pagos PSE.
              La herramienta que tu barbería necesita para destacar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/admin/register" className="btn-primary text-center inline-flex items-center justify-center gap-2">
                <Scissors className="w-4 h-4" />
                Registra tu barbería
              </Link>
              <Link href="#como-funciona" className="btn-secondary text-center">
                Ver cómo funciona
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-14 pt-10 border-t border-white/10">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold gold-text">{stat.value}</div>
                  <div className="text-white/40 text-xs mt-1 leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex justify-center items-center"
          >
            <div className="relative">
              {/* Glow behind phone */}
              <div className="absolute inset-0 bg-gold-500/10 rounded-[4rem] blur-2xl scale-110" />

              {/* Phone */}
              <div className="relative w-[270px] bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-[3rem] p-[3px] shadow-2xl border border-gold-500/20">
                <div className="bg-barber-primary rounded-[2.8rem] overflow-hidden h-[560px]">
                  {/* Notch */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-24 h-5 bg-black rounded-full" />
                  </div>

                  <div className="px-5 pb-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-white/40 text-xs">Buenos días,</p>
                        <p className="text-white font-semibold text-sm">Carlos Rodríguez</p>
                      </div>
                      <div className="w-9 h-9 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                        <span className="text-black text-sm font-bold">CR</span>
                      </div>
                    </div>

                    {/* Queue card */}
                    <div className="bg-gradient-to-br from-gold-600 to-gold-700 rounded-2xl p-4 mb-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <p className="text-black/60 text-xs mb-1 font-medium">Tu posición en la fila</p>
                      <p className="text-black text-5xl font-bold">#3</p>
                      <p className="text-black/60 text-xs">~20 min de espera</p>
                      <div className="mt-3 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div key={n} className={`h-1 flex-1 rounded-full ${n <= 3 ? "bg-black/60" : "bg-black/20"}`} />
                        ))}
                      </div>
                    </div>

                    {/* Map preview */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl h-28 flex items-center justify-center mb-4">
                      <div className="text-center">
                        <MapPin className="w-7 h-7 text-gold-500 mx-auto mb-1" />
                        <p className="text-white/50 text-xs">3 barberías cercanas</p>
                      </div>
                    </div>

                    {/* Nearby shops */}
                    {["Elite Barber", "Classic Cuts", "Urban Style"].map((shop, i) => (
                      <div key={shop} className="flex items-center gap-3 mb-2 bg-white/5 border border-white/5 rounded-xl p-2.5">
                        <div className="w-8 h-8 bg-gold-500/15 border border-gold-500/20 rounded-xl flex items-center justify-center">
                          <Scissors className="w-4 h-4 text-gold-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-xs font-medium">{shop}</p>
                          <p className="text-white/30 text-xs">{(i + 1) * 0.3} km</p>
                        </div>
                        <div className="text-gold-400 text-xs font-medium">★ {4.5 - i * 0.2}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -right-12 top-24 bg-barber-secondary border border-gold-500/30 rounded-2xl shadow-2xl shadow-black/50 p-3 w-48"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gold-500/20 border border-gold-500/30 rounded-xl flex items-center justify-center">
                    <Users className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">¡Es tu turno!</p>
                    <p className="text-xs text-white/40">Acércate a la silla</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating star */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                className="absolute -left-10 bottom-28 bg-barber-secondary border border-gold-500/30 rounded-2xl shadow-2xl shadow-black/50 p-3"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold-400" fill="currentColor" />
                  <span className="text-white text-xs font-bold">4.9/5.0</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
