import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Términos y Condiciones — BarberProSuite",
  description: "Términos y condiciones de uso de BarberProSuite. Normativa colombiana aplicable.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
            <Link href="/" className="hover:text-gold-400 transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white/60">Términos y Condiciones</span>
          </div>

          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Términos y <span className="text-gold-400">Condiciones</span>
          </h1>
          <p className="text-white/40 text-sm mb-10">Última actualización: 13 de mayo de 2026 · Versión 2.0</p>

          <div className="prose-legal">

            <p>
              Los presentes Términos y Condiciones de Uso (&quot;Términos&quot;) regulan el acceso y uso de la
              plataforma tecnológica <strong>BarberProSuite</strong> (&quot;la Plataforma&quot;, &quot;nosotros&quot; o
              &quot;la Empresa&quot;), disponible mediante aplicación móvil y sitio web progresivo (PWA).
              Al registrarse o utilizar cualquiera de nuestros servicios, el usuario acepta
              íntegramente estos Términos. Si no está de acuerdo, debe abstenerse de usar la Plataforma.
            </p>
            <p>
              Estos Términos se rigen por las leyes de la <strong>República de Colombia</strong>, en particular
              la Ley 1480 de 2011 (Estatuto del Consumidor), la Ley 527 de 1999 (Comercio Electrónico),
              la Ley 1581 de 2012 (Protección de Datos Personales), el Decreto 1377 de 2013 y demás
              normas complementarias vigentes.
            </p>

            <h2>1. Identificación del responsable</h2>
            <p>
              La Plataforma es operada por <strong>BarberProSuite SAS</strong> (en proceso de constitución),
              domiciliada en Colombia. Para efectos de la Ley 1480 de 2011, actuamos como intermediario
              tecnológico entre clientes y barberos independientes. El contacto puede realizarse a través
              de la sección de{" "}
              <Link href="/soporte" className="text-gold-400 hover:underline">Soporte</Link>.
            </p>

            <h2>2. Definiciones</h2>
            <ul>
              <li><strong>Usuario:</strong> toda persona natural mayor de 13 años que accede a la Plataforma, sea en calidad de cliente o de barbero.</li>
              <li><strong>Cliente:</strong> usuario que reserva citas o se une a colas virtuales.</li>
              <li><strong>Barbero:</strong> profesional independiente que presta servicios de barbería a través de la Plataforma mediante suscripción.</li>
              <li><strong>Barbería:</strong> establecimiento registrado en la Plataforma que agrupa a uno o más barberos.</li>
              <li><strong>Cola virtual:</strong> sistema digital de gestión de turnos en tiempo real.</li>
              <li><strong>Servicio:</strong> corte, arreglo o tratamiento capilar ofrecido por un Barbero.</li>
            </ul>

            <h2>3. Registro y cuenta de usuario</h2>
            <p>
              Para acceder a los servicios es necesario crear una cuenta proporcionando información
              veraz, completa y actualizada. El usuario es el único responsable de la confidencialidad
              de sus credenciales y de toda actividad realizada desde su cuenta. Conforme al artículo 33
              de la Ley 1098 de 2006 (Código de la Infancia), los menores de 13 años no podrán
              registrarse sin autorización expresa de sus padres o representantes legales.
            </p>
            <p>
              BarberProSuite se reserva el derecho de suspender o eliminar cuentas que incumplan
              estos Términos, sin perjuicio de las acciones legales correspondientes.
            </p>

            <h2>4. Cola virtual</h2>
            <p>
              La cola virtual es un servicio gratuito para clientes. Al unirse, el usuario debe
              encontrarse a menos de 500 metros del establecimiento, verificado mediante
              geolocalización del dispositivo. El sistema avisará si el usuario se aleja más de
              500 metros durante la espera; de persistir el alejamiento, será retirado
              automáticamente de la cola.
            </p>
            <p>
              El uso indebido de la cola virtual (unirse sin intención real de asistir, manipulación
              de ubicación GPS, bots u otros medios fraudulentos) constituye una violación a estos
              Términos y puede resultar en la suspensión definitiva de la cuenta, sin perjuicio de
              las acciones civiles y penales que correspondan conforme a la Ley 1273 de 2009
              (Delitos Informáticos).
            </p>

            <h2>5. Reserva de citas y pagos</h2>
            <p>
              Al agendar una cita, el cliente realiza un pago anticipado equivalente al{" "}
              <strong>50 % del valor del servicio</strong> más una{" "}
              <strong>comisión de plataforma del 10 %</strong> calculada sobre el valor total de la
              cita. El 50 % restante se cancela directamente al barbero el día del servicio.
            </p>
            <p>
              Los pagos se procesan a través de <strong>Wompi</strong> (operador de pagos autorizado
              por la Superintendencia Financiera de Colombia), con soporte para tarjetas débito/crédito,
              PSE y Nequi. BarberProSuite no almacena datos de tarjetas de crédito; el procesamiento
              es íntegramente gestionado por Wompi bajo los estándares PCI-DSS.
            </p>

            <h2>6. Política de cancelaciones y devoluciones</h2>
            <ul>
              <li>
                <strong>Cancelación con más de 2 horas de anticipación:</strong> el cliente puede
                solicitar la devolución del 50 % pagado mediante un ticket de soporte. La comisión
                del 10 % de la plataforma no es reembolsable bajo ninguna circunstancia.
              </li>
              <li>
                <strong>Cancelación con menos de 2 horas de anticipación:</strong> no habrá lugar
                a devolución del monto pagado.
              </li>
              <li>
                Las solicitudes de devolución se gestionan en un plazo máximo de{" "}
                <strong>2 días hábiles</strong> y se realizan al mismo medio de pago original,
                conforme al artículo 47 de la Ley 1480 de 2011.
              </li>
              <li>
                Para solicitar una devolución se debe adjuntar el comprobante de pago (captura de
                pantalla o PDF de la transacción Wompi).
              </li>
            </ul>
            <p>
              Lo anterior no limita los derechos del consumidor establecidos en el Estatuto del
              Consumidor (Ley 1480 de 2011) ni las facultades de la Superintendencia de Industria
              y Comercio (SIC) para intervenir en caso de controversias.
            </p>

            <h2>7. Suscripciones para barberos</h2>
            <p>
              Los barberos deben mantener una suscripción activa para recibir clientes a través de
              la Plataforma. Las tarifas y planes se publican en la aplicación y pueden modificarse
              con un preaviso mínimo de 30 días calendario. Los pagos de suscripción procesados a
              través de Wompi no son reembolsables, salvo lo dispuesto expresamente por la ley
              colombiana.
            </p>
            <p>
              La relación entre BarberProSuite y el barbero es de naturaleza comercial independiente.
              No existe vínculo laboral alguno conforme al artículo 23 del Código Sustantivo del Trabajo.
              El barbero actúa como contratista independiente y es responsable de sus obligaciones
              tributarias ante la DIAN y de sus aportes al sistema de seguridad social conforme a
              la Ley 100 de 1993 y sus decretos reglamentarios.
            </p>

            <h2>8. Propiedad intelectual y derechos de autor</h2>
            <p>
              Todos los contenidos de la Plataforma, incluyendo pero no limitado a: código fuente,
              diseño gráfico, logotipos, textos, imágenes, íconos, flujos de pantalla, algoritmos y
              arquitectura del sistema, son propiedad exclusiva de BarberProSuite y están protegidos
              por la <strong>Ley 23 de 1982</strong> (Derechos de Autor), la{" "}
              <strong>Decisión Andina 351 de 1993</strong> y el Convenio de Berna para la Protección
              de las Obras Literarias y Artísticas.
            </p>
            <p>
              Queda estrictamente prohibido reproducir, distribuir, modificar, descompilar, realizar
              ingeniería inversa, crear obras derivadas o explotar comercialmente cualquier elemento
              de la Plataforma sin autorización escrita previa de BarberProSuite. El incumplimiento
              de esta disposición podrá dar lugar a acciones civiles por indemnización de perjuicios
              y penales conforme al artículo 270 y siguientes del Código Penal colombiano.
            </p>
            <p>
              El nombre comercial <strong>BarberProSuite</strong>, su logotipo y marcas asociadas
              están en proceso de registro ante la{" "}
              <strong>Superintendencia de Industria y Comercio (SIC)</strong>. Su uso no autorizado
              constituye una infracción al régimen marcario previsto en la Decisión 486 de la CAN.
            </p>

            <h2>9. Prohibición de plagio y uso indebido del software</h2>
            <p>
              El código fuente de BarberProSuite es software propietario y confidencial. Cualquier
              intento de copiar, clonar, reproducir total o parcialmente la aplicación, su diseño,
              flujos de usuario o lógica de negocio con fines comerciales propios o de terceros,
              constituye:
            </p>
            <ul>
              <li>Violación a la Ley 23 de 1982 y la Decisión Andina 351 de 1993.</li>
              <li>Infracción a la Ley 1273 de 2009 (delitos informáticos) si implica acceso no autorizado a sistemas.</li>
              <li>Competencia desleal bajo la Ley 256 de 1996.</li>
              <li>Posible responsabilidad civil extracontractual por daños y perjuicios.</li>
            </ul>
            <p>
              BarberProSuite se reserva el derecho de ejercer todas las acciones legales disponibles,
              incluyendo medidas cautelares, demandas civiles y denuncias penales ante la Fiscalía
              General de la Nación.
            </p>

            <h2>10. Conducta del usuario y contenido generado</h2>
            <p>
              El usuario se compromete a usar la Plataforma de buena fe y conforme a la ley. Queda
              prohibido:
            </p>
            <ul>
              <li>Publicar contenido falso, engañoso, difamatorio o que viole derechos de terceros.</li>
              <li>Usar la Plataforma para actividades ilegales o contrarias al orden público.</li>
              <li>Intentar acceder a sistemas o datos sin autorización.</li>
              <li>Suplantar la identidad de otro usuario, barbero o representante de BarberProSuite.</li>
              <li>Automatizar el uso de la Plataforma mediante bots, scrapers u otras herramientas.</li>
            </ul>

            <h2>11. Limitación de responsabilidad</h2>
            <p>
              BarberProSuite actúa como intermediario tecnológico y no es responsable de la calidad
              del servicio prestado por los barberos, cancelaciones de turno, retrasos, lesiones
              o cualquier daño derivado de la prestación del servicio. La relación contractual
              por el servicio de barbería se establece directamente entre el cliente y el barbero.
            </p>
            <p>
              En ningún caso la responsabilidad total de BarberProSuite ante un usuario superará
              el valor pagado por dicho usuario en la transacción específica objeto de la reclamación.
            </p>

            <h2>12. Protección de datos personales</h2>
            <p>
              El tratamiento de datos personales se realiza conforme a la{" "}
              <strong>Ley 1581 de 2012</strong>, el Decreto 1377 de 2013 y nuestra{" "}
              <Link href="/privacidad" className="text-gold-400 hover:underline">
                Política de Privacidad
              </Link>
              . El usuario titular tiene derecho a conocer, actualizar, rectificar y suprimir
              sus datos personales, así como a revocar la autorización de tratamiento, conforme
              al artículo 8 de la citada ley.
            </p>

            <h2>13. Modificaciones a los términos</h2>
            <p>
              BarberProSuite podrá modificar estos Términos en cualquier momento. Los cambios
              sustanciales se notificarán con un mínimo de 15 días de anticipación mediante
              aviso en la aplicación o correo electrónico. El uso continuado de la Plataforma
              tras la notificación implica la aceptación de los nuevos Términos.
            </p>

            <h2>14. Ley aplicable y resolución de controversias</h2>
            <p>
              Estos Términos se rigen exclusivamente por las leyes de la{" "}
              <strong>República de Colombia</strong>. Para cualquier controversia derivada de su
              interpretación o cumplimiento, las partes se someten a la jurisdicción de los jueces
              y tribunales de la ciudad de <strong>Bogotá D.C.</strong>, renunciando expresamente
              a cualquier otro fuero que pudiera corresponderles.
            </p>
            <p>
              Sin perjuicio de lo anterior, los usuarios podrán acudir a la{" "}
              <strong>Superintendencia de Industria y Comercio (SIC)</strong> para presentar
              reclamaciones de protección al consumidor conforme a la Ley 1480 de 2011.
            </p>

            <h2>15. Disposiciones finales</h2>
            <p>
              Si alguna disposición de estos Términos fuera declarada nula o inaplicable por una
              autoridad competente, las demás disposiciones continuarán vigentes en su totalidad.
              La no exigencia de algún derecho previsto en estos Términos no implicará renuncia
              al mismo.
            </p>

          </div>

          <div className="mt-10 p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">¿Tienes preguntas sobre estos términos?</p>
              <p className="text-white/50 text-sm">Nuestro equipo puede ayudarte a resolverlas.</p>
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
