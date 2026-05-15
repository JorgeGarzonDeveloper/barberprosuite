-- CreateEnum
CREATE TYPE "BarberPayoutStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PAID');

-- CreateTable
CREATE TABLE "barber_payout_records" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "barbershopId" TEXT,
    "status" "BarberPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "proofUrl" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_payout_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "barber_payout_records_barberId_idx" ON "barber_payout_records"("barberId");

-- CreateIndex
CREATE INDEX "barber_payout_records_status_idx" ON "barber_payout_records"("status");

-- AddForeignKey
ALTER TABLE "barber_payout_records" ADD CONSTRAINT "barber_payout_records_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_payout_records" ADD CONSTRAINT "barber_payout_records_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
