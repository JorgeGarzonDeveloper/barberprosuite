-- Rename column from snake_case to camelCase to match the rest of the schema
ALTER TABLE "reviews" RENAME COLUMN "appointment_id" TO "appointmentId";

-- Rename the unique constraint accordingly
ALTER TABLE "reviews" RENAME CONSTRAINT "reviews_appointment_id_key" TO "reviews_appointmentId_key";
