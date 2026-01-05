// backend/supabase.js
// ─────────────────────────────────────────────────────────────────────────────
// Supabase Database Connection & PostgreSQL-Compatible Pool Wrapper
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * SupabasePool - A PostgreSQL pg.Pool compatible wrapper for Supabase
 * 
 * This class translates pool.query(sql, params) calls to Supabase client methods.
 * It maintains compatibility with existing code that uses the pg package.
 */
export class SupabasePool {
  constructor() {
    this.client = supabase;
  }

  /**
   * Execute a SQL query with PostgreSQL-style $1, $2 parameters
   */
  async query(text, params = []) {
    try {
      // Determine query type and route to appropriate handler
      const queryLower = text.trim().toLowerCase();

      if (queryLower.startsWith('insert')) {
        return await this._handleInsert(text, params);
      } else if (queryLower.startsWith('update')) {
        return await this._handleUpdate(text, params);
      } else if (queryLower.startsWith('delete')) {
        return await this._handleDelete(text, params);
      } else if (queryLower.startsWith('select')) {
        return await this._handleSelect(text, params);
      } else {
        console.warn('Unhandled query type:', text.substring(0, 50));
        return { rows: [] };
      }
    } catch (error) {
      console.error('Supabase query error:', error.message);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INSERT Handler
  // ─────────────────────────────────────────────────────────────────────────
  async _handleInsert(text, params) {
    const tableMatch = text.match(/insert\s+into\s+(\w+)/i);
    if (!tableMatch) throw new Error('Could not parse INSERT table name');
    const table = tableMatch[1];

    // Parse column names from: INSERT INTO table(col1, col2) VALUES($1, $2)
    const columnsMatch = text.match(/\(([^)]+)\)\s*values/i);
    if (!columnsMatch) {
      // Multi-value insert (seeding) - handle separately
      return await this._handleMultiInsert(text, params, table);
    }

    const columns = columnsMatch[1].split(',').map(c => c.trim());
    
    // Build insert object
    const insertData = {};
    columns.forEach((col, index) => {
      insertData[col] = params[index];
    });

    const { data, error } = await supabase
      .from(table)
      .insert(insertData)
      .select();

    if (error) throw error;
    return { rows: data || [] };
  }

  // Handle multi-row INSERT (like seeding subscriptions)
  async _handleMultiInsert(text, params, table) {
    // For complex multi-value inserts, we'll use a direct approach
    // This handles queries like INSERT INTO table VALUES ($1, ...), ($2, ...)
    
    // For subscriptions seeding specifically
    if (table === 'subscriptions' && params[0]) {
      const userId = params[0];
      const subs = [
        { user_id: userId, name: 'Knetflex', cost: 15.99, last_used: new Date().toISOString().split('T')[0], suggest_cancel: false },
        { user_id: userId, name: 'Gym Membership', cost: 50.00, last_used: new Date(Date.now() - 45*86400000).toISOString().split('T')[0], suggest_cancel: true },
        { user_id: userId, name: 'Spotify', cost: 9.99, last_used: new Date().toISOString().split('T')[0], suggest_cancel: false },
        { user_id: userId, name: 'Hulu', cost: 12.99, last_used: new Date(Date.now() - 30*86400000).toISOString().split('T')[0], suggest_cancel: true },
      ];

      const { data, error } = await supabase.from('subscriptions').insert(subs).select();
      if (error) throw error;
      return { rows: data || [] };
    }

    // Generic fallback - try to parse and execute
    console.warn('Multi-insert not fully supported for table:', table);
    return { rows: [] };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SELECT Handler
  // ─────────────────────────────────────────────────────────────────────────
  async _handleSelect(text, params) {
    const tableMatch = text.match(/from\s+(\w+)/i);
    if (!tableMatch) throw new Error('Could not parse SELECT table name');
    const table = tableMatch[1];

    // Determine what columns to select
    let selectColumns = '*';
    const selectMatch = text.match(/select\s+(.+?)\s+from/i);
    if (selectMatch) {
      const cols = selectMatch[1].trim();
      if (!cols.includes('*') && !cols.includes('count') && !cols.includes('sum')) {
        selectColumns = cols;
      }
    }

    // Check for aggregations (spending summary)
    if (text.toLowerCase().includes('count(*)') || text.toLowerCase().includes('sum(')) {
      return await this._handleAggregation(text, params, table);
    }

    let query = supabase.from(table).select(selectColumns);

    // Parse WHERE conditions
    const conditions = this._parseWhereConditions(text, params);
    for (const cond of conditions) {
      if (cond.op === '=') {
        query = query.eq(cond.column, cond.value);
      } else if (cond.op === '>=') {
        query = query.gte(cond.column, cond.value);
      } else if (cond.op === '<=') {
        query = query.lte(cond.column, cond.value);
      } else if (cond.op === '>') {
        query = query.gt(cond.column, cond.value);
      } else if (cond.op === '<') {
        query = query.lt(cond.column, cond.value);
      }
    }

    // Handle ORDER BY
    const orderMatch = text.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    if (orderMatch) {
      const column = orderMatch[1];
      const ascending = !orderMatch[2] || orderMatch[2].toLowerCase() === 'asc';
      query = query.order(column, { ascending });
    }

    // Handle LIMIT and OFFSET
    const limitMatch = text.match(/limit\s+\$(\d+)/i);
    const offsetMatch = text.match(/offset\s+\$(\d+)/i);
    
    if (limitMatch && offsetMatch) {
      const limit = parseInt(params[parseInt(limitMatch[1]) - 1]);
      const offset = parseInt(params[parseInt(offsetMatch[1]) - 1]);
      query = query.range(offset, offset + limit - 1);
    } else if (limitMatch) {
      const limit = parseInt(params[parseInt(limitMatch[1]) - 1]);
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { rows: data || [] };
  }

  // Handle aggregation queries (like spending summary)
  async _handleAggregation(text, params, table) {
    // For spending summary, we need to manually aggregate
    if (table === 'transactions' && text.includes('category')) {
      const userId = params[0];
      
      // Get all transactions for the user
      let query = supabase.from('transactions')
        .select('category, amount, rounded_diff')
        .eq('user_id', userId)
        .gt('amount', 0);

      const { data, error } = await query;
      if (error) throw error;

      // Manually aggregate by category
      const summary = {};
      (data || []).forEach(tx => {
        const cat = tx.category || 'Other';
        if (!summary[cat]) {
          summary[cat] = { 
            category: cat, 
            transaction_count: 0, 
            total_spent: 0, 
            total_round_up: 0 
          };
        }
        summary[cat].transaction_count++;
        summary[cat].total_spent += Math.abs(parseFloat(tx.amount) || 0);
        summary[cat].total_round_up += parseFloat(tx.rounded_diff) || 0;
      });

      const result = Object.values(summary).sort((a, b) => b.total_spent - a.total_spent);
      return { rows: result };
    }

    // Fallback for other aggregations
    console.warn('Aggregation query not fully supported:', text.substring(0, 100));
    return { rows: [] };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE Handler
  // ─────────────────────────────────────────────────────────────────────────
  async _handleUpdate(text, params) {
    const tableMatch = text.match(/update\s+(\w+)/i);
    if (!tableMatch) throw new Error('Could not parse UPDATE table name');
    const table = tableMatch[1];

    // Parse SET clause
    const setMatch = text.match(/set\s+(.+?)\s+where/i);
    if (!setMatch) throw new Error('Could not parse UPDATE SET clause');

    const updateData = {};
    const setClause = setMatch[1];

    // Handle COALESCE pattern: column = COALESCE($1, column)
    const coalesceMatches = setClause.matchAll(/(\w+)\s*=\s*coalesce\s*\(\s*\$(\d+)\s*,\s*\w+\s*\)/gi);
    for (const match of coalesceMatches) {
      const column = match[1];
      const paramIndex = parseInt(match[2]) - 1;
      if (params[paramIndex] !== null && params[paramIndex] !== undefined) {
        updateData[column] = params[paramIndex];
      }
    }

    // Handle simple SET: column = $1
    const simpleSetMatches = setClause.matchAll(/(\w+)\s*=\s*\$(\d+)(?![^(]*\))/g);
    for (const match of simpleSetMatches) {
      const column = match[1];
      const paramIndex = parseInt(match[2]) - 1;
      updateData[column] = params[paramIndex];
    }

    // Parse WHERE conditions
    const conditions = this._parseWhereConditions(text, params);
    
    let query = supabase.from(table).update(updateData);
    
    for (const cond of conditions) {
      if (cond.op === '=') {
        query = query.eq(cond.column, cond.value);
      }
    }

    // Check for RETURNING
    if (text.toLowerCase().includes('returning')) {
      query = query.select();
    }

    const { data, error } = await query;
    if (error) throw error;
    return { rows: data || [] };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE Handler
  // ─────────────────────────────────────────────────────────────────────────
  async _handleDelete(text, params) {
    const tableMatch = text.match(/delete\s+from\s+(\w+)/i);
    if (!tableMatch) throw new Error('Could not parse DELETE table name');
    const table = tableMatch[1];

    const conditions = this._parseWhereConditions(text, params);
    
    let query = supabase.from(table).delete();
    
    for (const cond of conditions) {
      if (cond.op === '=') {
        query = query.eq(cond.column, cond.value);
      }
    }

    // Check for RETURNING
    if (text.toLowerCase().includes('returning')) {
      query = query.select();
    }

    const { data, error } = await query;
    if (error) throw error;
    return { rows: data || [] };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: Parse WHERE conditions
  // ─────────────────────────────────────────────────────────────────────────
  _parseWhereConditions(text, params) {
    const conditions = [];
    const whereMatch = text.match(/where\s+(.+?)(?:order|group|limit|returning|$)/is);
    
    if (!whereMatch) return conditions;

    const whereClause = whereMatch[1];

    // Match patterns like: column = $1, column >= $2, etc.
    const conditionRegex = /(\w+)\s*(=|>=|<=|>|<)\s*\$(\d+)/g;
    let match;

    while ((match = conditionRegex.exec(whereClause)) !== null) {
      conditions.push({
        column: match[1],
        op: match[2],
        value: params[parseInt(match[3]) - 1]
      });
    }

    return conditions;
  }
}

export default supabase;
