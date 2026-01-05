
import bcrypt from 'bcryptjs';

// In-memory data store
const db = {
  users: [],
  transactions: [],
  savings: [],
  subscriptions: [],
  budgets: []
};

// Helper: Generate ID
const genId = () => Math.random().toString(36).substring(2, 9);
// Helper: Simulate delay
const delay = () => new Promise(res => setTimeout(res, 100));

export class MockPool {
  async query(text, params = []) {
    await delay();
    const query = text.trim();
    
    // console.log('MockDB Query:', query, params);

    // --- USERS ---
    
    // Register
    if (query.includes('INSERT INTO users')) {
      // params: [name, email, hash]
      const newUser = {
        id: genId(),
        name: params[0],
        email: params[1],
        password_hash: params[2],
        created_at: new Date()
      };
      db.users.push(newUser);
      return { rows: [newUser] };
    }

    // Login (Find user by email)
    if (query.includes('SELECT * FROM users WHERE email')) {
      const user = db.users.find(u => u.email === params[0]);
      return { rows: user ? [user] : [] };
    }

    // Get User by ID
    if (query.includes('SELECT id, name, email FROM users')) {
      const user = db.users.find(u => u.id === params[0]);
      return { rows: user ? [user] : [] };
    }

    // --- DASHBOARD (Savings & Subs) ---

    // Get Savings
    if (query.includes('SELECT * FROM savings')) {
      let saving = db.savings.find(s => s.user_id === params[0]);
      return { rows: saving ? [saving] : [] };
    }

    // Insert Default Savings
    if (query.includes('INSERT INTO savings')) {
        const newSavings = {
            id: genId(),
            user_id: params[0],
            current: 0,
            goal: 10000,
            weekly_contribution: 50,
            ghost_mode: false
        };
        db.savings.push(newSavings);
        return { rows: [newSavings] };
    }
    
    // Ghost Mode
    if (query.includes('UPDATE savings SET ghost_mode')) {
        const saving = db.savings.find(s => s.user_id === params[1]);
        if(saving) saving.ghost_mode = params[0];
        return { rows: [] };
    }

    // Get Subscriptions
    if (query.includes('SELECT name, cost, last_used, suggest_cancel FROM subscriptions')) {
      const subs = db.subscriptions.filter(s => s.user_id === params[0]);
      return { rows: subs };
    }

    // Seed Subscriptions
    if (query.includes('INSERT INTO subscriptions')) {
        // This query inserts multiple values. Mocking it properly is hard if we don't parse.
        // But the server.js uses a single INSERT statement with multiple VALUES.
        // We'll just manually push the default subs for this user.
        const userId = params[0];
        const newSubs = [
          { user_id: userId, name: 'Knetflex', cost: 15.99, last_used: new Date(), suggest_cancel: false },
          { user_id: userId, name: 'Gym Membership', cost: 50.00, last_used: new Date(Date.now() - 45*86400000), suggest_cancel: true },
          { user_id: userId, name: 'Spotify', cost: 9.99, last_used: new Date(), suggest_cancel: false },
          { user_id: userId, name: 'Hulu', cost: 12.99, last_used: new Date(Date.now() - 30*86400000), suggest_cancel: true },
        ];
        db.subscriptions.push(...newSubs);
        return { rows: newSubs };
    }

    // --- TRANSACTIONS ---

    // Get Transactions (with filters)
    if (query.includes('FROM transactions')) {
        // Check if it's COUNT or SELECT
        if (query.includes('SELECT id, amount')) {
             // Main transaction list with filters
             // Params: [userId, (category?), (startDate?), (endDate?), limit, offset]
             // logic in server.js dynamically builds query string.
             // We can just return all transactions for user, sorted.
             // Mocking exact filters is a bonus.
             let txs = db.transactions.filter(t => t.user_id === params[0]);
             
             // Simple category filter
             if (query.includes('category = $')) {
                 const catInd = params.findIndex((p, i) => i > 0 && typeof p === 'string' && !p.match(/^\d{4}/)); // heuristic to find category string
                 if (catInd !== -1) {
                     txs = txs.filter(t => t.category === params[catInd]);
                 }
             }

             txs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
             // Slice for pagination (last two params usually)
             const offset = params[params.length-1];
             const limit = params[params.length-2];
             
             if(typeof offset === 'number' && typeof limit === 'number') {
                 return { rows: txs.slice(offset, offset + limit) };
             }
             return { rows: txs };
        }
        
        // Spending Summary
        if (query.includes('SELECT \n        category,\n        COUNT(*)')) {
            // Group by category
            const txs = db.transactions.filter(t => t.user_id === params[0]);
            const summary = {};
            txs.forEach(t => {
                if (!summary[t.category]) summary[t.category] = { category: t.category, transaction_count: 0, total_spent: 0, total_round_up: 0 };
                summary[t.category].transaction_count++;
                summary[t.category].total_spent += Math.abs(Number(t.amount));
                summary[t.category].total_round_up += Number(t.rounded_diff);
            });
            // Convert to array
            return { rows: Object.values(summary).sort((a,b) => b.total_spent - a.total_spent) };
        }
    }

    // Insert Transaction
    if (query.includes('INSERT INTO transactions')) {
      const newTx = {
        id: genId(),
        user_id: params[0],
        amount: params[1],
        rounded_diff: params[2],
        merchant: params[3],
        description: params[4],
        category: params[5],
        created_at: new Date().toISOString()
      };
      db.transactions.push(newTx);
      return { rows: [newTx] };
    }

    // Delete Transaction
    if (query.includes('DELETE FROM transactions')) {
        const idx = db.transactions.findIndex(t => t.id === params[0] && t.user_id === params[1]);
        if (idx !== -1) {
            db.transactions.splice(idx, 1);
            return { rows: [{ id: params[0] }] };
        }
        return { rows: [] };
    }
    
    // Update Transaction
    if (query.includes('UPDATE transactions')) {
        // This is complex because of COALESCE.
        // We'll simplisticly assume we find the transaction and update fields if provided.
        // server.js: [category, merchant, description, id, req.user.id]
        const tx = db.transactions.find(t => t.id === params[3] && t.user_id === params[4]);
        if (tx) {
            if (params[0]) tx.category = params[0];
            if (params[1]) tx.merchant = params[1];
            if (params[2]) tx.description = params[2];
            return { rows: [tx] };
        }
        return { rows: [] };
    }

    // --- BUDGETS ---
    
    // Get Budgets
    if (query.includes('SELECT * FROM budgets')) {
        const budgets = db.budgets.filter(b => b.user_id === params[0]);
        // sort by category?
        return { rows: budgets.sort((a,b) => a.category.localeCompare(b.category)) };
    }

    // Set Budget (Upsert)
    if (query.includes('INSERT INTO budgets')) {
        // [user_id, category, limit]
        let budget = db.budgets.find(b => b.user_id === params[0] && b.category === params[1]);
        if (budget) {
            budget.monthly_limit = params[2];
            budget.created_at = new Date();
        } else {
            budget = {
                id: genId(),
                user_id: params[0],
                category: params[1],
                monthly_limit: params[2],
                created_at: new Date()
            };
            db.budgets.push(budget);
        }
        return { rows: [budget] };
    }

    // Delete Budget
    if (query.includes('DELETE FROM budgets')) {
        const idx = db.budgets.findIndex(b => b.id === params[0] && b.user_id === params[1]);
        if (idx !== -1) {
            const deleted = db.budgets[idx];
            db.budgets.splice(idx, 1);
            return { rows: [deleted] };
        }
        return { rows: [] };
    }

    console.warn('Unhandled Query:', query);
    return { rows: [] };
  }
}
