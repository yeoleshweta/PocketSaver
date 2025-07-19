require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Postgres Pool ──────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // if you need SSL in production, uncomment:
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── Routes ─────────────────────────────────────────────────
// Health check
app.get('/', (req, res) => {
  res.send('✅ Backend is up and running');
});

// Example: fetch all rows from a table called "items"
app.get('/items', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM items');
    res.json(rows);
  } catch (err) {
    console.error('DB error on GET /items', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Example: insert a new item
app.post('/items', async (req, res) => {
  const { name, value } = req.body;
  if (!name || value == null) {
    return res.status(400).json({ error: 'name and value are required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO items (name, value) VALUES ($1, $2) RETURNING *',
      [name, value]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('DB error on POST /items', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── Start Server ────────────────────────────────────────────
app.listen(port, () =>
  console.log(`🚀 Server listening on http://localhost:${port}`)
);