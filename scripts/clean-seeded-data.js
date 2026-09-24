require('dotenv').config();
const fs = require('fs');
const path = require('path');
const neon = require('../lib/neon');

async function cleanData() {
  console.log('--- Cleaning Seeded Data (Preserving Admin Only) ---');

  // 1. Clean Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    try {
      console.log('[Neon] Connecting and cleaning non-admin data...');
      
      // Delete all payments first
      const pRes = await neon.query('DELETE FROM payments');
      console.log(`[Neon] Deleted ${pRes.rowCount} test payment(s)`);

      // Delete all campaigns
      const cRes = await neon.query('DELETE FROM campaigns');
      console.log(`[Neon] Deleted ${cRes.rowCount} test campaign(s)`);

      // Delete all usage transactions
      const txRes = await neon.query('DELETE FROM usage_transactions');
      console.log(`[Neon] Deleted ${txRes.rowCount} test transaction(s)`);

      // Delete non-admin usage balances
      const balRes = await neon.query(`
        DELETE FROM usage_balances 
        WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin' OR LOWER(email) = 'saskreetking@gmail.com')
      `);
      console.log(`[Neon] Deleted ${balRes.rowCount} non-admin usage balance(s)`);

      // Delete non-admin templates
      const tplRes = await neon.query(`
        DELETE FROM templates 
        WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin' OR LOWER(email) = 'saskreetking@gmail.com')
      `);
      console.log(`[Neon] Deleted ${tplRes.rowCount} non-admin template(s)`);

      // Delete non-admin app configs
      const cfgRes = await neon.query(`
        DELETE FROM app_configurations 
        WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin' OR LOWER(email) = 'saskreetking@gmail.com')
      `);
      console.log(`[Neon] Deleted ${cfgRes.rowCount} non-admin app configuration(s)`);

      // Delete all non-admin users
      const uRes = await neon.query(`
        DELETE FROM users 
        WHERE role != 'admin' AND LOWER(email) != 'saskreetking@gmail.com'
        RETURNING id, name, email
      `);
      console.log(`[Neon] Deleted ${uRes.rowCount} non-admin user(s):`);
      uRes.rows.forEach(u => console.log(`   - User ID ${u.id}: ${u.email} (${u.name})`));

      // Ensure remaining admin users have Lifetime balances
      await neon.query(`
        UPDATE usage_balances 
        SET plan_id = 'lifetime', sends_remaining = -1, is_lifetime = 1, updated_at = NOW()
        WHERE user_id IN (SELECT id FROM users WHERE role = 'admin' OR LOWER(email) = 'saskreetking@gmail.com')
      `);
      console.log('[Neon] Admin usage balance(s) verified as Lifetime');

      const remainingUsers = await neon.query('SELECT id, name, email, role FROM users');
      console.log('\n[Neon] Remaining Users:');
      remainingUsers.rows.forEach(u => console.log(`   ✓ ID: ${u.id} | Email: ${u.email} | Role: ${u.role}`));
    } catch (neonErr) {
      console.error('[Neon Error]', neonErr.message);
    }
  }

  // 2. Clean Local Store JSON (data/easyinvite-store.json)
  const storePath = path.join(__dirname, '..', 'data', 'easyinvite-store.json');
  if (fs.existsSync(storePath)) {
    try {
      const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      
      const adminUsers = (storeData.users || []).filter(u => 
        u.role === 'admin' || 
        u.email === 'admin@easyinvite.com' || 
        u.email === 'saskreetking@gmail.com'
      );
      const adminIds = new Set(adminUsers.map(u => String(u.id)));

      // Keep only admin usage balances
      const filteredBalances = {};
      for (const [key, bal] of Object.entries(storeData.usage_balances || {})) {
        if (adminIds.has(String(key)) || (bal && adminIds.has(String(bal.user_id)))) {
          bal.plan_id = 'lifetime';
          bal.sends_remaining = -1;
          bal.is_lifetime = 1;
          filteredBalances[key] = bal;
        }
      }

      // Keep only admin app configurations
      const filteredConfigs = {};
      for (const [key, cfg] of Object.entries(storeData.app_configurations || {})) {
        if (adminIds.has(String(key))) {
          filteredConfigs[key] = cfg;
        }
      }

      // Keep only admin templates
      const filteredTemplates = (storeData.templates || []).filter(t => 
        adminIds.has(String(t.user_id))
      );

      const cleanedStore = {
        users: adminUsers,
        plans: storeData.plans || [],
        usage_balances: filteredBalances,
        usage_transactions: [],
        payments: [],
        campaigns: [],
        templates: filteredTemplates,
        app_configurations: filteredConfigs
      };

      fs.writeFileSync(storePath, JSON.stringify(cleanedStore, null, 2), 'utf8');
      console.log(`\n[Local Store] Successfully cleaned ${storePath}`);
      console.log(`   - Kept ${adminUsers.length} admin user(s)`);
      console.log(`   - Payments count reset to 0`);
      console.log(`   - Campaigns count reset to 0`);
      console.log(`   - Transactions count reset to 0`);
    } catch (err) {
      console.error('[Local Store Error]', err.message);
    }
  }

  console.log('\n✓ Cleanup complete! All seeded data removed except admin.');
  process.exit(0);
}

cleanData();
