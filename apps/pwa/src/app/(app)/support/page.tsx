"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { MessageCircle, Mail, Phone, HelpCircle, ChevronRight } from "lucide-react";

const faqs = [
  {
    q: "¿Cómo me uno a una cola virtual?",
    a: "Escanea el código QR de la barbería usando la sección 'Escanear' en el menú inferior.",
  },
  {
    q: "¿Cómo cancelo una cita?",
    a: "Ve a la sección 'Citas', selecciona la cita y presiona 'Cancelar'. Solo puedes cancelar citas pendientes o confirmadas.",
  },
  {
    q: "¿Cómo funciona el pago?",
    a: "Los pagos se procesan a través de Wompi, una plataforma segura de pagos en Colombia. Aceptamos tarjetas débito, crédito y PSE.",
  },
  {
    q: "¿Qué hago si no recibo el código OTP?",
    a: "Revisa tu carpeta de spam. Si no llega, espera 60 segundos y usa el botón 'Reenviar código'.",
  },
];

export default function SupportPage() {
  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-white mb-6">Soporte</h1>

      {/* Contact options */}
      <div className="flex flex-col gap-3 mb-8">
        <a
          href="mailto:soporte@barberprosuite.com"
          className="flex items-center gap-4 p-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-2xl hover:border-[rgba(255,255,255,0.12)] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center">
            <Mail size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Email</p>
            <p className="text-text-secondary text-xs">
              soporte@barberprosuite.com
            </p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary" />
        </a>

        <a
          href="https://wa.me/573001234567"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-2xl hover:border-[rgba(255,255,255,0.12)] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.15)] flex items-center justify-center">
            <MessageCircle size={18} className="text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">WhatsApp</p>
            <p className="text-text-secondary text-xs">+57 300 123 4567</p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary" />
        </a>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <Card key={i}>
              <div className="flex gap-3">
                <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">{faq.q}</p>
                  <p className="text-text-secondary text-sm">{faq.a}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
