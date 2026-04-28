import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("Admin@2025!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@barberprosuite.com" },
    update: {},
    create: {
      email: "admin@barberprosuite.com",
      phone: "+573001234567",
      firstName: "Super",
      lastName: "Admin",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: "basic" },
      update: {},
      create: {
        name: "basic",
        displayName: "Básico",
        description: "Perfecto para barberías pequeñas",
        priceMonthly: 49900,
        priceYearly: 499000,
        maxBarbers: 2,
        maxAppointmentsPerMonth: 100,
        features: [
          "Gestión de citas",
          "Cola virtual",
          "Perfil de barbería",
          "Notificaciones básicas",
        ],
      },
    }),
    prisma.plan.upsert({
      where: { name: "professional" },
      update: {},
      create: {
        name: "professional",
        displayName: "Profesional",
        description: "Para barberías en crecimiento",
        priceMonthly: 99900,
        priceYearly: 999000,
        maxBarbers: 5,
        maxAppointmentsPerMonth: 500,
        features: [
          "Todo lo del plan Básico",
          "Hasta 5 barberos",
          "Estadísticas avanzadas",
          "Pagos en línea",
          "Soporte prioritario",
        ],
      },
    }),
    prisma.plan.upsert({
      where: { name: "premium" },
      update: {},
      create: {
        name: "premium",
        displayName: "Premium",
        description: "Para cadenas y franquicias",
        priceMonthly: 199900,
        priceYearly: 1999000,
        maxBarbers: -1, // Ilimitado
        maxAppointmentsPerMonth: -1,
        features: [
          "Todo lo del plan Profesional",
          "Barberos ilimitados",
          "Multi-sucursal",
          "API access",
          "Branding personalizado",
          "Soporte 24/7",
        ],
      },
    }),
  ]);
  console.log(`✅ ${plans.length} planes creados`);

  // Demo barbershop
  const ownerHash = await bcrypt.hash("Barber@2025!", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: {
      email: "owner@demo.com",
      phone: "+573009876543",
      firstName: "Carlos",
      lastName: "Ramírez",
      passwordHash: ownerHash,
      role: UserRole.BARBER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const demoShop = await prisma.barbershop.upsert({
    where: { slug: "elite-barber-shop" },
    update: {},
    create: {
      name: "Elite Barber Shop",
      slug: "elite-barber-shop",
      description: "La mejor barbería de la ciudad",
      address: "Calle 72 #10-34",
      city: "Bogotá",
      state: "Cundinamarca",
      country: "CO",
      latitude: 4.6721,
      longitude: -74.0447,
      phone: "+573001234500",
      email: "elite@barbershop.com",
      ownerId: owner.id,
      workingHours: [
        { dayOfWeek: 1, openTime: "08:00", closeTime: "19:00", isOpen: true },
        { dayOfWeek: 2, openTime: "08:00", closeTime: "19:00", isOpen: true },
        { dayOfWeek: 3, openTime: "08:00", closeTime: "19:00", isOpen: true },
        { dayOfWeek: 4, openTime: "08:00", closeTime: "19:00", isOpen: true },
        { dayOfWeek: 5, openTime: "08:00", closeTime: "19:00", isOpen: true },
        { dayOfWeek: 6, openTime: "09:00", closeTime: "17:00", isOpen: true },
        { dayOfWeek: 0, openTime: "10:00", closeTime: "15:00", isOpen: false },
      ],
    },
  });

  // Services
  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      {
        barbershopId: demoShop.id,
        name: "Corte clásico",
        durationMinutes: 30,
        price: 25000,
      },
      {
        barbershopId: demoShop.id,
        name: "Corte + barba",
        durationMinutes: 45,
        price: 40000,
      },
      {
        barbershopId: demoShop.id,
        name: "Corte fade",
        durationMinutes: 45,
        price: 35000,
      },
      {
        barbershopId: demoShop.id,
        name: "Afeitado con navaja",
        durationMinutes: 30,
        price: 20000,
      },
    ],
  });

  console.log("✅ Demo barbershop creada:", demoShop.name);
  console.log("\n🎉 Seed completado exitosamente!");
  console.log("📧 Admin: admin@barberprosuite.com | 🔑 Admin@2025!");
  console.log("📧 Demo owner: owner@demo.com | 🔑 Barber@2025!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
