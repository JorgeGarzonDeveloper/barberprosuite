-- Add appointmentId column to reviews (idempotent)
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "appointment_id" TEXT;

-- Add unique constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_appointment_id_key'
  ) THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_key" UNIQUE ("appointment_id");
  END IF;
END$$;
