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
   2️⃣  Database connection (Supabase, Mock, or Local)
--------------------------------------------------*/
import { MockPool } from './mockPool.js';
import { SupabasePool, supabase } from './supabase.js';

// Database mode: 'supabase', 'mock', or 'local'
const DATABASE_MODE = process.env.DATABASE_MODE || 'mock';

let pool;

switch (DATABASE_MODE) {
  case 'supabase':
    console.log('🚀 Using Supabase Database');
    pool = new SupabasePool();
    break;
  case 'local':
    console.log('🐳 Using Local PostgreSQL Database');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    break;
  case 'mock':
  default:
    console.log('⚠️  Using In-Memory Mock Database');
    pool = new MockPool();
    break;
}

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
   6️⃣  Transaction CRUD with Auto-Categorization
--------------------------------------------------*/
import { categorizeTransaction, getCategories, categorizeTransactions } from './services/categorizer.js';

// Get all categories
app.get('/api/categories', (_req, res) => {
  res.json(getCategories());
});

// Get user's transactions with optional filters
app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { category, limit = 100, offset = 0, startDate, endDate } = req.query;
    
    let query = `
      SELECT id, amount, rounded_diff, merchant, description, category, created_at 
      FROM transactions 
      WHERE user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (category && category !== 'All') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get transactions error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new transaction with auto-categorization
app.post('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { amount, merchant, description, category: manualCategory } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Auto-categorize if no category provided
    const category = manualCategory || categorizeTransaction(merchant, description, amount);
    
    // Calculate round-up (round to nearest dollar)
    const roundedAmount = Math.ceil(Math.abs(amount));
    const roundedDiff = roundedAmount - Math.abs(amount);

    const insert = `
      INSERT INTO transactions (user_id, amount, rounded_diff, merchant, description, category)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await pool.query(insert, [
      req.user.id,
      amount,
      roundedDiff,
      merchant || null,
      description || null,
      category
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add transaction error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update transaction category (manual override)
app.patch('/api/transactions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, merchant, description } = req.body;

    const update = `
      UPDATE transactions 
      SET category = COALESCE($1, category),
          merchant = COALESCE($2, merchant),
          description = COALESCE($3, description)
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const { rows } = await pool.query(update, [category, merchant, description, id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Update transaction error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Delete transaction error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get spending summary by category
app.get('/api/spending-summary', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        category,
        COUNT(*) as transaction_count,
        SUM(ABS(amount)) as total_spent,
        SUM(rounded_diff) as total_round_up
      FROM transactions 
      WHERE user_id = $1 AND amount > 0
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
    }

    query += ' GROUP BY category ORDER BY total_spent DESC';

    const { rows } = await pool.query(query, params);
    
    // Add category metadata
    const categories = getCategories();
    const enrichedRows = rows.map(row => {
      const cat = categories.find(c => c.name === row.category) || {};
      return {
        ...row,
        icon: cat.icon || '📦',
        color: cat.color || '#6B7280'
      };
    });

    res.json(enrichedRows);
  } catch (err) {
    console.error('Spending summary error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Seed sample transactions for demo
app.post('/api/transactions/seed', requireAuth, async (req, res) => {
  try {
    const sampleTransactions = [
      { amount: 12.50, merchant: 'Starbucks', description: 'Morning coffee' },
      { amount: 45.00, merchant: 'Shell Gas Station', description: 'Fuel' },
      { amount: 89.99, merchant: 'Amazon', description: 'Electronics purchase' },
      { amount: 15.99, merchant: 'Netflix', description: 'Monthly subscription' },
      { amount: 32.40, merchant: 'Chipotle', description: 'Lunch' },
      { amount: 150.00, merchant: 'Electric Company', description: 'Utility bill' },
      { amount: 25.00, merchant: 'Uber', description: 'Ride to airport' },
      { amount: 8.50, merchant: 'Dunkin Donuts', description: 'Breakfast' },
      { amount: 200.00, merchant: 'Target', description: 'Home supplies' },
      { amount: 50.00, merchant: 'Planet Fitness', description: 'Gym membership' }
    ];

    const inserted = [];
    for (const tx of sampleTransactions) {
      const category = categorizeTransaction(tx.merchant, tx.description, tx.amount);
      const roundedDiff = Math.ceil(tx.amount) - tx.amount;
      
      const { rows } = await pool.query(
        `INSERT INTO transactions (user_id, amount, rounded_diff, merchant, description, category)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.id, tx.amount, roundedDiff, tx.merchant, tx.description, category]
      );
      inserted.push(rows[0]);
    }

    res.status(201).json({ message: `Seeded ${inserted.length} transactions`, transactions: inserted });
  } catch (err) {
    console.error('Seed transactions error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------------------------------------
   6.5️⃣  Budget Management
--------------------------------------------------*/

// Get user budgets
app.get('/api/budgets', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY category', 
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get budgets error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set/Update budget for a category
app.post('/api/budgets', requireAuth, async (req, res) => {
  try {
    const { category, monthly_limit } = req.body;

    if (!category || !monthly_limit) {
      return res.status(400).json({ error: 'Category and limit are required' });
    }

    const query = `
      INSERT INTO budgets (user_id, category, monthly_limit)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, category) 
      DO UPDATE SET monthly_limit = $3, created_at = NOW()
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [req.user.id, category, monthly_limit]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Set budget error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete budget
app.delete('/api/budgets/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    
    if (rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json({ success: true, deletedBudget: rows[0] });
  } catch (err) {
    console.error('Delete budget error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* -------------------------------------------------
   7️⃣  Forecast proxy → Python microservice
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