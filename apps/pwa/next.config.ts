import type { NextConfig } from "next";
// @ts-ignore
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Archivos que NO deben ser interceptados por el SW (evita conflictos con Next.js)
  publicExcludes: ["!og-image.png"],
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      // API de producción
      urlPattern: /^https:\/\/.*\.barberprosuite\.com\/api\/v1\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60,
        },
      },
    },
    {
      // API de Vercel (cualquier dominio vercel.app también)
      urlPattern: /\/api\/v1\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache-local",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
