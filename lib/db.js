const fs = require('fs');
const path = require('path');
const neon = require('./neon');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    // If read-only filesystem (e.g. Vercel), fall back to /tmp
    const tmpDataDir = path.join('/tmp', 'easyinvite-data');
    if (!fs.existsSync(tmpDataDir)) fs.mkdirSync(tmpDataDir, { recursive: true });
  }
}

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {}
}

const dbFilePath = process.env.DATABASE_FILE || path.join(dataDir, 'easyinvite-store.json');

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price_npr: 0,
    sends_included: 5,
    is_unlimited: 0,
    billing_type: 'forever',
    description: 'Up to 5 Send actions. No login or saved settings required.'
  },
  {
    id: 'starter',
    name: 'Starter',
    price_npr: 100,
    sends_included: 50,
    is_unlimited: 0,
    billing_type: '/month',
    description: '50 Send actions per month. User saved login and settings data.'
  },
  {
    id: 'growth',
    name: 'Growth',
    price_npr: 200,
    sends_included: 100,
    is_unlimited: 0,
    billing_type: '/month',
    description: '100 Send actions per month. User saved login, settings data, and email templates.'
  },
  {
    id: 'pro',
    name: 'Pro',
    price_npr: 300,
    sends_included: 300,
    is_unlimited: 0,
    billing_type: '/month',
    description: '300 Send actions per month. Use email templates + make your own email templates.'
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price_npr: 1000,
    sends_included: -1,
    is_unlimited: 1,
    billing_type: '/lifetime',
    description: 'Unlimited Send actions forever. Lifetime access with custom templates & all features.'
  }
];

const DEFAULT_TEMPLATES = [
  {
    id: 'default',
    name: 'Early Tester Invitation',
    desc: 'Modern two-button format with Join + Play Store links',
    subject: "You're invited to test {{app_name}} on Google Play",
    body: `<p>Hi there,</p>
<p>I'm inviting you to be one of the early testers of <strong>{{app_name}}</strong>. Your help is genuinely valuable — finding bugs, testing features, and shaping the app before its public launch.</p>
<p><strong>How to join:</strong></p>
<ol style="margin: 8px 0 16px 20px; padding: 0; line-height: 1.75;">
  <li>Click <strong>Join as a Tester</strong> and sign in with your Google account.</li>
  <li>Tap <strong>"Become a tester"</strong> on the Play Store testing page.</li>
  <li>Click <strong>Download on Play Store</strong> to install the app.</li>
  <li>Try it out and reply to this email with any feedback.</li>
</ol>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 8px 0;">
  <tr>
    <td style="padding-right: 10px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta">
        <tr><td><a href="{{link}}" target="_blank">1. JOIN AS A TESTER</a></td></tr>
      </table>
    </td>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green">
        <tr><td><a href="{{direct_link}}" target="_blank">2. DOWNLOAD ON PLAY STORE</a></td></tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 4px 0 20px 0; font-size: 12px; color: #64748b;">Step 1: Join test track &rarr; Step 2: Download on Google Play</p>
<p>It's completely free and only takes a couple of minutes. If you find any bugs or have suggestions, simply reply to this email.</p>
<p>Thank you for helping make <strong>{{app_name}}</strong> better.</p>
<p>Best regards,<br><strong>{{sender_name}}</strong></p>`
  },
  {
    id: 'casual',
    name: 'Short & Casual',
    desc: 'Quick and informal — great for friends and colleagues',
    subject: 'Quick favor — help test my app on Google Play?',
    body: `<p>Hey!</p>
<p>I'm about to launch <strong>{{app_name}}</strong> on Google Play and could really use a few testers before the public release. Just two quick steps:</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 8px 0;">
  <tr>
    <td style="padding-right: 10px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta">
        <tr><td><a href="{{link}}" target="_blank">1. JOIN AS A TESTER</a></td></tr>
      </table>
    </td>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green">
        <tr><td><a href="{{direct_link}}" target="_blank">2. DOWNLOAD ON PLAY STORE</a></td></tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 4px 0 20px 0; font-size: 12px; color: #64748b;">Step 1: Join test track &rarr; Step 2: Download on Google Play</p>
<p><em>Note: You must complete Step 1 first before Step 2 works!</em></p>
<p>Let me know what you think — just reply to this email!</p>
<p>Thanks!</p>`
  },
  {
    id: 'detailed',
    name: 'Detailed Invitation',
    desc: 'Includes full instructions and testing checklist',
    subject: "You're invited to our Closed Beta on Google Play",
    body: `<p>Hello,</p>
<p>You've been personally selected to participate in the closed testing program for <strong>{{app_name}}</strong> ahead of its official launch on Google Play.</p>
<p><strong>Getting started is simple — just 2 steps:</strong></p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 8px 0;">
  <tr>
    <td style="padding-right: 10px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta">
        <tr><td><a href="{{link}}" target="_blank">1. JOIN AS A TESTER</a></td></tr>
      </table>
    </td>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green">
        <tr><td><a href="{{direct_link}}" target="_blank">2. DOWNLOAD ON PLAY STORE</a></td></tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 4px 0 20px 0; font-size: 12px; color: #64748b;">Step 1: Join test track &rarr; Step 2: Download on Google Play</p>
<p><em>Sign in with your Google Play email in Step 1, then install the app via Step 2.</em></p>
<p><strong>While testing, please explore:</strong></p>
<ul style="margin: 8px 0 16px 20px; line-height: 1.75;">
  <li>Overall usability and workflow</li>
  <li>App performance and stability</li>
  <li>Any bugs or unexpected behaviour</li>
</ul>
<p>Your feedback makes a real difference. Simply reply to this email with anything you notice.</p>
<p>Thank you for helping us make <strong>{{app_name}}</strong> better!</p>`
  }
];

class JsonDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      users: [],
      plans: DEFAULT_PLANS,
      usage_balances: {},
      usage_transactions: [],
      payments: [],
      campaigns: [],
      templates: [],
      app_configurations: {}
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          plans: DEFAULT_PLANS,
          usage_balances: parsed.usage_balances || {},
          usage_transactions: parsed.usage_transactions || [],
          payments: parsed.payments || [],
          campaigns: parsed.campaigns || [],
          templates: parsed.templates || [],
          app_configurations: parsed.app_configurations || {}
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Could not parse database file, initializing clean store:', err.message);
      this.save();
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const tmpPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error('Failed to atomically save database:', err.message);
    }
  }

  async initPostgres() {
    if (!process.env.DATABASE_URL) return false;
    try {
      await neon.initSchema();
      const neonData = await neon.loadAllFromNeon();
      if (neonData) {
        if (neonData.users && neonData.users.length > 0) {
          // Merge users without losing any
          const existingIds = new Set(neonData.users.map(u => String(u.id)));
          const extra = this.data.users.filter(u => !existingIds.has(String(u.id)));
          this.data.users = [...neonData.users, ...extra];
        }
        if (neonData.usage_balances && Object.keys(neonData.usage_balances).length > 0) {
          this.data.usage_balances = { ...this.data.usage_balances, ...neonData.usage_balances };
        }
        if (neonData.payments && neonData.payments.length > 0) {
          const existingIds = new Set(neonData.payments.map(p => p.id));
          const extra = this.data.payments.filter(p => !existingIds.has(p.id));
          this.data.payments = [...neonData.payments, ...extra];
        }
        if (neonData.campaigns && neonData.campaigns.length > 0) {
          const existingIds = new Set(neonData.campaigns.map(c => c.id));
          const extra = this.data.campaigns.filter(c => !existingIds.has(c.id));
          this.data.campaigns = [...neonData.campaigns, ...extra];
        }
        if (neonData.templates && neonData.templates.length > 0) {
          const existingIds = new Set(neonData.templates.map(t => `${t.id}_${t.user_id}`));
          const extra = this.data.templates.filter(t => !existingIds.has(`${t.id}_${t.user_id}`));
          this.data.templates = [...neonData.templates, ...extra];
        }
        if (neonData.app_configurations && Object.keys(neonData.app_configurations).length > 0) {
          this.data.app_configurations = { ...this.data.app_configurations, ...neonData.app_configurations };
        }
        this.save();
        console.log('[Neon Postgres] Synchronized live data from Neon into memory');
      }
      return true;
    } catch (err) {
      console.warn('[Neon Postgres] Synchronization note:', err.message);
      return false;
    }
  }

  async getNeonDiagnostics() {
    return await neon.getDiagnostics();
  }

  // --- Users ---
  getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }

  getUserById(id) {
    if (!id) return null;
    const user = this.data.users.find(u => String(u.id) === String(id));
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  getUserAuthById(id) {
    if (!id) return null;
    return this.data.users.find(u => String(u.id) === String(id)) || null;
  }

  createUser({ name, email, passwordHash, role = 'user', isVerified = 0, verificationToken = null, verificationTokenExpires = null, planId = 'starter' }) {
    const cleanEmail = email.trim().toLowerCase();
    if (this.getUserByEmail(cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const nextId = this.data.users.length > 0 
      ? Math.max(...this.data.users.map(u => Number(u.id) || 0)) + 1 
      : 1;

    const now = new Date().toISOString();
    const newUser = {
      id: nextId,
      name: name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      role: role || 'user',
      is_verified: isVerified ? 1 : 0,
      verification_token: verificationToken,
      verification_token_expires: verificationTokenExpires,
      reset_token: null,
      reset_token_expires: null,
      created_at: now,
      updated_at: now
    };

    this.data.users.push(newUser);

    const isAdmin = (role === 'admin');
    const assignedPlan = isAdmin ? 'lifetime' : (planId || 'starter');
    // Initialize usage balance (Admins receive Lifetime unlimited, new users receive their chosen plan with 0 sends until payment approved)
    this.data.usage_balances[String(nextId)] = {
      user_id: nextId,
      plan_id: assignedPlan,
      sends_remaining: isAdmin ? -1 : 0,
      is_lifetime: (assignedPlan === 'lifetime' || isAdmin) ? 1 : 0,
      total_sends_purchased: isAdmin ? 1000 : 0,
      total_sends_consumed: 0,
      reserved_sends: 0,
      updated_at: now
    };

    // Seed default user templates
    for (const tpl of DEFAULT_TEMPLATES) {
      this.data.templates.push({
        id: `${tpl.id}_${nextId}`,
        template_key: tpl.id,
        user_id: nextId,
        name: tpl.name,
        desc: tpl.desc,
        subject: tpl.subject,
        body: tpl.body,
        created_at: now,
        updated_at: now
      });
    }

    // Initialize empty app configuration
    this.data.app_configurations[String(nextId)] = {
      user_id: nextId,
      app_name: '',
      package_id: '',
      testing_url: '',
      direct_url: '',
      sender_name: name.trim(),
      sender_email: cleanEmail,
      app_password: '',
      smtp_online: 1,
      updated_at: now
    };

    this.save();
    (async () => {
      try {
        await neon.saveUser(newUser);
        await neon.saveUsageBalance(this.data.usage_balances[String(nextId)]);
        await neon.saveAppConfig(this.data.app_configurations[String(nextId)]);
        for (const tpl of DEFAULT_TEMPLATES) {
          await neon.saveTemplate({
            id: `${tpl.id}_${nextId}`,
            user_id: nextId,
            name: tpl.name,
            subject: tpl.subject,
            body: tpl.body,
            desc_text: tpl.desc
          });
        }
      } catch (err) {
        console.warn('[Neon Sync]', err.message);
      }
    })();
    return this.getUserById(nextId);
  }

  verifyUserEmail(tokenOrCode, email = null) {
    if (!tokenOrCode) return null;
    const cleanToken = String(tokenOrCode).trim();
    let user = null;
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      user = this.data.users.find(u => u.email.toLowerCase() === cleanEmail && u.verification_token === cleanToken);
    }
    if (!user) {
      user = this.data.users.find(u => u.verification_token === cleanToken);
    }
    if (!user) return null;

    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return { expired: true };
    }

    user.is_verified = 1;
    user.verification_token = null;
    user.verification_token_expires = null;
    user.updated_at = new Date().toISOString();

    this.save();
    neon.saveUser(user);
    return this.getUserById(user.id);
  }

  setVerificationToken(userId, token, expires) {
    const user = this.data.users.find(u => String(u.id) === String(userId));
    if (user) {
      user.verification_token = token;
      user.verification_token_expires = expires;
      user.updated_at = new Date().toISOString();
      this.save();
    }
  }

  updateUserPassword(userId, passwordHash) {
    const user = this.data.users.find(u => String(u.id) === String(userId));
    if (user) {
      user.password_hash = passwordHash;
      user.reset_token = null;
      user.reset_token_expires = null;
      user.updated_at = new Date().toISOString();
      this.save();
    }
  }

  async deleteUser(userId) {
    const uid = Number(userId);
    const strId = String(userId);

    // 1. Remove user and all associated child data from local in-memory store
    this.data.users = this.data.users.filter(u => Number(u.id) !== uid);
    delete this.data.usage_balances[strId];
    if (this.data.user_configs) {
      delete this.data.user_configs[strId];
    }
    if (this.data.templates) {
      this.data.templates = this.data.templates.filter(t => Number(t.user_id) !== uid);
    }
    if (this.data.campaigns) {
      this.data.campaigns = this.data.campaigns.filter(c => Number(c.user_id) !== uid);
    }
    if (this.data.usage_transactions) {
      this.data.usage_transactions = this.data.usage_transactions.filter(tx => Number(tx.user_id) !== uid);
    }
    if (this.data.payments) {
      this.data.payments = this.data.payments.filter(p => Number(p.user_id) !== uid);
    }

    this.save();

    // 2. Cascade delete from Neon PostgreSQL
    if (process.env.DATABASE_URL) {
      try {
        await neon.query('DELETE FROM users WHERE id = $1', [uid]);
      } catch (err) {
        console.warn('[Neon Sync] Delete user notice:', err.message);
      }
    }
    return true;
  }

  // --- Plans & Usage ---
  getPlans() {
    return DEFAULT_PLANS;
  }

  getPlanById(planId) {
    return DEFAULT_PLANS.find(p => p.id === planId) || null;
  }

  getGuestSends(guestKey) {
    if (!this.data.guest_sends) this.data.guest_sends = {};
    return Number(this.data.guest_sends[guestKey]) || 0;
  }

  incrementGuestSends(guestKey) {
    if (!this.data.guest_sends) this.data.guest_sends = {};
    const count = (Number(this.data.guest_sends[guestKey]) || 0) + 1;
    this.data.guest_sends[guestKey] = count;
    this.save();
    return count;
  }

  getUsageBalance(userId) {
    const key = String(userId);
    const user = this.getUserById(userId);
    const isAdmin = Boolean(user && user.role === 'admin');

    if (!this.data.usage_balances[key]) {
      this.data.usage_balances[key] = {
        user_id: Number(userId),
        plan_id: isAdmin ? 'lifetime' : 'free',
        sends_remaining: isAdmin ? -1 : 0,
        is_lifetime: isAdmin ? 1 : 0,
        total_sends_purchased: isAdmin ? 1000 : 0,
        total_sends_consumed: 0,
        reserved_sends: 0,
        updated_at: new Date().toISOString()
      };
      this.save();
      neon.saveUsageBalance(this.data.usage_balances[key]).catch(() => {});
    } else if (isAdmin && this.data.usage_balances[key].is_lifetime !== 1) {
      this.data.usage_balances[key].plan_id = 'lifetime';
      this.data.usage_balances[key].is_lifetime = 1;
      this.data.usage_balances[key].sends_remaining = -1;
      this.data.usage_balances[key].updated_at = new Date().toISOString();
      this.save();
      neon.saveUsageBalance(this.data.usage_balances[key]).catch(() => {});
    }
    return { ...this.data.usage_balances[key] };
  }

  /**
   * Reserves exactly 1 Send Action atomically before sending an invitation batch.
   * If user has Lifetime access or is Admin, no deduction occurs but reservation succeeds.
   * If user has 0 sends remaining, reservation fails with NO_BALANCE.
   */
  reserveSendUse(userId) {
    const key = String(userId);
    const user = this.getUserById(userId);
    const isAdmin = Boolean(user && user.role === 'admin');
    const balance = this.getUsageBalance(userId);

    // Lifetime accounts and Admins have unlimited sends
    if (isAdmin || balance.is_lifetime === 1) {
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return {
        ok: true,
        isLifetime: true,
        transactionId: txId,
        remaining: 'Unlimited'
      };
    }

    if (balance.sends_remaining <= 0) {
      return {
        ok: false,
        error: 'NO_BALANCE',
        remaining: 0
      };
    }

    // Atomic reservation
    const balRecord = this.data.usage_balances[key];
    balRecord.sends_remaining -= 1;
    balRecord.reserved_sends += 1;
    balRecord.updated_at = new Date().toISOString();

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.data.usage_transactions.push({
      id: txId,
      user_id: Number(userId),
      type: 'send_reservation',
      amount: -1,
      balance_after: balRecord.sends_remaining,
      reference_id: txId,
      notes: 'Reserved 1 send action for campaign',
      created_at: new Date().toISOString()
    });

    this.save();
    neon.saveUsageBalance(balRecord);
    neon.saveTransaction(this.data.usage_transactions[this.data.usage_transactions.length - 1]);

    return {
      ok: true,
      isLifetime: false,
      transactionId: txId,
      remaining: balRecord.sends_remaining
    };
  }

  /**
   * Permanently consumes the reserved send action upon successful dispatch,
   * and logs the campaign to the campaigns table.
   */
  consumeSendUse(userId, transactionId, campaignData) {
    const key = String(userId);
    const balRecord = this.data.usage_balances[key] || this.getUsageBalance(userId);

    if (balRecord.is_lifetime !== 1) {
      balRecord.reserved_sends = Math.max(0, (balRecord.reserved_sends || 0) - 1);
      balRecord.total_sends_consumed = (balRecord.total_sends_consumed || 0) + 1;
      balRecord.updated_at = new Date().toISOString();

      this.data.usage_transactions.push({
        id: `tx_c_${Date.now()}`,
        user_id: Number(userId),
        type: 'send_consumed',
        amount: 0,
        balance_after: balRecord.sends_remaining,
        reference_id: campaignData.id || transactionId,
        notes: 'Permanently consumed 1 send action after successful dispatch',
        created_at: new Date().toISOString()
      });
    } else {
      balRecord.total_sends_consumed = (balRecord.total_sends_consumed || 0) + 1;
      balRecord.updated_at = new Date().toISOString();
    }

    // Record campaign
    this.data.campaigns.unshift({
      id: campaignData.id || `camp_${Date.now()}`,
      user_id: Number(userId),
      subject: campaignData.subject,
      recipients_count: campaignData.recipientsCount || 0,
      recipients_preview: campaignData.recipientsPreview || [],
      sent_count: campaignData.sentCount || 0,
      failed_count: campaignData.failedCount || 0,
      status: 'completed',
      usage_transaction_id: transactionId,
      error_message: null,
      created_at: new Date().toISOString()
    });

    this.save();
    neon.saveUsageBalance(balRecord);
    if (this.data.usage_transactions.length > 0) {
      neon.saveTransaction(this.data.usage_transactions[this.data.usage_transactions.length - 1]);
    }
    if (this.data.campaigns.length > 0) {
      neon.saveCampaign(this.data.campaigns[0]);
    }
    return { ...balRecord };
  }

  /**
   * Restores a reserved send action if sending completely failed before dispatch.
   */
  restoreSendUse(userId, transactionId, campaignData, errorMessage) {
    const key = String(userId);
    const balRecord = this.data.usage_balances[key] || this.getUsageBalance(userId);

    if (balRecord.is_lifetime !== 1) {
      balRecord.sends_remaining += 1;
      balRecord.reserved_sends = Math.max(0, (balRecord.reserved_sends || 0) - 1);
      balRecord.updated_at = new Date().toISOString();

      this.data.usage_transactions.push({
        id: `tx_r_${Date.now()}`,
        user_id: Number(userId),
        type: 'send_refunded',
        amount: 1,
        balance_after: balRecord.sends_remaining,
        reference_id: transactionId,
        notes: `Refunded send action: ${errorMessage || 'Dispatch failed'}`,
        created_at: new Date().toISOString()
      });
    }

    if (campaignData && campaignData.id) {
      this.data.campaigns.unshift({
        id: campaignData.id,
        user_id: Number(userId),
        subject: campaignData.subject || 'Failed Campaign',
        recipients_count: campaignData.recipientsCount || 0,
        recipients_preview: campaignData.recipientsPreview || [],
        sent_count: 0,
        failed_count: campaignData.failedCount || 0,
        status: 'failed',
        usage_transaction_id: transactionId,
        error_message: errorMessage || 'Email dispatch failed',
        created_at: new Date().toISOString()
      });
    }

    this.save();
    neon.saveUsageBalance(balRecord);
    if (this.data.usage_transactions.length > 0) {
      neon.saveTransaction(this.data.usage_transactions[this.data.usage_transactions.length - 1]);
    }
    if (campaignData && campaignData.id && this.data.campaigns.length > 0) {
      neon.saveCampaign(this.data.campaigns[0]);
    }
    return { ...balRecord };
  }

  // --- Payments & Purchases ---
  createPayment({ userId, planId, amountNpr, sendsToCredit, isLifetime, referenceNumber, bankName = 'Bank Transfer', screenshotPath = null, notes = null }) {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const payment = {
      id: paymentId,
      user_id: Number(userId),
      plan_id: planId,
      amount_npr: Number(amountNpr),
      sends_to_credit: Number(sendsToCredit),
      is_lifetime: isLifetime ? 1 : 0,
      bank_name: bankName || 'Bank Transfer',
      reference_number: String(referenceNumber).trim(),
      screenshot_path: screenshotPath,
      notes: notes || null,
      status: 'PENDING',
      admin_notes: '',
      reviewed_by: null,
      reviewed_at: null,
      created_at: now,
      updated_at: now
    };

    this.data.payments.unshift(payment);
    this.save();
    neon.savePayment(payment);

    return this.getPaymentById(paymentId);
  }

  getPaymentById(paymentId) {
    const payment = this.data.payments.find(p => p.id === paymentId);
    if (!payment) return null;

    const user = this.getUserById(payment.user_id);
    const plan = this.getPlanById(payment.plan_id);

    return {
      ...payment,
      bank_name: payment.bank_name || 'Bank Transfer',
      user_name: user ? user.name : 'Customer',
      user_email: user ? user.email : '',
      plan_name: plan ? plan.name : payment.plan_id
    };
  }

  getUserPayments(userId) {
    return this.data.payments
      .filter(p => String(p.user_id) === String(userId))
      .map(p => {
        const plan = this.getPlanById(p.plan_id);
        return {
          ...p,
          bank_name: p.bank_name || 'Bank Transfer',
          plan_name: plan ? plan.name : p.plan_id
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getAllPayments() {
    return this.data.payments
      .map(p => {
        const user = this.getUserById(p.user_id);
        const plan = this.getPlanById(p.plan_id);
        return {
          ...p,
          bank_name: p.bank_name || 'Bank Transfer',
          user_name: user ? user.name : 'Customer',
          user_email: user ? user.email : '',
          plan_name: plan ? plan.name : p.plan_id
        };
      })
      .sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }

  /**
   * Idempotent payment approval by admin.
   * Credits user usage balance only once.
   */
  approvePayment(paymentId, adminUserId) {
    const payment = this.data.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status !== 'PENDING') {
      throw new Error(`Payment is already ${payment.status}. Cannot approve again.`);
    }

    const now = new Date().toISOString();
    payment.status = 'APPROVED';
    payment.reviewed_by = adminUserId;
    payment.reviewed_at = now;
    payment.updated_at = now;

    const key = String(payment.user_id);
    const balRecord = this.data.usage_balances[key] || this.getUsageBalance(payment.user_id);

    if (payment.is_lifetime === 1) {
      balRecord.is_lifetime = 1;
      balRecord.plan_id = 'lifetime';
      balRecord.updated_at = now;

      this.data.usage_transactions.push({
        id: `tx_pay_${Date.now()}`,
        user_id: payment.user_id,
        type: 'purchase_credit',
        amount: 0,
        balance_after: 999999,
        reference_id: paymentId,
        notes: 'Approved Lifetime Unlimited Send actions',
        created_at: now
      });
    } else {
      balRecord.sends_remaining = (balRecord.sends_remaining || 0) + payment.sends_to_credit;
      balRecord.total_sends_purchased = (balRecord.total_sends_purchased || 0) + payment.sends_to_credit;
      balRecord.plan_id = payment.plan_id;
      balRecord.updated_at = now;

      this.data.usage_transactions.push({
        id: `tx_pay_${Date.now()}`,
        user_id: payment.user_id,
        type: 'purchase_credit',
        amount: payment.sends_to_credit,
        balance_after: balRecord.sends_remaining,
        reference_id: paymentId,
        notes: `Approved ${payment.plan_id.toUpperCase()} plan (+${payment.sends_to_credit} Send actions)`,
        created_at: now
      });
    }

    this.save();
    neon.savePayment(payment);
    neon.saveUsageBalance(balRecord);
    if (this.data.usage_transactions.length > 0) {
      neon.saveTransaction(this.data.usage_transactions[this.data.usage_transactions.length - 1]);
    }
    return this.getPaymentById(paymentId);
  }

  rejectPayment(paymentId, adminUserId, adminNotes = '') {
    const payment = this.data.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status !== 'PENDING') {
      throw new Error(`Payment is already ${payment.status}. Cannot reject.`);
    }

    const now = new Date().toISOString();
    payment.status = 'REJECTED';
    payment.admin_notes = adminNotes;
    payment.reviewed_by = adminUserId;
    payment.reviewed_at = now;
    payment.updated_at = now;

    this.save();
    neon.savePayment(payment);
    return this.getPaymentById(paymentId);
  }

  // --- Templates ---
  getUserTemplates(userId) {
    const list = this.data.templates.filter(t => String(t.user_id) === String(userId));
    if (list.length === 0) {
      // Lazy seed defaults if user has none
      const now = new Date().toISOString();
      for (const tpl of DEFAULT_TEMPLATES) {
        const item = {
          id: `${tpl.id}_${userId}`,
          template_key: tpl.id,
          user_id: Number(userId),
          name: tpl.name,
          desc: tpl.desc,
          subject: tpl.subject,
          body: tpl.body,
          created_at: now,
          updated_at: now
        };
        this.data.templates.push(item);
      }
      this.save();
      return this.data.templates.filter(t => String(t.user_id) === String(userId));
    }
    return list;
  }

  saveUserTemplate(userId, template) {
    const id = template.id || `custom_${Date.now()}`;
    const now = new Date().toISOString();

    const existing = this.data.templates.find(t => t.id === id && String(t.user_id) === String(userId));
    if (existing) {
      existing.name = template.name;
      existing.desc = template.desc || '';
      existing.subject = template.subject;
      existing.body = template.body;
      existing.updated_at = now;
      this.save();
      neon.saveTemplate(existing);
      return existing;
    } else {
      const newTpl = {
        id,
        user_id: Number(userId),
        name: template.name,
        desc: template.desc || '',
        subject: template.subject,
        body: template.body,
        created_at: now,
        updated_at: now
      };
      this.data.templates.push(newTpl);
      this.save();
      neon.saveTemplate(newTpl);
      return newTpl;
    }
  }

  deleteUserTemplate(userId, templateId) {
    const idx = this.data.templates.findIndex(t => t.id === templateId && String(t.user_id) === String(userId));
    if (idx !== -1) {
      this.data.templates.splice(idx, 1);
      this.save();
      neon.deleteTemplate(templateId, userId);
      return true;
    }
    return false;
  }

  // --- App & Sender Configurations ---
  getUserAppConfig(userId) {
    const key = String(userId);
    if (!this.data.app_configurations[key]) {
      const user = this.getUserById(userId);
      this.data.app_configurations[key] = {
        user_id: Number(userId),
        app_name: '',
        package_id: '',
        testing_url: '',
        direct_url: '',
        sender_name: user ? user.name : '',
        sender_email: user ? user.email : '',
        app_password: '',
        smtp_online: 1,
        updated_at: new Date().toISOString()
      };
      this.save();
    }
    return { ...this.data.app_configurations[key] };
  }

  saveUserAppConfig(userId, config) {
    const key = String(userId);
    const existing = this.getUserAppConfig(userId);

    const updated = {
      ...existing,
      user_id: Number(userId),
      app_name: config.appName !== undefined ? config.appName : existing.app_name,
      package_id: config.packageId !== undefined ? config.packageId : existing.package_id,
      testing_url: config.testingUrl !== undefined ? config.testingUrl : existing.testing_url,
      direct_url: config.directUrl !== undefined ? config.directUrl : existing.direct_url,
      sender_name: config.senderName !== undefined ? config.senderName : existing.sender_name,
      sender_email: config.senderEmail !== undefined ? config.senderEmail : existing.sender_email,
      app_password: config.appPassword !== undefined ? config.appPassword : existing.app_password,
      smtp_online: config.smtpOnline !== undefined ? (config.smtpOnline ? 1 : 0) : existing.smtp_online,
      updated_at: new Date().toISOString()
    };

    this.data.app_configurations[key] = updated;
    this.save();
    neon.saveAppConfig(updated);
    return updated;
  }

  // --- Campaigns ---
  getUserCampaigns(userId, limit = 50) {
    return this.data.campaigns
      .filter(c => String(c.user_id) === String(userId))
      .slice(0, limit);
  }

  // --- Admin Stats ---
  getAdminStats() {
    const totalUsers = this.data.users.length;
    const pendingPayments = this.data.payments.filter(p => p.status === 'PENDING').length;
    const approvedPayments = this.data.payments.filter(p => p.status === 'APPROVED');
    const totalRevenueNpr = approvedPayments.reduce((sum, p) => sum + (p.amount_npr || 0), 0);
    const totalCampaigns = this.data.campaigns.length;
    const totalEmailsSent = this.data.campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);

    return {
      totalUsers,
      pendingPayments,
      approvedPaymentsCount: approvedPayments.length,
      totalRevenueNpr,
      totalCampaigns,
      totalEmailsSent
    };
  }
}

const dbInstance = new JsonDatabase(dbFilePath);

module.exports = dbInstance;
