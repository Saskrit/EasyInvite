const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000
    });

    pool.on('error', (err) => {
      console.warn('[Neon Pool Warning]', err.message);
    });
  }
  return pool;
}

async function query(text, params = []) {
  const p = getPool();
  if (!p) return null;
  const client = await p.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function transaction(callback) {
  const p = getPool();
  if (!p) return null;
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

async function initSchema() {
  if (!process.env.DATABASE_URL) return false;

  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      is_verified INTEGER DEFAULT 0,
      verification_token VARCHAR(255),
      verification_token_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS plans (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price_npr INTEGER NOT NULL,
      sends_included INTEGER NOT NULL,
      is_unlimited INTEGER DEFAULT 0,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS usage_balances (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan_id VARCHAR(50) REFERENCES plans(id),
      sends_remaining INTEGER DEFAULT 0,
      is_lifetime INTEGER DEFAULT 0,
      total_sends_purchased INTEGER DEFAULT 0,
      total_sends_consumed INTEGER DEFAULT 0,
      in_flight_sends INTEGER DEFAULT 0,
      reserved_sends INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS usage_transactions (
      id VARCHAR(100) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(100) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_id VARCHAR(50) REFERENCES plans(id),
      amount_npr INTEGER NOT NULL,
      sends_to_credit INTEGER DEFAULT 0,
      is_lifetime INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'PENDING',
      bank_name VARCHAR(255) NOT NULL,
      sender_account_name VARCHAR(255),
      sender_account_number VARCHAR(255),
      reference_number VARCHAR(255) NOT NULL,
      screenshot_path TEXT,
      notes TEXT,
      admin_notes TEXT,
      approved_by INTEGER REFERENCES users(id),
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS templates (
      id VARCHAR(100) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      desc_text TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (id, user_id)
    );

    CREATE TABLE IF NOT EXISTS app_configurations (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      app_name VARCHAR(255),
      app_package_id VARCHAR(255),
      closed_testing_url TEXT,
      play_store_url TEXT,
      sender_name VARCHAR(255),
      sender_email VARCHAR(255),
      smtp_host VARCHAR(255),
      smtp_port INTEGER,
      smtp_secure INTEGER,
      smtp_user VARCHAR(255),
      smtp_pass VARCHAR(255),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id VARCHAR(100) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      template_id VARCHAR(100),
      template_name VARCHAR(255),
      subject TEXT,
      app_name VARCHAR(255),
      recipients_count INTEGER NOT NULL,
      recipients_list JSONB,
      successful_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'COMPLETED',
      usage_transaction_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Seed Prepaid Plans
    INSERT INTO plans (id, name, price_npr, sends_included, is_unlimited, description)
    VALUES 
      ('starter', 'Starter', 100, 10, 0, '10 Send actions. Ideal for initial closed testing outreach.'),
      ('growth', 'Growth', 200, 40, 0, '40 Send actions. Most popular for regular closed testing builds.'),
      ('pro', 'Pro', 300, 60, 0, '60 Send actions. Best value for active dev teams.'),
      ('lifetime', 'Lifetime', 1000, -1, 1, 'Unlimited Send actions forever. One-time payment, zero limits.')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price_npr = EXCLUDED.price_npr,
      sends_included = EXCLUDED.sends_included,
      is_unlimited = EXCLUDED.is_unlimited,
      description = EXCLUDED.description;
  `;

  await query(schemaSql);
  return true;
}

/**
 * Loads all state from Neon PostgreSQL into a consolidated memory snapshot
 */
async function loadAllFromNeon() {
  if (!process.env.DATABASE_URL) return null;

  const p = getPool();
  if (!p) return null;

  let client;
  try {
    client = await p.connect();
    const usersRes = await client.query('SELECT * FROM users ORDER BY id ASC;');
    const balancesRes = await client.query('SELECT * FROM usage_balances;');
    const paymentsRes = await client.query('SELECT * FROM payments ORDER BY created_at DESC;');
    const campaignsRes = await client.query('SELECT * FROM campaigns ORDER BY created_at DESC;');
    const templatesRes = await client.query('SELECT * FROM templates ORDER BY created_at DESC;');
    const configsRes = await client.query('SELECT * FROM app_configurations;');
    const transactionsRes = await client.query('SELECT * FROM usage_transactions ORDER BY created_at DESC LIMIT 500;');

    const usageBalances = {};
    for (const row of (balancesRes?.rows || [])) {
      usageBalances[String(row.user_id)] = {
        user_id: row.user_id,
        plan_id: row.plan_id || 'free',
        sends_remaining: Number(row.sends_remaining) || 0,
        is_lifetime: Number(row.is_lifetime) || 0,
        total_sends_purchased: Number(row.total_sends_purchased) || 0,
        total_sends_consumed: Number(row.total_sends_consumed) || 0,
        reserved_sends: Number(row.reserved_sends || row.in_flight_sends) || 0,
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      };
    }

    const appConfigs = {};
    for (const row of (configsRes?.rows || [])) {
      appConfigs[String(row.user_id)] = {
        user_id: row.user_id,
        app_name: row.app_name || '',
        package_id: row.app_package_id || '',
        testing_url: row.closed_testing_url || '',
        direct_url: row.play_store_url || '',
        sender_name: row.sender_name || '',
        sender_email: row.sender_email || '',
        app_password: row.smtp_pass || '',
        smtp_online: 1,
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      };
    }

    const users = (usersRes?.rows || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password_hash: u.password_hash,
      role: u.role || 'user',
      is_verified: Number(u.is_verified) || 0,
      verification_token: u.verification_token,
      verification_token_expires: u.verification_token_expires,
      created_at: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
      updated_at: u.updated_at ? new Date(u.updated_at).toISOString() : new Date().toISOString()
    }));

    const payments = (paymentsRes?.rows || []).map(p => ({
      id: p.id,
      user_id: p.user_id,
      plan_id: p.plan_id,
      amount_npr: Number(p.amount_npr),
      sends_to_credit: Number(p.sends_to_credit) || 0,
      is_lifetime: Number(p.is_lifetime) || 0,
      reference_number: p.reference_number,
      screenshot_path: p.screenshot_path,
      status: p.status,
      bank_name: p.bank_name,
      sender_account_name: p.sender_account_name,
      sender_account_number: p.sender_account_number,
      notes: p.notes,
      admin_notes: p.admin_notes || '',
      reviewed_by: p.approved_by,
      reviewed_at: p.approved_at,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
      updated_at: p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString()
    }));

    const templates = (templatesRes?.rows || []).map(t => ({
      id: t.id,
      user_id: t.user_id,
      name: t.name,
      subject: t.subject,
      body: t.body,
      desc: t.desc_text,
      is_default: Number(t.is_default) || 0,
      created_at: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
      updated_at: t.updated_at ? new Date(t.updated_at).toISOString() : new Date().toISOString()
    }));

    const campaigns = (campaignsRes?.rows || []).map(c => ({
      id: c.id,
      user_id: c.user_id,
      subject: c.subject,
      recipients_count: c.recipients_count,
      recipients_preview: c.recipients_list || [],
      sent_count: c.successful_count,
      failed_count: c.failed_count,
      status: c.status,
      usage_transaction_id: c.usage_transaction_id,
      created_at: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString()
    }));

    const transactions = (transactionsRes?.rows || []).map(tx => ({
      id: tx.id,
      user_id: tx.user_id,
      amount: tx.amount,
      type: tx.type,
      notes: tx.description,
      metadata: tx.metadata,
      created_at: tx.created_at ? new Date(tx.created_at).toISOString() : new Date().toISOString()
    }));

    return {
      users,
      usage_balances: usageBalances,
      payments,
      campaigns,
      templates,
      app_configurations: appConfigs,
      usage_transactions: transactions
    };
  } catch (err) {
    console.warn('[Neon Sync Error] Could not load from Neon PostgreSQL:', err.message);
    return null;
  } finally {
    if (client) client.release();
  }
}

/**
 * Diagnostic health metadata
 */
async function getDiagnostics() {
  if (!process.env.DATABASE_URL) {
    return {
      connected: false,
      message: 'No DATABASE_URL configured'
    };
  }

  try {
    const versionRes = await query('SELECT version();');
    const countsRes = await query(`
      SELECT 
        (SELECT count(*) FROM users) as users_count,
        (SELECT count(*) FROM payments) as payments_count,
        (SELECT count(*) FROM payments WHERE status = 'PENDING') as pending_payments_count,
        (SELECT count(*) FROM campaigns) as campaigns_count,
        (SELECT count(*) FROM templates) as templates_count;
    `);

    const row = countsRes.rows[0];
    return {
      connected: true,
      branch: process.env.NEON_BRANCH || 'production',
      version: versionRes.rows[0].version.split(' ')[0] + ' ' + versionRes.rows[0].version.split(' ')[1],
      stats: {
        users: Number(row.users_count),
        payments: Number(row.payments_count),
        pendingPayments: Number(row.pending_payments_count),
        campaigns: Number(row.campaigns_count),
        templates: Number(row.templates_count)
      }
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

async function saveUser(user) {
  if (!process.env.DATABASE_URL) return;
  try {
    await query(`
      INSERT INTO users (id, name, email, password_hash, role, is_verified, verification_token, verification_token_expires, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_verified = EXCLUDED.is_verified,
        verification_token = EXCLUDED.verification_token,
        verification_token_expires = EXCLUDED.verification_token_expires,
        updated_at = NOW();
    `, [
      user.id,
      user.name,
      user.email,
      user.password_hash,
      user.role || 'user',
      user.is_verified || 0,
      user.verification_token || null,
      user.verification_token_expires || null,
      user.created_at || new Date().toISOString(),
      user.updated_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[Neon Postgres] saveUser error:', err.message);
  }
}

async function saveUsageBalance(bal) {
  if (!process.env.DATABASE_URL) return;
  try {
    const validPaidPlans = ['starter', 'growth', 'pro', 'lifetime'];
    const planId = (bal.plan_id && validPaidPlans.includes(bal.plan_id)) ? bal.plan_id : null;

    await query(`
      INSERT INTO usage_balances (user_id, plan_id, sends_remaining, is_lifetime, total_sends_purchased, total_sends_consumed, in_flight_sends, reserved_sends, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        sends_remaining = EXCLUDED.sends_remaining,
        is_lifetime = EXCLUDED.is_lifetime,
        total_sends_purchased = EXCLUDED.total_sends_purchased,
        total_sends_consumed = EXCLUDED.total_sends_consumed,
        in_flight_sends = EXCLUDED.in_flight_sends,
        reserved_sends = EXCLUDED.reserved_sends,
        updated_at = NOW();
    `, [
      bal.user_id,
      planId,
      bal.sends_remaining || 0,
      bal.is_lifetime || 0,
      bal.total_sends_purchased || 0,
      bal.total_sends_consumed || 0,
      bal.in_flight_sends || 0,
      bal.reserved_sends || 0,
      bal.updated_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[Neon Postgres] saveUsageBalance error:', err.message);
  }
}

async function savePayment(payment) {
  if (!process.env.DATABASE_URL) return;
  try {
    await query(`
      INSERT INTO payments (
        id, user_id, plan_id, amount_npr, sends_to_credit, is_lifetime,
        status, bank_name, sender_account_name, sender_account_number,
        reference_number, screenshot_path, notes, admin_notes, approved_by, approved_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        admin_notes = EXCLUDED.admin_notes,
        approved_by = EXCLUDED.approved_by,
        approved_at = EXCLUDED.approved_at,
        updated_at = NOW();
    `, [
      payment.id,
      payment.user_id,
      payment.plan_id,
      payment.amount_npr,
      payment.sends_to_credit || 0,
      payment.is_lifetime || 0,
      payment.status,
      payment.bank_name || 'Bank Transfer',
      payment.sender_account_name || null,
      payment.sender_account_number || null,
      payment.reference_number,
      payment.screenshot_path || null,
      payment.notes || null,
      payment.admin_notes || null,
      payment.reviewed_by || null,
      payment.reviewed_at || null,
      payment.created_at || new Date().toISOString(),
      payment.updated_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[Neon Postgres] savePayment error:', err.message);
  }
}

async function saveTransaction(tx) {
  if (!process.env.DATABASE_URL) return;
  try {
    await query(`
      INSERT INTO usage_transactions (id, user_id, amount, type, description, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;
    `, [
      tx.id,
      tx.user_id,
      tx.amount || 0,
      tx.type,
      tx.notes || tx.description || '',
      tx.metadata ? JSON.stringify(tx.metadata) : null,
      tx.created_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[Neon Postgres] saveTransaction error:', err.message);
  }
}

async function saveCampaign(c) {
  if (!process.env.DATABASE_URL) return;
  try {
    await query(`
      INSERT INTO campaigns (id, user_id, subject, recipients_count, recipients_list, successful_count, failed_count, status, usage_transaction_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING;
    `, [
      c.id,
      c.user_id,
      c.subject || '',
      c.recipients_count || 0,
      c.recipients_preview ? JSON.stringify(c.recipients_preview) : null,
      c.sent_count || 0,
      c.failed_count || 0,
      c.status || 'completed',
      c.usage_transaction_id || null,
      c.created_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[Neon Postgres] saveCampaign error:', err.message);
  }
}

async function saveTemplate(tpl) {
  if (!process.env.DATABASE_URL) return;
  try {
    await query(`
      INSERT INTO templates (id, user_id, name, subject, body, desc_text, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id, user_id) DO UPDATE SET
        name = EXCLUDED.name,
        subject = EXCLUDED.subject,
        body = EXCLUDED.body,
        desc_text = EXCLUDED.desc_text,
        is_default = EXCLUDED.is_default,
        updated_at = NOW();
    `, [
      tpl.id,
      tpl.user_id,
      tpl.name,
      tpl.subject,
      tpl.body,
      tpl.desc || tpl.desc_text || '',
      tpl.is_default || 0,
      tpl.created_at || new Date().toISOString(),
      tpl.updated_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[Neon Postgres] saveTemplate error:', err.message);
  }
}

async function deleteTemplate(id, userId) {
  if (!process.env.DATABASE_URL) return;
  try {
    await query('DELETE FROM templates WHERE id = $1 AND user_id = $2;', [id, userId]);
  } catch (err) {
    console.warn('[Neon Postgres] deleteTemplate error:', err.message);
  }
}

async function saveAppConfig(cfg) {
  if (!process.env.DATABASE_URL) return;
  try {
    await query(`
      INSERT INTO app_configurations (user_id, app_name, app_package_id, closed_testing_url, play_store_url, sender_name, sender_email, smtp_pass, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        app_name = EXCLUDED.app_name,
        app_package_id = EXCLUDED.app_package_id,
        closed_testing_url = EXCLUDED.closed_testing_url,
        play_store_url = EXCLUDED.play_store_url,
        sender_name = EXCLUDED.sender_name,
        sender_email = EXCLUDED.sender_email,
        smtp_pass = EXCLUDED.smtp_pass,
        updated_at = NOW();
    `, [
      cfg.user_id,
      cfg.app_name || '',
      cfg.package_id || '',
      cfg.testing_url || '',
      cfg.direct_url || '',
      cfg.sender_name || '',
      cfg.sender_email || '',
      cfg.app_password || '',
      cfg.updated_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[Neon Postgres] saveAppConfig error:', err.message);
  }
}

module.exports = {
  getPool,
  query,
  transaction,
  initSchema,
  loadAllFromNeon,
  getDiagnostics,
  saveUser,
  saveUsageBalance,
  savePayment,
  saveTransaction,
  saveCampaign,
  saveTemplate,
  deleteTemplate,
  saveAppConfig
};
