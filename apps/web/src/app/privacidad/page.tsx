import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad de BarberProSuite. Conoce cómo protegemos tus datos.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
            <Link href="/" className="hover:text-gold-400 transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white/60">Política de Privacidad</span>
          </div>

          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Política de <span className="text-gold-400">Privacidad</span>
          </h1>
          <p className="text-white/40 text-sm mb-10">Última actualización: 1 de mayo de 2025</p>

          <div className="prose-legal">
            <p>
              En BarberProSuite (&quot;nosotros&quot;, &quot;nuestro&quot;) respetamos tu privacidad y nos
              comprometemos a proteger la información personal que compartes con nosotros al
              usar nuestra aplicación móvil y plataforma web.
            </p>

            <h2>1. Información que recopilamos</h2>
            <ul>
              <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de forma cifrada).</li>
              <li><strong>Ubicación:</strong> usamos tu ubicación para mostrarte barberías cercanas y verificar tu proximidad al unirte a una cola virtual. La ubicación en segundo plano solo se usa para alertarte si te alejas de la barbería mientras esperas tu turno.</li>
              <li><strong>Cámara:</strong> para escanear el código QR de la barbería.</li>
              <li><strong>Fotos:</strong> si decides subir una foto de perfil o de la barbería.</li>
              <li><strong>Notificaciones push:</strong> para informarte sobre el estado de tu turno y citas.</li>
            </ul>

            <h2>2. Cómo usamos tu información</h2>
            <ul>
              <li>Gestionar tu cuenta y permitirte acceder a los servicios de la plataforma.</li>
              <li>Conectarte con barberías cercanas mediante geolocalización.</li>
              <li>Enviarte notificaciones sobre el estado de tu turno y citas agendadas.</li>
              <li>Procesar pagos de suscripción para barberos a través de Wompi.</li>
              <li>Mejorar continuamente la aplicación.</li>
            </ul>

            <h2>3. Compartición de datos</h2>
            <p>
              No vendemos ni compartimos tu información personal con terceros para fines
              publicitarios. Solo compartimos datos con:
            </p>
            <ul>
              <li><strong>Barberos registrados</strong> en la plataforma, para gestionar tu turno o cita (nombre y datos básicos de contacto).</li>
              <li><strong>Proveedores de servicio</strong> (Firebase, Railway, Wompi) bajo estrictos acuerdos de confidencialidad.</li>
            </ul>

            <h2>4. Seguridad</h2>
            <p>
              Tu información se almacena en servidores seguros. Los tokens de sesión se
              guardan en el almacenamiento seguro del dispositivo (Secure Store). Usamos
              HTTPS para todas las comunicaciones.
            </p>

            <h2>5. Tus derechos</h2>
            <p>
              Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento
              contactándonos a través de la sección de{" "}
              <Link href="/soporte" className="text-gold-400 hover:underline">Soporte</Link>{" "}
              dentro de la app o en nuestra página web.
            </p>

            <h2>6. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política, contáctanos desde la sección{" "}
              <Link href="/soporte" className="text-gold-400 hover:underline">Soporte y Ayuda</Link>.
            </p>
          </div>

          <div className="mt-10 p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">¿Tienes dudas sobre tu privacidad?</p>
              <p className="text-white/50 text-sm">Nuestro equipo está disponible para ayudarte.</p>
            </div>
            <Link href="/soporte" className="btn-primary text-sm whitespace-nowrap">
              Ir a Soporte
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
