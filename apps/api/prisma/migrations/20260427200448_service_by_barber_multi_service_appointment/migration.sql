-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "serviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "barberId" TEXT;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barber_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
