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

CREATE TABLE IF NOT EXISTS fm_email_outbox (
 order_id uuid NOT NULL REFERENCES fm_orders(id),
 kind text NOT NULL CHECK(kind IN ('customer','owner')),
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 first_attempt_at timestamptz,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0,
 sent_at timestamptz,
 resend_id text,
 last_error text,
 PRIMARY KEY(order_id,kind)
);
