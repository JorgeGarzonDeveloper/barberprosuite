"use client";

import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Apple } from "lucide-react";
import { motion } from "framer-motion";

// URLs de las tiendas (actualizar cuando se publique la app)
const APP_STORE_URL = "https://apps.apple.com/app/barberprosuite";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.barberprosuite";

export function AppDownloadSection() {
  return (
    <section id="descargar" className="py-24 bg-barber-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Descarga la App
          </h2>
          <p className="text-white/60 text-lg">
            Disponible para iOS y Android. Escanea el QR o descarga directamente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* iOS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Apple className="w-10 h-10 text-gray-900" />
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">App Store</h3>
            <p className="text-white/50 text-sm mb-6">iOS 15 o superior</p>

            {/* QR Code iOS */}
            <div className="bg-white p-4 rounded-2xl inline-block mb-6">
              <QRCodeSVG
                value={APP_STORE_URL}
                size={140}
                level="H"
                includeMargin={false}
                fgColor="#1a1a2e"
              />
            </div>

            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full block"
            >
              Descargar en App Store
            </a>
          </motion.div>

          {/* Android */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-10 h-10 text-gray-900" />
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">Google Play</h3>
            <p className="text-white/50 text-sm mb-6">Android 8 o superior</p>

            {/* QR Code Android */}
            <div className="bg-white p-4 rounded-2xl inline-block mb-6">
              <QRCodeSVG
                value={PLAY_STORE_URL}
                size={140}
                level="H"
                includeMargin={false}
                fgColor="#1a1a2e"
              />
            </div>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full block"
            >
              Descargar en Google Play
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
