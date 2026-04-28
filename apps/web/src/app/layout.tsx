import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "BarberProSuite - Gestión Inteligente para Barberías",
    template: "%s | BarberProSuite",
  },
  description:
    "La plataforma líder en Colombia para gestión de barberías. Cola virtual, citas online, mapas y pagos integrados.",
  keywords: [
    "barbería",
    "barber",
    "citas",
    "cola virtual",
    "Colombia",
    "app barbería",
  ],
  authors: [{ name: "BarberProSuite" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://barberprosuite.com",
    title: "BarberProSuite - Gestión Inteligente para Barberías",
    description: "La plataforma líder para gestión de barberías en Colombia",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BarberProSuite",
    description: "Gestión inteligente para barberías",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
