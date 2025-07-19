// backend/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');           // ← pure-JS
const pool   = require('./db');

async function seed() {
  console.log('🔄 Seeding database…');
  const password  = 'password123';
  const hash      = await bcrypt.hash(password, 10);
  const client    = await pool.connect();
  try {
    await client.query('BEGIN');
    // upsert our test user
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['test@pocketsaver.app', hash]
    );
    const userId = userRes.rows[0].id;

    // (optionally) seed some subscriptions, savings, etc.
    // … your other seed logic …

    await client.query('COMMIT');
    console.log('✅ Seeding complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seed();