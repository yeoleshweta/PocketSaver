-- ═══════════════════════════════════════════════════════════════════════════
-- PocketPilot Ultimate - Initial Schema Migration
-- Created: 2026-01-04
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1️⃣  USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2️⃣  SAVINGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  current             NUMERIC(12,2) DEFAULT 0,
  goal                NUMERIC(12,2) DEFAULT 0,
  weekly_contribution NUMERIC(10,2) DEFAULT 0,
  ghost_mode          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON public.savings(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3️⃣  TRANSACTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  rounded_diff  NUMERIC(10,2) DEFAULT 0,
  merchant      VARCHAR(255),
  description   TEXT,
  category      VARCHAR(50) DEFAULT 'Other',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4️⃣  SUBSCRIPTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  cost           NUMERIC(10,2) NOT NULL,
  last_used      DATE,
  suggest_cancel BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5️⃣  CATEGORIES TABLE (Lookup table for expense categories)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(50) UNIQUE NOT NULL,
  icon  VARCHAR(10),
  color VARCHAR(7) DEFAULT '#6B7280'
);

-- Insert default categories
INSERT INTO public.categories (name, icon, color) VALUES
  ('Food & Dining', '🍔', '#EF4444'),
  ('Transportation', '🚗', '#F59E0B'),
  ('Shopping', '🛍️', '#8B5CF6'),
  ('Entertainment', '🎬', '#EC4899'),
  ('Utilities', '💡', '#3B82F6'),
  ('Healthcare', '🏥', '#10B981'),
  ('Housing', '🏠', '#6366F1'),
  ('Income', '💰', '#22C55E'),
  ('Subscriptions', '📱', '#F97316'),
  ('Other', '📦', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6️⃣  BUDGETS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category      VARCHAR(50) NOT NULL,
  monthly_limit NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7️⃣  ROW LEVEL SECURITY (RLS) - Enabled for security
-- ═══════════════════════════════════════════════════════════════════════════
-- Note: We enable RLS but since you're using service_role key in the backend,
-- it bypasses these policies. This is for additional security layers.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for users table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete users"
  ON public.users
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for savings table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own savings"
  ON public.savings
  FOR ALL
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role')
  WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for transactions table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own transactions"
  ON public.transactions
  FOR ALL
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role')
  WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for subscriptions table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role')
  WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for budgets table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own budgets"
  ON public.budgets
  FOR ALL
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role')
  WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for categories table (read-only for all)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Only service role can modify categories"
  ON public.categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- 8️⃣  HELPER FUNCTION: Execute Raw SQL (for complex queries)
-- ═══════════════════════════════════════════════════════════════════════════
-- This function allows the backend to execute raw SQL when needed
-- Security: Only accessible via service_role

CREATE OR REPLACE FUNCTION public.exec_sql(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute permission to service role only
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9️⃣  TRIGGER: Auto-update updated_at timestamp
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to savings table
CREATE TRIGGER update_savings_updated_at
  BEFORE UPDATE ON public.savings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ Migration Complete!
-- ═══════════════════════════════════════════════════════════════════════════
