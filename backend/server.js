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