// backend/db.js

const { Pool } = require('pg');

const pool = new Pool({
  user:     process.env.DB_USER     || 'pocketsaver',
  host:     process.env.DB_HOST     || 'db',
  database: process.env.DB_NAME     || 'pocketsaver',
  password: process.env.DB_PASS     || 'pocketsaver',
  port:     parseInt(process.env.DB_PORT, 10) || 5432
});

module.exports = pool;