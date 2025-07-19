// backend/server.js
require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')             // ← switched from bcrypt to bcryptjs
const jwt = require('jsonwebtoken')
const cors = require('cors')
const pool = require('./db')                   // your Postgres pool
const requireAuth = require('./auth')          // your auth middleware
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// ─── 1) Register ───────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
      [email, hash]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('POST /api/register error', err)
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Email already in use' })
    }
    res.status(500).json({ success: false, message: 'Registration failed' })
  }
})

// ─── 2) Login ──────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' })
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, password_hash FROM users WHERE email = $1`,
      [email]
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    const token = jwt.sign(
      { id: user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )
    res.json({ success: true, token })
  } catch (err) {
    console.error('POST /api/login error', err)
    res.status(500).json({ success: false, message: 'Login failed' })
  }
})

// ─── 3) Dashboard Data ────────────────────────────────────────
app.get('/api/dashboard', requireAuth, async (req, res) => {
  const userId = req.user.id
  try {
    // fetch goal/weekly/ghost from savings
    const metaRes = await pool.query(
      `SELECT goal, weekly_contribution, ghost_mode
         FROM savings
        WHERE user_id = $1`,
      [userId]
    )
    const meta = metaRes.rows[0] || {
      goal: 0,
      weekly_contribution: 0,
      ghost_mode: false
    }

    // compute current = sum of all rounded_diff for that user
    const sumRes = await pool.query(
      `SELECT COALESCE(SUM(rounded_diff), 0)::numeric(10,2) AS current
         FROM transactions
        WHERE user_id = $1`,
      [userId]
    )
    const current = parseFloat(sumRes.rows[0].current)

    // fetch subscriptions as before
    const subsRes = await pool.query(
      `SELECT name, cost, last_used, suggest_cancel
         FROM subscriptions
        WHERE user_id = $1`,
      [userId]
    )

    // return the same shape your UI expects
    res.json({
      savings: {
        current,
        goal: parseFloat(meta.goal),
        weekly_contribution: parseFloat(meta.weekly_contribution),
        ghost_mode: meta.ghost_mode
      },
      subscriptions: subsRes.rows
    })
  } catch (err) {
    console.error('GET /api/dashboard error', err)
    res.status(500).json({ message: 'Failed to load dashboard data' })
  }
})

// ─── 4) Fetch All Transactions ────────────────────────────────
app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, amount, rounded_diff, created_at
         FROM transactions
        WHERE user_id = $1
     ORDER BY created_at DESC`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /api/transactions error', err)
    res.status(500).json({ message: 'Failed to fetch transactions' })
  }
})

// ─── 5) Add Transaction (Round-Up) ─────────────────────────────
app.post('/api/transactions', requireAuth, async (req, res) => {
  const userId = req.user.id
  const raw = req.body.amount
  const amount = parseFloat(raw)
  if (isNaN(amount) || amount < 0) {
    return res.status(400).json({ message: 'Invalid amount' })
  }

  const roundedUp = Math.ceil(amount)
  const diff = Math.round((roundedUp - amount) * 100) / 100

  try {
    // insert & return the new txn
    const txnResult = await pool.query(
      `INSERT INTO transactions (user_id, amount, rounded_diff, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, amount, rounded_diff, created_at`,
      [userId, amount, diff]
    )
    const newTxn = txnResult.rows[0]

    // bump the savings.current in the savings table, too
    await pool.query(
      `INSERT INTO savings (user_id, current)
         VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
         SET current = savings.current + EXCLUDED.current`,
      [userId, diff]
    )

    res.status(201).json({ transaction: newTxn })
  } catch (err) {
    console.error('POST /api/transactions error', err)
    res.status(500).json({ message: 'Failed to record transaction' })
  }
})

// ─── 6) Toggle Ghost Mode ──────────────────────────────────────
app.patch('/api/user/ghost', requireAuth, async (req, res) => {
  const userId = req.user.id
  const { enabled } = req.body
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ message: 'enabled must be boolean' })
  }
  try {
    await pool.query(
      `UPDATE savings
         SET ghost_mode = $1
       WHERE user_id = $2`,
      [enabled, userId]
    )
    res.json({ ghost_mode: enabled })
  } catch (err) {
    console.error('PATCH /api/user/ghost error', err)
    res.status(500).json({ message: 'Failed to update ghost mode' })
  }
})

// ─── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`)
})