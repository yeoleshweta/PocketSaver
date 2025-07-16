// backend/server.js

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cron    = require('node-cron');
const pool    = require('./db.js');

const {
  PORT     = '5000',
  JWT_SECRET,
  CORS_ORIGIN = '*'
} = process.env;

// sanity‐check required env
if (!JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET');
  process.exit(1);
}

// 1) CREATE TABLES ON STARTUP
;(async () => {
  try {
    // users (with ghost_mode)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        ghost_mode BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // savings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS savings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        current NUMERIC NOT NULL DEFAULT 0,
        goal NUMERIC NOT NULL DEFAULT 0,
        weekly_contribution NUMERIC NOT NULL DEFAULT 0
      );
    `);

    // transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC NOT NULL,
        rounded_diff NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // subscriptions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        cost NUMERIC NOT NULL,
        last_used DATE,
        suggest_cancel BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    console.log('✅ All dashboard tables are ready');
  } catch (err) {
    console.error('🔥 Error initializing DB:', err);
    process.exit(1);
  }
})();

const app = express();

// 2) MIDDLEWARE
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// 3) AUTH HELPERS
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing authorization header' });

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, iat, exp }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// 4) HEALTH CHECK
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 5) REGISTER
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [email, hash]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ success: false, message: 'Email already in use' });
    } else {
      console.error(err);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
});

// 6) LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, email, password FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// 7) DASHBOARD DATA
app.get('/api/dashboard', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows: [savings] } = await pool.query(
      'SELECT current, goal, weekly_contribution FROM savings WHERE user_id = $1',
      [userId]
    );
    const { rows: subscriptions } = await pool.query(
      'SELECT name, cost, last_used, suggest_cancel FROM subscriptions WHERE user_id = $1',
      [userId]
    );
    res.json({ savings, subscriptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

// 8) ADD TRANSACTION (round-up)
app.post('/api/transactions', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;
  const roundedUp = Math.ceil(amount);
  const diff = parseFloat((roundedUp - amount).toFixed(2));
  try {
    // record transaction
    await pool.query(
      `INSERT INTO transactions(user_id, amount, rounded_diff)
       VALUES($1, $2, $3)`,
      [userId, amount, diff]
    );
    // update savings.current (upsert)
    await pool.query(
      `INSERT INTO savings(user_id, current)
         VALUES($1, $2)
       ON CONFLICT (user_id) DO
         UPDATE SET current = savings.current + EXCLUDED.current`,
      [userId, diff]
    );
    res.status(201).json({ roundedDiff: diff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to record transaction' });
  }
});

// 9) UPDATE SAVINGS SETTINGS
app.patch('/api/savings', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { goal, weekly } = req.body;
  try {
    await pool.query(
      `UPDATE savings
       SET goal = $1, weekly_contribution = $2
       WHERE user_id = $3`,
      [goal, weekly, userId]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update savings' });
  }
});

// 10) TOGGLE GHOST MODE
app.patch('/api/user/ghost', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { enabled } = req.body;
  try {
    await pool.query(
      `UPDATE users SET ghost_mode = $1 WHERE id = $2`,
      [enabled, userId]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to toggle ghost mode' });
  }
});

// 11) CRON JOBS
// a) Every hour: for users with ghost_mode, credit random $2–$3
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running ghost‐saving task');
  const { rows: users } = await pool.query(
    'SELECT id FROM users WHERE ghost_mode = TRUE'
  );
  for (const { id } of users) {
    const rand = parseFloat((2 + Math.random()).toFixed(2));
    await pool.query(
      `INSERT INTO transactions(user_id, amount, rounded_diff)
       VALUES($1, 0, $2)`,
      [id, rand]
    );
    await pool.query(
      `INSERT INTO savings(user_id, current)
         VALUES($1, $2)
       ON CONFLICT (user_id) DO
         UPDATE SET current = savings.current + EXCLUDED.current`,
      [id, rand]
    );
  }
});

// b) Daily: mark subscriptions unused >30d for cancellation
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running subscription analysis task');
  await pool.query(`
    UPDATE subscriptions
    SET suggest_cancel = TRUE
    WHERE last_used < NOW() - INTERVAL '30 days'
  `);
});

// 12) CATCH‐ALL /api
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// 13) START SERVER
const port = parseInt(PORT, 10);
app.listen(port, () => {
  console.log(`🚀 Backend listening on http://localhost:${port}`);
});