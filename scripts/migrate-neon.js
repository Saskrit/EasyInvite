const { Client } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4v0hAagHtGCJ@ep-divine-credit-b42vkynj-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  console.log('Connecting to Neon PostgreSQL database...');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Neon successfully!');

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

    -- Seed Default Plans
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

  console.log('Executing PostgreSQL migration...');
  await client.query(schemaSql);
  console.log('✓ All Neon PostgreSQL tables created and verified successfully!');

  // Seed default admin in database
  const bcrypt = require('bcryptjs');
  const adminEmail = 'admin@easyinvite.com';
  const adminPassHash = await bcrypt.hash('Admin@12345', 10);
  
  await client.query(`
    INSERT INTO users (name, email, password_hash, role, is_verified)
    VALUES ($1, $2, $3, 'admin', 1)
    ON CONFLICT (email) DO UPDATE SET
      role = 'admin',
      is_verified = 1;
  `, ['EasyInvite Admin', adminEmail, adminPassHash]);

  console.log('✓ Default admin verified in Neon database: admin@easyinvite.com');

  await client.end();
  console.log('Neon migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
