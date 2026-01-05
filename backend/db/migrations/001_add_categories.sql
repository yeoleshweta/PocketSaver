-- Migration: Add expense categories to transactions
-- Run this after init.sql

-- Add category column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Other',
ADD COLUMN IF NOT EXISTS merchant VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create categories lookup table for budgeting
CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(50) UNIQUE NOT NULL,
  icon          VARCHAR(10),
  color         VARCHAR(7) DEFAULT '#6B7280'
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

-- Create user budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      VARCHAR(50) NOT NULL,
  monthly_limit NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, created_at);
