-- backend/db/init.sql
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT             NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings (
  user_id            INTEGER REFERENCES users(id) PRIMARY KEY,
  current            NUMERIC DEFAULT 0,
  goal               NUMERIC DEFAULT 0,
  weekly_contribution NUMERIC DEFAULT 0,
  ghost_mode         BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS transactions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  rounded_diff  NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  cost           NUMERIC NOT NULL,
  last_used      DATE,
  suggest_cancel BOOLEAN DEFAULT FALSE
);