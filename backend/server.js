/* -------------------------------------------------
   PocketPilot-Ultimate — Backend API (ES Modules)
--------------------------------------------------*/

// 1️⃣  Environment & imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';      // global in Node ≥18, but explicit is fine
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pkg;

/* -------------------------------------------------
   2️⃣  Database connection (PostgreSQL)
--------------------------------------------------*/
const pool = new Pool({
  connectionString: process.env.DATABASE_URL   // put this in .env
});

/* -------------------------------------------------
   3️⃣  App & middleware
--------------------------------------------------*/
const app = express();
app.use(cors());
app.use(express.json());   // parses application/json bodies

/* -------------------------------------------------
   4️⃣  Health-check (quick smoke test)
--------------------------------------------------*/
app.get('/health', (_req, res) => res.send('🩺 OK'));

/* -------------------------------------------------
   5️⃣  User registration
--------------------------------------------------*/
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // rudimentary validation
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // insert user
    const insert =
      'INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id';
    const { rows } = await pool.query(insert, [name, email, hash]);

    return res.status(201).json({ userId: rows[0].id });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------------------------------------
   5.5️⃣  User Login
--------------------------------------------------*/
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    // Find user
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Verify password
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: 'Invalid credentials' });

    // Create token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: '1h'
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------------------------------------
   5.6️⃣  Auth Middleware
--------------------------------------------------*/
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/* -------------------------------------------------
   5.7️⃣  Get Current User (Session Persistence)
--------------------------------------------------*/
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------------------------------------
   5.8️⃣  Dashboard Data (Savings & Subscriptions)
--------------------------------------------------*/
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    // 1. Get Savings
    let savingsRes = await pool.query('SELECT * FROM savings WHERE user_id = $1', [req.user.id]);
    let savings = savingsRes.rows[0];

    // If no savings record exists, create default
    if (!savings) {
      const insertDefault = `
        INSERT INTO savings (user_id, current, goal, weekly_contribution, ghost_mode)
        VALUES ($1, 0, 10000, 50, false)
        RETURNING *
      `;
      const inserted = await pool.query(insertDefault, [req.user.id]);
      savings = inserted.rows[0];
    }

    // 2. Get Subscriptions
    let subRes = await pool.query('SELECT name, cost, last_used, suggest_cancel FROM subscriptions WHERE user_id = $1', [req.user.id]);
    
    // Seed default subscriptions if empty
    if (subRes.rows.length === 0) {
      const seedSubs = `
        INSERT INTO subscriptions (user_id, name, cost, last_used, suggest_cancel)
        VALUES 
          ($1, 'Knetflex', 15.99, NOW() - INTERVAL '2 days', false),
          ($1, 'Gym Membership', 50.00, NOW() - INTERVAL '45 days', true),
          ($1, 'Spotify', 9.99, NOW() - INTERVAL '1 day', false),
          ($1, 'Hulu', 12.99, NOW() - INTERVAL '30 days', true)
        RETURNING *
      `;
      const insertedSubs = await pool.query(seedSubs, [req.user.id]);
      subRes = insertedSubs;
    }
    
    res.json({
      savings,
      subscriptions: subRes.rows
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------------------------------------
   5.9️⃣  Toggle Ghost Mode
--------------------------------------------------*/
app.patch('/api/user/ghost', requireAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    await pool.query('UPDATE savings SET ghost_mode = $1 WHERE user_id = $2', [enabled, req.user.id]);
    res.json({ success: true, ghost_mode: enabled });
  } catch (err) {
    console.error('Ghost mode error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------------------------------------
   6️⃣  Forecast proxy → Python microservice
--------------------------------------------------*/
const FORECAST_URL = process.env.FORECAST_URL || 'http://localhost:8080/predict';

app.post('/api/forecast', async (req, res) => {
  try {
    const { days_since_start, current_price, horizon } = req.body;

    const response = await fetch(FORECAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days_since_start, current_price, horizon })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const { predicted_price } = await response.json();
    res.json({ predicted_price });
  } catch (err) {
    console.error('Forecast proxy error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

/* -------------------------------------------------
   7️⃣  Start server
--------------------------------------------------*/
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`));