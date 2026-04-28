-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'QUEUE_CLIENT_JOINED';
ALTER TYPE "NotificationType" ADD VALUE 'QUEUE_CLIENT_LEFT';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_BOOKED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "barberAmount" DOUBLE PRECISION,
ADD COLUMN     "commissionAmount" DOUBLE PRECISION;
