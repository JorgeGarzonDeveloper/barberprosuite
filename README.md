# BarberProSuite 💈

Plataforma integral para gestión de barberías en Colombia. App móvil iOS/Android, página web informativa y panel administrativo.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                 │
│  iOS App │ Android App │  Web Browser (Landing + Admin Panel)   │
└────┬────────────┬──────────────────┬───────────────────────────┘
     │            │                  │
     ▼            ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CDN / Cloudflare                              │
│              (DDoS, WAF, Cache global)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              NGINX (Load Balancer + Reverse Proxy)               │
│     Rate Limiting │ SSL/TLS │ Gzip │ WebSocket Upgrade           │
└──────────┬────────────────────────────────────┬─────────────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────┐              ┌──────────────────────┐
│   Next.js (Web)     │              │  NestJS API (x3)     │
│   Port: 3002        │              │  Port: 3000          │
│                     │              │                      │
│  • Landing page     │              │  REST API + Swagger  │
│  • Admin panel      │              │  WebSocket Gateway   │
│  • QR download      │              │  Bull Queue Workers  │
│  • Maps integrado   │              │  Cron Jobs           │
└─────────────────────┘              └──────────┬───────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                          ▼                    ▼                    ▼
               ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
               │  PostgreSQL 16   │  │  Redis 7     │  │  AWS S3          │
               │                  │  │              │  │  (Imágenes)      │
               │  • Usuarios      │  │  • Cola virt │  └──────────────────┘
               │  • Barberías     │  │  • Cache     │
               │  • Citas         │  │  • Sessions  │
               │  • Suscripciones │  │  • Bull Jobs │
               │  • Pagos         │  └──────────────┘
               │  • Notificaciones│
               └──────────────────┘

Servicios externos:
  • Firebase FCM     → Notificaciones push iOS/Android
  • Google Maps API  → Mapa interactivo y geocodificación
  • Wompi            → Pagos PSE, tarjeta, Nequi, DaviPlata
  • SendGrid         → Emails transaccionales
  • Twilio           → SMS de recordatorio
```

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Monorepo** | Turborepo + pnpm | Builds incrementales, caché compartida |
| **Backend** | NestJS (TypeScript) | Modular, decoradores, DI, escalable |
| **ORM** | Prisma | Type-safe, migraciones automáticas |
| **Base de datos** | PostgreSQL 16 | ACID, índices, búsqueda full-text |
| **Cache / Queue** | Redis 7 + Bull | Cola virtual en tiempo real |
| **WebSockets** | Socket.io | Cola virtual en tiempo real |
| **Web Frontend** | Next.js 15 (App Router) | SSR, SEO, performance |
| **Mobile** | React Native + Expo | iOS y Android con un solo código |
| **Notificaciones** | Firebase FCM | Push iOS/Android nativos |
| **Mapas** | Google Maps + react-native-maps | Estándar en Colombia |
| **Pagos** | Wompi | Pasarela local Colombia (PSE, Nequi) |
| **Contenedores** | Docker + Docker Compose | Ambiente reproducible |
| **Orquestación** | Kubernetes | Auto-scaling, alta disponibilidad |
| **CI/CD** | GitHub Actions | Automatización completa |
| **Proxy** | Nginx | Load balancer, SSL, rate limiting |

---

## Módulos del Sistema

### Backend (NestJS)

```
src/
├── modules/
│   ├── auth/           # JWT, refresh tokens, estrategias Passport
│   ├── users/          # Perfiles cliente y barbero
│   ├── barbershops/    # CRUD barberías, QR, reseñas
│   ├── appointments/   # Citas, slots, recordatorios
│   ├── queue/          # Cola virtual + geofencing 500m
│   │   ├── queue.service.ts    # Lógica de fila
│   │   ├── queue.gateway.ts    # WebSocket tiempo real
│   │   └── queue.processor.ts  # Jobs Bull (geofence checks)
│   ├── subscriptions/  # Planes, cron de vencimiento
│   ├── payments/       # Wompi PSE/Nequi/tarjeta
│   ├── notifications/  # Firebase FCM push
│   ├── geo/            # Cálculo distancias Haversine
│   └── admin/          # Panel de control global
├── prisma/             # Conexión a PostgreSQL
└── common/
    ├── decorators/     # @CurrentUser, @Roles
    ├── guards/         # RolesGuard
    ├── filters/        # HttpExceptionFilter
    └── interceptors/   # Transform, Logging
```

### Cola Virtual (Flujo completo)

```
1. Barbería genera QR único (qrSecret almacenado en BD)
2. Cliente escanea QR con la app
3. App verifica ubicación (< 500m de la barbería)
4. POST /api/v1/queue/join → se crea QueueEntry con posición
5. Bull Job se registra: check-geofence cada 30 segundos
6. Cliente actualiza ubicación vía PATCH /queue/location
7. WebSocket emite actualizaciones a toda la sala
8. Si cliente > 500m → notificación push de advertencia
9. Si cliente > 500m y no regresa → pierde turno automáticamente
10. Barbero llama POST /queue/call-next → cliente recibe push "¡Es tu turno!"
```

---

## Setup Rápido

### Prerequisitos
- Docker Desktop
- Node.js 20+
- pnpm 10+

### Instalación

```bash
# 1. Clonar y entrar al proyecto
cd BARBERPROSUITE

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# 3. Levantar infraestructura (PostgreSQL + Redis + Nginx)
pnpm docker:dev

# 4. Instalar dependencias
pnpm install

# 5. Migrar base de datos
pnpm db:migrate

# 6. Poblar datos de prueba
pnpm db:seed

# 7. Iniciar desarrollo
pnpm dev
```

### URLs de desarrollo

| Servicio | URL |
|---------|-----|
| API REST | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| Web / Landing | http://localhost:3002 |
| Admin Panel | http://localhost:3002/admin |
| Adminer (DB UI) | http://localhost:8080 |

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@barberprosuite.com | Admin@2025! |
| Dueño barbería | owner@demo.com | Barber@2025! |

---

## Variables de Entorno Críticas

```env
# Pagos (Wompi Colombia)
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Firebase (notificaciones push)
FIREBASE_PROJECT_ID=barberprosuite
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Base de datos
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

## Escalabilidad

### Capacidad estimada por nivel

| Nivel | Infraestructura | Usuarios concurrentes |
|-------|----------------|----------------------|
| Startup | 1 VPS + Docker | ~500 |
| Crecimiento | Kubernetes 3 nodos | ~5,000 |
| Escala | K8s HPA + ElastiCache | ~50,000+ |

### Puntos clave de escalado
- **API**: Horizontal scaling con HPA (min 3, max 10 pods)
- **WebSockets**: Redis pub/sub para sincronizar entre pods
- **BD**: Read replicas para queries de lectura
- **Cola Virtual**: Redis como backend de Bull garantiza persistencia
- **CDN**: Assets estáticos en CloudFront/Cloudflare

---

## Despliegue en Producción

### AWS (Recomendado)

```
AWS EKS (Kubernetes)
  ├── EC2 Nodes (t3.medium × 3-10)
  ├── RDS PostgreSQL (db.t3.medium, Multi-AZ)
  ├── ElastiCache Redis (cache.t3.micro)
  ├── S3 (imágenes y assets)
  ├── CloudFront (CDN)
  └── ACM (certificados SSL)
```

### Alternativa económica (Colombia)

```
DigitalOcean App Platform
  ├── API: 3 instancias Basic ($12/mes c/u)
  ├── Web: 1 instancia Basic ($12/mes)
  ├── PostgreSQL Managed ($15/mes)
  └── Redis Managed ($15/mes)
Total: ~$66/mes para comenzar
```

---

## Publicación de la App Móvil

### Android (Google Play)
```bash
cd apps/mobile
pnpm build:android   # Genera APK/AAB con EAS Build
pnpm submit:android  # Sube a Google Play Console
```

### iOS (App Store)
```bash
pnpm build:ios       # Genera IPA con EAS Build
pnpm submit:ios      # Sube a App Store Connect
```

---

## Seguridad

- JWT con refresh token rotation
- Bcrypt (12 rounds) para contraseñas
- Rate limiting por IP en Nginx y NestJS
- Validación de inputs con class-validator
- Helmet.js para headers de seguridad
- HTTPS obligatorio en producción
- Webhook signature verification (Wompi)
- QR secrets únicos por barbería
- RolesGuard en todos los endpoints sensibles

---

## Licencia

Copyright © 2025 BarberProSuite. Todos los derechos reservados.
