-- Safe migration script for existing database.
-- This script is idempotent and can be executed multiple times.

-- 1) Ensure base tables exist
CREATE TABLE IF NOT EXISTS public.shelters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  address text,
  phone text,
  image_url text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT shelters_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shelter_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  age integer,
  description text,
  image_url text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_shelter_id_fkey FOREIGN KEY (shelter_id) REFERENCES public.shelters(id)
);

CREATE TABLE IF NOT EXISTS public.adopters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying NOT NULL,
  message text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT adopters_pkey PRIMARY KEY (id)
);

-- 2) Ensure adopted_pets exists with new structure
CREATE TABLE IF NOT EXISTS public.adopted_pets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  pet_name character varying NOT NULL,
  pet_type character varying NOT NULL,
  pet_breed character varying,
  pet_age integer,
  pet_gender character varying,
  pet_description text,
  pet_image_url text,
  shelter_id uuid NOT NULL,
  shelter_name character varying,
  adopter_id uuid,
  adoption_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT adopted_pets_pkey PRIMARY KEY (id)
);

ALTER TABLE public.adopted_pets
  ADD COLUMN IF NOT EXISTS adopter_id uuid;

-- 3) Backfill adopter_id from legacy columns if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'adopted_pets'
      AND column_name = 'adopter_name'
  ) THEN
    WITH to_insert AS (
      SELECT DISTINCT
        COALESCE(adopter_name, 'Unknown') AS full_name,
        COALESCE(adopter_email, 'unknown@example.com') AS email,
        COALESCE(adopter_phone, '-') AS phone,
        notes AS message
      FROM public.adopted_pets ap
      WHERE ap.adopter_id IS NULL
    ), inserted AS (
      INSERT INTO public.adopters (full_name, email, phone, message)
      SELECT ti.full_name, ti.email, ti.phone, ti.message
      FROM to_insert ti
      RETURNING id, full_name, email, phone
    )
    UPDATE public.adopted_pets ap
    SET adopter_id = ad.id
    FROM public.adopters ad
    WHERE ap.adopter_id IS NULL
      AND COALESCE(ap.adopter_name, 'Unknown') = ad.full_name
      AND COALESCE(ap.adopter_email, 'unknown@example.com') = ad.email
      AND COALESCE(ap.adopter_phone, '-') = ad.phone;
  END IF;
END $$;

-- 4) Ensure foreign keys on adopted_pets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_adopter' AND conrelid = 'public.adopted_pets'::regclass
  ) THEN
    ALTER TABLE public.adopted_pets
      ADD CONSTRAINT fk_adopter FOREIGN KEY (adopter_id) REFERENCES public.adopters(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_pet' AND conrelid = 'public.adopted_pets'::regclass
  ) THEN
    ALTER TABLE public.adopted_pets
      ADD CONSTRAINT fk_pet FOREIGN KEY (pet_id) REFERENCES public.pets(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_shelter' AND conrelid = 'public.adopted_pets'::regclass
  ) THEN
    ALTER TABLE public.adopted_pets
      ADD CONSTRAINT fk_shelter FOREIGN KEY (shelter_id) REFERENCES public.shelters(id);
  END IF;
END $$;

-- 5) Ensure adoption_requests exists
CREATE TABLE IF NOT EXISTS public.adoption_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  adopter_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'pending',
  requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  reviewed_at timestamp without time zone,
  reviewed_by character varying,
  admin_notes text,
  adopted_pet_id uuid,
  CONSTRAINT adoption_requests_pkey PRIMARY KEY (id)
);

ALTER TABLE public.adoption_requests
  ADD COLUMN IF NOT EXISTS requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS reviewed_by character varying,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS adopted_pet_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'adoption_requests_status_check' AND conrelid = 'public.adoption_requests'::regclass
  ) THEN
    ALTER TABLE public.adoption_requests
      ADD CONSTRAINT adoption_requests_status_check CHECK (
        status::text = ANY (
          ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[]
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_adoption_request_adopter' AND conrelid = 'public.adoption_requests'::regclass
  ) THEN
    ALTER TABLE public.adoption_requests
      ADD CONSTRAINT fk_adoption_request_adopter FOREIGN KEY (adopter_id) REFERENCES public.adopters(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_adoption_request_pet' AND conrelid = 'public.adoption_requests'::regclass
  ) THEN
    ALTER TABLE public.adoption_requests
      ADD CONSTRAINT fk_adoption_request_pet FOREIGN KEY (pet_id) REFERENCES public.pets(id);
  END IF;
END $$;
