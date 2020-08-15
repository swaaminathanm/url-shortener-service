CREATE TABLE IF NOT EXISTS public.new_keys (
   "key" VARCHAR(6) PRIMARY KEY,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.used_keys (
   "key" VARCHAR(6) PRIMARY KEY,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() NOT NULL
);

