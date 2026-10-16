CREATE TABLE IF NOT EXISTS fm_orders (
 id uuid PRIMARY KEY, token text NOT NULL UNIQUE, tier text NOT NULL CHECK(tier IN ('99','259','459')),
 customer jsonb NOT NULL, mode text NOT NULL CHECK(mode IN ('test','live')),
 state text NOT NULL DEFAULT 'creating', payment_id text UNIQUE, checkout_url text,
 member_number integer CHECK(member_number BETWEEN 1 AND 100), paid_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(mode,member_number)
);
CREATE INDEX IF NOT EXISTS fm_capacity ON fm_orders(mode,state);
-- No browser access or public REST access to this table. DATABASE_URL is server-only.
