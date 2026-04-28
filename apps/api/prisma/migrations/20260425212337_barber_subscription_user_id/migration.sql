-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_barbershopId_fkey";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "barbershopId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
