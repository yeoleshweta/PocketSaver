// backend/db.js
// ─────────────────────────────────────────────────────────────────────────────
// 1) Load .env into process.env
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,                     // e.g. "db"
  port:     parseInt(process.env.DB_PORT, 10),      // e.g. 5432
  database: process.env.DB_NAME,                     // e.g. "pocketsaver"
  user:     process.env.DB_USER,                     // e.g. "pocketsaver"
  password: process.env.DB_PASS,                     // e.g. "hunter2"
  // ssl: process.env.NODE_ENV === 'production'
  //      ? { rejectUnauthorized: false }
  //      : false,
});

module.exports = pool;