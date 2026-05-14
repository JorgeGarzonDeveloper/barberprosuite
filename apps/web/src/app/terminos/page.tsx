import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de BarberProSuite.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
            <Link href="/" className="hover:text-gold-400 transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white/60">Términos y Condiciones</span>
          </div>

          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Términos y <span className="text-gold-400">Condiciones</span>
          </h1>
          <p className="text-white/40 text-sm mb-10">Última actualización: 1 de mayo de 2025</p>

          <div className="prose-legal">
            <p>
              Al usar BarberProSuite aceptas los siguientes términos. Si no estás de acuerdo,
              por favor no uses la aplicación.
            </p>

            <h2>1. Uso de la plataforma</h2>
            <p>
              BarberProSuite es una plataforma que conecta clientes con barberías. Los
              barberos son profesionales independientes y BarberProSuite no es empleador ni
              responsable de los servicios prestados por ellos.
            </p>

            <h2>2. Cuentas de usuario</h2>
            <p>
              Debes tener al menos 13 años para usar la app. Eres responsable de mantener
              la seguridad de tu cuenta y de toda actividad que ocurra bajo ella.
            </p>

            <h2>3. Cola virtual y citas</h2>
            <p>
              Al unirte a una cola virtual o agendar una cita, te comprometes a asistir o
              cancelar con suficiente antelación. El abuso de la función de cola (unirse sin
              intención de asistir) puede resultar en la suspensión de tu cuenta.
            </p>

            <h2>4. Pagos y citas</h2>
            <p>
              Al reservar una cita pagas el <strong>50% del valor del servicio</strong> más una{" "}
              <strong>comisión del 10%</strong> sobre el valor total de la cita (esta comisión es de
              la plataforma y no es reembolsable).
            </p>
            <p>
              El restante 50% se paga directamente al barbero al momento del servicio.
            </p>

            <h2>5. Política de cancelaciones y devoluciones</h2>
            <ul>
              <li>
                <strong>Cancelaciones con más de 2 horas de anticipación:</strong> puedes solicitar
                la devolución del 50% pagado (sin comisión) mediante un ticket de soporte.
              </li>
              <li>
                <strong>Cancelaciones con menos de 2 horas:</strong> no aplica devolución.
              </li>
              <li>
                La comisión del 10% cobrada por la plataforma no es reembolsable bajo ninguna circunstancia.
              </li>
              <li>
                Las solicitudes de devolución se gestionan en máximo 2 días hábiles y se
                realizan al mismo medio de pago original.
              </li>
            </ul>

            <h2>6. Suscripciones para barberos</h2>
            <p>
              Los barberos que deseen recibir clientes a través de la plataforma deben
              mantener una suscripción activa. Los pagos se procesan a través de Wompi y no
              son reembolsables salvo lo establecido por la ley colombiana.
            </p>

            <h2>7. Limitación de responsabilidad</h2>
            <p>
              BarberProSuite no se hace responsable por daños directos o indirectos
              derivados del uso de la plataforma, incluyendo cancelaciones de turno,
              retrasos o calidad del servicio del barbero.
            </p>

            <h2>8. Cambios a los términos</h2>
            <p>
              Podemos actualizar estos términos. Te notificaremos a través de la app cuando
              haya cambios significativos.
            </p>

            <h2>9. Ley aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de la República de Colombia.
            </p>
          </div>

          <div className="mt-10 p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">¿Necesitas aclaraciones?</p>
              <p className="text-white/50 text-sm">Nuestro equipo de soporte puede ayudarte.</p>
            </div>
            <Link href="/soporte" className="btn-primary text-sm whitespace-nowrap">
              Contactar Soporte
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
