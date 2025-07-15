require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// pull in all our env vars
const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASS,
  PORT = 5000,
  JWT_SECRET,
  CORS_ORIGIN,
} = process.env;

if (!JWT_SECRET) {
  console.error('❌  Missing JWT_SECRET in env');
  process.exit(1);
}

// set up our Postgres client pool
const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASS,
});

// make sure the users table exists
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ users table is ready');
  } catch (err) {
    console.error('🔥 Error creating users table:', err);
    process.exit(1);
  }
})();

// app setup
const app = express();
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// registration endpoint
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
    res.json({ success: true, message: 'User registered' });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      res.status(400).json({ success: false, message: 'Email already in use' });
    } else {
      console.error(err);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
});

// login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    // if you want to set a cookie instead of returning the token:
    // res.cookie('token', token, { httpOnly: true, sameSite: 'None', secure: true });
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API listening on port ${PORT}`);
});