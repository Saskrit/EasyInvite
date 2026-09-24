require('dotenv').config();
const fs = require('fs');
const path = require('path');
const neon = require('../lib/neon');

async function syncLocalToNeon() {
  const storePath = path.join(__dirname, '..', 'data', 'easyinvite-store.json');
  if (!fs.existsSync(storePath)) {
    console.log('No local store file found.');
    return;
  }

  const raw = fs.readFileSync(storePath, 'utf8');
  const data = JSON.parse(raw);
  console.log(`Syncing ${data.users?.length || 0} users and ${data.payments?.length || 0} payments to Neon...`);

  for (const u of (data.users || [])) {
    await neon.saveUser(u);
    const bal = data.usage_balances?.[String(u.id)];
    if (bal) await neon.saveUsageBalance(bal);
    const cfg = data.app_configurations?.[String(u.id)];
    if (cfg) await neon.saveAppConfig(cfg);
  }

  for (const p of (data.payments || [])) {
    await neon.savePayment(p);
  }

  for (const c of (data.campaigns || [])) {
    await neon.saveCampaign(c);
  }

  for (const t of (data.templates || [])) {
    await neon.saveTemplate(t);
  }

  console.log('✓ All local data successfully synchronized into Neon PostgreSQL!');
  const diag = await neon.getDiagnostics();
  console.log('Neon Diagnostics after sync:', diag);
}

syncLocalToNeon().catch(console.error).finally(() => process.exit(0));
