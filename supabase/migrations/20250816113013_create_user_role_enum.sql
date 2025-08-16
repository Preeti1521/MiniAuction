-- Create user_role enum type if it does not exist
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('anon', 'authenticated', 'service_role', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Grant usage on the new type to the public role
GRANT USAGE ON TYPE public.user_role TO public;