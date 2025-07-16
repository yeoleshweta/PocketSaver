-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- savings
CREATE TABLE IF NOT EXISTS savings (
  user_id INTEGER REFERENCES users(id) PRIMARY KEY,
  current NUMERIC DEFAULT 0,
  goal NUMERIC DEFAULT 0,
  weekly_contribution NUMERIC DEFAULT 0
);

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount NUMERIC NOT NULL,
  rounded_diff NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  cost NUMERIC NOT NULL,
  last_used DATE,
  suggest_cancel BOOLEAN DEFAULT FALSE
);