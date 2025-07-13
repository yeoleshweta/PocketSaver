const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();  // 👈 define app FIRST

app.use(cors({
  origin: 'http://localhost:3001', // Allow frontend
  credentials: true
}));
app.use(express.json());

const PORT = 5000;

// Test route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error('DB Connection Error:', err);
    res.status(500).json({ success: false, message: 'DB connection failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API listening on port ${PORT}`);
});