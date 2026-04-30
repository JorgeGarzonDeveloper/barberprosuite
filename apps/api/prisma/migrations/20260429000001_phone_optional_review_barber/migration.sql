-- Migration: phone optional in barbershops, barber relation in reviews, appointmentId in reviews

-- Make phone optional in barbershops
ALTER TABLE "barbershops" ALTER COLUMN "phone" DROP NOT NULL;

-- Add appointmentId to reviews (unique to prevent double reviews per appointment)
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "appointment_id" TEXT;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_key" UNIQUE ("appointment_id");
