"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown, ChevronUp, MessageCircle, RotateCcw, Headphones } from "lucide-react";

const FAQs = [
  {
    q: "¿Cómo me uno a una cola virtual?",
    a: "Descarga la app BarberProSuite, regístrate y escanea el código QR de la barbería. Debes estar a menos de 500m del local para unirte.",
  },
  {
    q: "¿Cómo reservo una cita?",
    a: "En la app, busca la barbería en el mapa o desde el inicio, selecciona el barbero y el horario disponible. Pagas el 50% del servicio más la comisión de plataforma.",
  },
  {
    q: "¿Cómo cancelo una cita y pido devolución?",
    a: "Puedes cancelar con más de 2 horas de anticipación desde la sección 'Mis citas'. Para solicitar la devolución, ve a Soporte > Devoluciones en la app.",
  },
  {
    q: "¿Qué se devuelve si cancelo?",
    a: "Se devuelve el 50% que pagaste al momento de reservar. La comisión del 10% de la plataforma no es reembolsable.",
  },
  {
    q: "¿Cuánto tarda la devolución?",
    a: "Las devoluciones se procesan en máximo 2 días hábiles al mismo medio de pago original (Wompi).",
  },
  {
    q: "¿Soy barbero y quiero unirme a la plataforma. ¿Qué hago?",
    a: "Regístrate como barbero en la app, activa tu suscripción y el administrador te asignará a una barbería. Luego ya puedes recibir clientes.",
  },
  {
    q: "¿Qué pasa si me alejo de la barbería mientras espero en la cola?",
    a: "Recibirás una notificación de advertencia. Si sigues alejándote más de 500m, serás removido automáticamente de la cola.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-white font-medium pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gold-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 text-white/60 text-sm leading-relaxed border-t border-white/10 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [refundRef, setRefundRef] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundDetails, setRefundDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundRef || !refundReason) return;
    setSubmitting(true);
    // En producción llama a la API
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Centro de <span className="text-gold-400">Soporte</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto">
              Encuentra respuestas rápidas, solicita devoluciones o escríbenos directamente.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: "Chat en la app",
                desc: "Abre BarberProSuite → Perfil → Soporte y Ayuda para chatear con nuestro equipo.",
                color: "#22c55e",
              },
              {
                icon: <RotateCcw className="w-6 h-6" />,
                title: "Solicitar devolución",
                desc: "Cancela con 2+ horas de anticipación y solicita tu reembolso desde la app o en este formulario.",
                color: "#c9a227",
              },
              {
                icon: <Headphones className="w-6 h-6" />,
                title: "Tiempo de respuesta",
                desc: "Respondemos en menos de 24 horas hábiles. Devoluciones en máximo 2 días hábiles.",
                color: "#60a5fa",
              },
            ].map((c) => (
              <div key={c.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${c.color}18`, color: c.color }}
                >
                  {c.icon}
                </div>
                <h3 className="text-white font-bold mb-2">{c.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* FAQ */}
            <div>
              <h2 className="font-display text-2xl font-bold text-white mb-6">
                Preguntas frecuentes
              </h2>
              <div className="flex flex-col gap-3">
                {FAQs.map((faq) => (
                  <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>

            {/* Refund form */}
            <div>
              <h2 className="font-display text-2xl font-bold text-white mb-6">
                Solicitar devolución
              </h2>

              {submitted ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Solicitud enviada</h3>
                  <p className="text-white/50 text-sm mb-6">
                    Revisaremos tu caso en máximo 2 días hábiles y procesaremos la devolución al mismo medio de pago.
                  </p>
                  <button onClick={() => setSubmitted(false)} className="btn-primary text-sm">
                    Enviar otra solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRefundSubmit} className="flex flex-col gap-5">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                    <strong>Política de devoluciones:</strong> Se devuelve el 50% pagado al reservar.
                    La comisión del 10% de la plataforma no es reembolsable. Solo aplica con 2+ horas de anticipación.
                  </div>

                  <div>
                    <label className="text-white/60 text-sm font-medium mb-2 block">
                      Referencia de pago *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 text-sm"
                      placeholder="Ej: WMP-12345678"
                      value={refundRef}
                      onChange={(e) => setRefundRef(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm font-medium mb-2 block">
                      Motivo *
                    </label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 text-sm"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      required
                      style={{ backgroundColor: "#0a0a0f" }}
                    >
                      <option value="">Selecciona un motivo</option>
                      <option>No pude asistir</option>
                      <option>El barbero canceló la cita</option>
                      <option>Error en el pago</option>
                      <option>Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm font-medium mb-2 block">
                      Detalles adicionales (opcional)
                    </label>
                    <textarea
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold-500/50 text-sm resize-none"
                      placeholder="Describe brevemente el problema..."
                      value={refundDetails}
                      onChange={(e) => setRefundDetails(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !refundRef || !refundReason}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Enviando..." : "Enviar solicitud de devolución"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
