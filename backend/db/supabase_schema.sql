-- ═══════════════════════════════════════════════════════════════════════════
-- PocketPilot Ultimate - Supabase Database Schema
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1️⃣  USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2️⃣  SAVINGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current             NUMERIC(12,2) DEFAULT 0,
  goal                NUMERIC(12,2) DEFAULT 0,
  weekly_contribution NUMERIC(10,2) DEFAULT 0,
  ghost_mode          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3️⃣  TRANSACTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  rounded_diff  NUMERIC(10,2) DEFAULT 0,
  merchant      VARCHAR(255),
  description   TEXT,
  category      VARCHAR(50) DEFAULT 'Other',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4️⃣  SUBSCRIPTIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  cost           NUMERIC(10,2) NOT NULL,
  last_used      DATE,
  suggest_cancel BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5️⃣  CATEGORIES TABLE (Lookup table for expense categories)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(50) UNIQUE NOT NULL,
  icon  VARCHAR(10),
  color VARCHAR(7) DEFAULT '#6B7280'
);

-- Insert default categories
INSERT INTO categories (name, icon, color) VALUES
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
CREATE TABLE IF NOT EXISTS budgets (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      VARCHAR(50) NOT NULL,
  monthly_limit NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7️⃣  ROW LEVEL SECURITY (RLS) - Optional but Recommended
-- ═══════════════════════════════════════════════════════════════════════════
-- Note: Since we're using service_role key in the backend, RLS is bypassed.
-- If you want to add RLS for additional security layers, uncomment below:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8️⃣  HELPER FUNCTION: Execute Raw SQL (for complex queries)
-- ═══════════════════════════════════════════════════════════════════════════
-- This function allows the backend to execute raw SQL when needed

CREATE OR REPLACE FUNCTION exec_sql(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ Schema setup complete!
-- ═══════════════════════════════════════════════════════════════════════════
