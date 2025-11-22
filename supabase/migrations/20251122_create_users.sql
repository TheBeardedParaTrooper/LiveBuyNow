-- Create users table for Postgres-based auth
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Optionally create an index on email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

-- Row level security and policies are not set here; ensure your deployment database secures access.
