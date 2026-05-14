import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-barber-secondary border-t border-gold-500/20 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png?v=3" alt="BarberProSuite" className="h-14 w-auto object-contain" />
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              La plataforma líder en Colombia para gestión inteligente de barberías.
              Cola virtual, citas y pagos en un solo lugar.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-xs mb-5 text-gold-500 uppercase tracking-[0.15em]">
              Producto
            </h4>
            <ul className="space-y-3">
              {["Características", "Precios", "Descargar App", "API"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 hover:text-gold-400 text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs mb-5 text-gold-500 uppercase tracking-[0.15em]">
              Empresa
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Soporte", href: "/soporte" },
                { label: "Términos y Condiciones", href: "/terminos" },
                { label: "Política de Privacidad", href: "/privacidad" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white/40 hover:text-gold-400 text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-sm">
            © {new Date().getFullYear()} BarberProSuite. Todos los derechos reservados.
          </p>
          <p className="text-white/20 text-sm">
            Hecho con ❤️ en Colombia 🇨🇴
          </p>
        </div>
      </div>
    </footer>
  );
}
