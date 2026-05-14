"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌱 Seeding database...");
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
            role: client_1.UserRole.ADMIN,
            status: client_1.UserStatus.ACTIVE,
            emailVerified: true,
        },
    });
    console.log("✅ Admin created:", admin.email);
    await prisma.plan.updateMany({
        where: { name: { in: ["basic", "professional", "premium"] } },
        data: { isActive: false },
    });
    const plans = await Promise.all([
        prisma.plan.upsert({
            where: { name: "pro" },
            update: {
                displayName: "BarberPro",
                description: "Todo lo que tu barbería necesita",
                priceMonthly: 59900,
                priceYearly: 599000,
                maxBarbers: -1,
                maxAppointmentsPerMonth: -1,
                isActive: true,
                features: [
                    "Cola virtual ilimitada",
                    "Citas ilimitadas",
                    "QR personalizado",
                    "Estadísticas avanzadas",
                    "Pagos online con Wompi",
                    "Notificaciones push",
                    "Panel admin completo",
                    "Soporte prioritario",
                    "Primer mes a mitad de precio ($29.950)",
                ],
            },
            create: {
                name: "pro",
                displayName: "BarberPro",
                description: "Todo lo que tu barbería necesita",
                priceMonthly: 59900,
                priceYearly: 599000,
                maxBarbers: -1,
                maxAppointmentsPerMonth: -1,
                features: [
                    "Cola virtual ilimitada",
                    "Citas ilimitadas",
                    "QR personalizado",
                    "Estadísticas avanzadas",
                    "Pagos online con Wompi",
                    "Notificaciones push",
                    "Panel admin completo",
                    "Soporte prioritario",
                    "Primer mes a mitad de precio ($29.950)",
                ],
            },
        }),
    ]);
    console.log(`✅ ${plans.length} plan creado`);
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
            role: client_1.UserRole.BARBER,
            status: client_1.UserStatus.ACTIVE,
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
//# sourceMappingURL=seed.js.map