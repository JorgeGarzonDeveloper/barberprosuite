import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidad — BarberProSuite",
  description: "Política de privacidad y tratamiento de datos personales de BarberProSuite. Cumplimiento Ley 1581 de 2012.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
            <Link href="/" className="hover:text-gold-400 transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white/60">Política de Privacidad</span>
          </div>

          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Política de <span className="text-gold-400">Privacidad</span>
          </h1>
          <p className="text-white/40 text-sm mb-10">Última actualización: 13 de mayo de 2026 · Versión 2.0</p>

          <div className="prose-legal">

            <p>
              La presente Política de Privacidad y Tratamiento de Datos Personales
              (&quot;Política&quot;) de <strong>BarberProSuite</strong> (&quot;la Empresa&quot;,
              &quot;nosotros&quot;) establece las condiciones bajo las cuales recopilamos, almacenamos,
              usamos, circulamos y suprimimos los datos personales de nuestros usuarios, en
              cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> (Protección de Datos
              Personales), el <strong>Decreto Reglamentario 1377 de 2013</strong>, la{" "}
              <strong>Circular Única de la SIC</strong> y demás normas aplicables en Colombia.
            </p>
            <p>
              Al usar la Plataforma usted reconoce haber leído, entendido y aceptado esta Política.
              Si es menor de 18 años, su representante legal debe autorizar expresamente el
              tratamiento de sus datos.
            </p>

            <h2>1. Responsable del tratamiento</h2>
            <p>
              <strong>BarberProSuite SAS</strong> (en proceso de constitución), domiciliada en
              Colombia. Contacto para asuntos de privacidad:{" "}
              <Link href="/soporte" className="text-gold-400 hover:underline">formulario de soporte</Link>.
            </p>

            <h2>2. Marco legal aplicable</h2>
            <ul>
              <li>Ley 1581 de 2012 — Protección de Datos Personales.</li>
              <li>Decreto 1377 de 2013 — Reglamentación parcial de la Ley 1581.</li>
              <li>Decreto 886 de 2014 — Registro Nacional de Bases de Datos (RNBD).</li>
              <li>Ley 527 de 1999 — Comercio Electrónico y Firmas Digitales.</li>
              <li>Ley 1480 de 2011 — Estatuto del Consumidor.</li>
              <li>Circular 002 de 2015 y Circular Única de la SIC.</li>
            </ul>

            <h2>3. Datos personales que recopilamos</h2>
            <p>Recopilamos las siguientes categorías de datos:</p>
            <ul>
              <li>
                <strong>Datos de identificación:</strong> nombre completo, número de teléfono,
                dirección de correo electrónico.
              </li>
              <li>
                <strong>Credenciales de acceso:</strong> contraseña almacenada con hash bcrypt
                (nunca en texto plano).
              </li>
              <li>
                <strong>Datos de ubicación:</strong> coordenadas GPS en tiempo real para verificar
                proximidad a barberías y gestionar la cola virtual. La ubicación en segundo plano
                se usa exclusivamente para alertar al usuario si se aleja durante su turno.
              </li>
              <li>
                <strong>Datos de dispositivo:</strong> token de notificaciones push (FCM/VAPID),
                sistema operativo, versión de la aplicación.
              </li>
              <li>
                <strong>Fotografías:</strong> foto de perfil y, en el caso de barberos,
                imágenes de la barbería, cargadas voluntariamente por el usuario.
              </li>
              <li>
                <strong>Datos de transacciones:</strong> historial de citas, pagos y suscripciones
                procesados a través de Wompi. Los datos de tarjetas de crédito son procesados
                exclusivamente por Wompi y no son almacenados por BarberProSuite.
              </li>
              <li>
                <strong>Comprobantes de soporte:</strong> imágenes adjuntas en solicitudes de
                devolución (almacenadas en AWS S3 con acceso restringido).
              </li>
              <li>
                <strong>Comunicaciones:</strong> mensajes enviados a través del chat de soporte.
              </li>
            </ul>
            <p>
              <strong>Datos sensibles:</strong> BarberProSuite no recopila datos sensibles en los
              términos del artículo 5 de la Ley 1581 de 2012 (origen racial, salud, vida sexual,
              datos biométricos, afiliación política o sindical).
            </p>

            <h2>4. Finalidades del tratamiento</h2>
            <p>Sus datos son tratados para las siguientes finalidades:</p>
            <ul>
              <li>Crear y gestionar su cuenta de usuario en la Plataforma.</li>
              <li>Conectarle con barberías cercanas mediante geolocalización.</li>
              <li>Gestionar colas virtuales y reservas de citas.</li>
              <li>Procesar pagos de servicios y suscripciones a través de Wompi.</li>
              <li>Enviar notificaciones push sobre el estado de su turno o cita.</li>
              <li>Gestionar solicitudes de soporte y devoluciones.</li>
              <li>Cumplir obligaciones legales, contables y tributarias.</li>
              <li>Mejorar la Plataforma mediante análisis de uso agregado y anonimizado.</li>
              <li>Prevenir fraudes y garantizar la seguridad de la Plataforma.</li>
              <li>Enviar comunicaciones relacionadas con actualizaciones del servicio (con posibilidad de opt-out).</li>
            </ul>

            <h2>5. Base legal del tratamiento</h2>
            <p>
              El tratamiento de sus datos se fundamenta en: (i) su <strong>consentimiento libre,
              previo, expreso e informado</strong> otorgado al aceptar esta Política; (ii) la
              ejecución del contrato de uso de la Plataforma; y (iii) el cumplimiento de
              obligaciones legales, conforme al artículo 6 de la Ley 1581 de 2012.
            </p>

            <h2>6. Transferencia y transmisión de datos</h2>
            <p>
              BarberProSuite no vende ni cede sus datos personales a terceros con fines
              publicitarios. Compartimos datos únicamente con:
            </p>
            <ul>
              <li>
                <strong>Barberos registrados:</strong> nombre y datos básicos de contacto para
                gestionar turnos y citas.
              </li>
              <li>
                <strong>Wompi (Bancolombia):</strong> procesador de pagos autorizado por la
                Superintendencia Financiera de Colombia, para procesar transacciones.
              </li>
              <li>
                <strong>Firebase (Google LLC):</strong> servicio de notificaciones push y
                autenticación. Google actúa como encargado del tratamiento bajo las políticas
                de privacidad de Google Cloud.
              </li>
              <li>
                <strong>AWS (Amazon Web Services):</strong> almacenamiento de imágenes y archivos
                adjuntos en servidores con cifrado en reposo (AES-256).
              </li>
              <li>
                <strong>Railway:</strong> proveedor de infraestructura de servidores para el
                backend de la aplicación.
              </li>
            </ul>
            <p>
              Las transferencias internacionales de datos a proveedores en el exterior se realizan
              bajo los principios de la Ley 1581 de 2012 y con garantías contractuales adecuadas
              conforme al artículo 26 de la misma ley y la Circular 005 de 2017 de la SIC.
            </p>

            <h2>7. Medidas de seguridad</h2>
            <p>
              Implementamos medidas técnicas, administrativas y físicas para proteger sus datos:
            </p>
            <ul>
              <li>Cifrado HTTPS/TLS en todas las comunicaciones entre la aplicación y nuestros servidores.</li>
              <li>Contraseñas almacenadas con hash bcrypt (salt rounds: 12).</li>
              <li>Tokens de sesión almacenados en Secure Store del dispositivo (nunca en texto plano).</li>
              <li>Imágenes y archivos en AWS S3 con control de acceso por IAM y cifrado AES-256 en reposo.</li>
              <li>Acceso a la base de datos restringido por credenciales y red privada (VPN Railway).</li>
              <li>Auditorías periódicas de seguridad y monitoreo de accesos.</li>
            </ul>

            <h2>8. Derechos del titular (Habeas Data)</h2>
            <p>
              De conformidad con el artículo 8 de la Ley 1581 de 2012, usted tiene derecho a:
            </p>
            <ul>
              <li><strong>Conocer</strong> los datos personales que tenemos sobre usted.</li>
              <li><strong>Actualizar y rectificar</strong> datos inexactos o incompletos.</li>
              <li><strong>Suprimir</strong> sus datos cuando ya no sean necesarios para las finalidades autorizadas o cuando haya revocado el consentimiento.</li>
              <li><strong>Revocar</strong> la autorización de tratamiento en cualquier momento, sin efecto retroactivo.</li>
              <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la Ley 1581 de 2012.</li>
              <li><strong>Acceder gratuitamente</strong> a sus datos al menos una vez al mes o cuando existan modificaciones sustanciales.</li>
            </ul>
            <p>
              Para ejercer estos derechos, diríjase a nuestra sección de{" "}
              <Link href="/soporte" className="text-gold-400 hover:underline">Soporte</Link>.
              Atenderemos su solicitud en los plazos previstos por la ley (10 días hábiles para
              consultas; 15 días hábiles para reclamos, prorrogables por 8 días más).
            </p>

            <h2>9. Conservación de los datos</h2>
            <p>
              Conservamos sus datos personales durante el tiempo en que mantenga una cuenta activa
              en la Plataforma y hasta 5 años después de su eliminación, para efectos de auditoría,
              obligaciones contables y tributarias conforme al Código de Comercio. Los datos de
              transacciones se conservan por el período exigido por la DIAN.
            </p>

            <h2>10. Cookies y tecnologías de seguimiento</h2>
            <p>
              El sitio web utiliza cookies técnicas necesarias para el funcionamiento de la
              Plataforma (sesión, preferencias). No utilizamos cookies publicitarias ni de
              rastreo de terceros. Puede configurar su navegador para rechazar cookies, aunque
              esto podría afectar la funcionalidad del sitio.
            </p>

            <h2>11. Menores de edad</h2>
            <p>
              Conforme al artículo 7 de la Ley 1581 de 2012 y el Código de la Infancia y la
              Adolescencia (Ley 1098 de 2006), el tratamiento de datos de menores de 18 años
              requiere autorización de sus padres o representantes legales. Los usuarios menores
              de 13 años tienen prohibido el registro independiente en la Plataforma.
            </p>

            <h2>12. Autorización de tratamiento</h2>
            <p>
              Al crear su cuenta o usar la Plataforma, usted otorga autorización libre, previa,
              expresa e informada para el tratamiento de sus datos personales conforme a esta
              Política, tal como lo exige el artículo 9 de la Ley 1581 de 2012. Esta autorización
              se almacena con fecha y hora de aceptación como parte del registro del usuario.
            </p>

            <h2>13. Registro Nacional de Bases de Datos</h2>
            <p>
              BarberProSuite registrará sus bases de datos ante el{" "}
              <strong>Registro Nacional de Bases de Datos (RNBD)</strong> de la SIC, conforme
              al Decreto 886 de 2014 y la Resolución 76434 de 2012, en los plazos legalmente
              establecidos.
            </p>

            <h2>14. Modificaciones a la política</h2>
            <p>
              Podemos actualizar esta Política periódicamente. Los cambios sustanciales serán
              notificados con al menos 10 días de anticipación mediante aviso en la aplicación
              o correo electrónico. La versión vigente siempre estará disponible en{" "}
              <Link href="/privacidad" className="text-gold-400 hover:underline">barberprosuite.com/privacidad</Link>.
            </p>

            <h2>15. Contacto y supervisión</h2>
            <p>
              Para cualquier consulta, reclamo o ejercicio de sus derechos como titular, comuníquese
              a través de nuestra sección de{" "}
              <Link href="/soporte" className="text-gold-400 hover:underline">Soporte y Ayuda</Link>.
              Si no obtiene respuesta satisfactoria, puede presentar una queja ante la{" "}
              <strong>Superintendencia de Industria y Comercio (SIC)</strong> a través de{" "}
              <strong>www.sic.gov.co</strong>.
            </p>

          </div>

          <div className="mt-10 p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">¿Dudas sobre tus datos personales?</p>
              <p className="text-white/50 text-sm">Ejerce tus derechos de Habeas Data con nuestro equipo.</p>
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
