const fs = require('fs');
const path = require('path');
const db = require('./db');
const auth = require('./auth');
const neon = require('./neon');
const {
  parseJsonBody,
  createGmailTransporter,
  htmlToPlainText,
  wrapInDeliverableEmailShell,
  escapeXml,
  escapeHtml,
  setCorsAndSecurityHeaders
} = require('./mailer');

const BANK_DETAILS = {
  bankName: process.env.BANK_NAME || 'Global IME Bank',
  accountName: process.env.BANK_ACCOUNT_NAME || 'EasyInvite Technologies',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '01234567890123',
  branch: process.env.BANK_BRANCH || 'Kathmandu Main Branch',
  instructions: 'Please transfer the exact amount and enter the transaction / reference number below. You may also attach a screenshot of the confirmation.',
  qrImage: '/easyinvite.png'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Main API request handler
async function handleApiRequest(req, res, explicitPath) {
  const urlPath = explicitPath || (req.url || '').split('?')[0];
  const method = req.method;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // --------------------------------------------------------------------------
  // AUTH ROUTES
  // --------------------------------------------------------------------------

  // POST /api/auth/register
  if (method === 'POST' && urlPath === '/api/auth/register') {
    if (!auth.checkRateLimit(clientIp, 'register', 10, 60000)) {
      return sendJson(res, 429, { success: false, error: 'Too many registration attempts. Please wait a minute.' });
    }

    try {
      const body = await parseJsonBody(req);
      const { name, email, password, planId } = body;

      if (!name || name.trim().length < 2) {
        return sendJson(res, 400, { success: false, error: 'Please enter a valid full name (minimum 2 characters).' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return sendJson(res, 400, { success: false, error: 'Please enter a valid email address.' });
      }

      if (!password || password.length < 6) {
        return sendJson(res, 400, { success: false, error: 'Password must be at least 6 characters.' });
      }

      const validPlans = ['starter', 'growth', 'pro', 'lifetime'];
      const chosenPlan = (planId && validPlans.includes(planId)) ? planId : 'starter';

      const cleanEmail = email.trim().toLowerCase();
      let existing = db.getUserByEmail(cleanEmail);
      if (!existing && process.env.DATABASE_URL) {
        existing = await neon.getUserByEmailFromNeon(cleanEmail);
      }
      if (existing) {
        return sendJson(res, 400, { success: false, error: 'An account with this email address already exists.' });
      }

      const passwordHash = await auth.hashPassword(password);
      const verificationCode = auth.generateVerificationCode();
      const tokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const role = auth.isDesignatedAdmin(cleanEmail) ? 'admin' : 'user';

      const newUser = db.createUser({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role,
        isVerified: 0,
        verificationToken: verificationCode,
        verificationTokenExpires: tokenExpires,
        planId: chosenPlan
      });

      // Try sending verification email if SMTP configured
      let emailSent = false;
      let emailError = null;
      const systemSmtp = process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD;
      console.log(`[Auth Register] System SMTP configured: ${Boolean(systemSmtp)} (${process.env.SMTP_EMAIL ? 'user configured' : 'none'})`);
      if (systemSmtp) {
        try {
          const transporter = createGmailTransporter(process.env.SMTP_EMAIL, process.env.SMTP_APP_PASSWORD);
          console.log(`[Auth Register] Dispatching 4-digit code email to: ${cleanEmail}...`);
          const info = await transporter.sendMail({
            from: `"EasyInvite" <${process.env.SMTP_EMAIL.trim()}>`,
            to: cleanEmail,
            subject: `Your EasyInvite Verification Code: ${verificationCode}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Welcome to EasyInvite, ${escapeHtml(newUser.name)}!</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.5;">Please use the 4-digit verification code below to activate your account and complete your registration:</p>
                <div style="text-align: center; margin: 26px 0;">
                  <div style="display: inline-block; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #2563eb; background: #eff6ff; padding: 16px 28px; border-radius: 10px; border: 2px dashed #93c5fd; font-family: monospace;">
                    ${verificationCode}
                  </div>
                </div>
                <p style="font-size: 13px; color: #64748b; text-align: center;">Enter this 4-digit code in the registration verification screen. This code will expire in 60 minutes.</p>
              </div>
            `
          });
          console.log(`[Auth Register] ✓ Verification email successfully sent to ${cleanEmail} (messageId: ${info.messageId})`);
          emailSent = true;
        } catch (mailErr) {
          console.error('[Auth Register] ✕ Verification email failed:', mailErr.message);
          emailError = mailErr.message;
        }
      } else {
        console.warn('[Auth Register] Outgoing SMTP is not configured in .env (SMTP_EMAIL / SMTP_APP_PASSWORD)');
      }

      return sendJson(res, 201, {
        success: true,
        message: 'Account created! Please enter the 4-digit verification code sent to your email.',
        requiresVerification: true,
        email: cleanEmail,
        emailSent,
        emailError: emailSent ? null : emailError
      });
    } catch (err) {
      console.error('Register error:', err);
      return sendJson(res, 500, { success: false, error: err.message || 'Failed to register account.' });
    }
  }

  // POST /api/auth/verify-email
  if (method === 'POST' && urlPath === '/api/auth/verify-email') {
    try {
      const body = await parseJsonBody(req);
      const code = String(body.code || body.token || '').trim();
      const email = body.email ? String(body.email).trim().toLowerCase() : null;

      if (!code) {
        return sendJson(res, 400, { success: false, error: 'Please enter your 4-digit verification code.' });
      }

      if (code.length !== 4 || !/^\d{4}$/.test(code)) {
        return sendJson(res, 400, { success: false, error: 'Verification code must be exactly 4 digits.' });
      }

      const verifiedUser = db.verifyUserEmail(code, email);
      if (!verifiedUser) {
        return sendJson(res, 400, { success: false, error: 'Invalid 4-digit verification code. Please check and try again.' });
      }

      if (verifiedUser.expired) {
        return sendJson(res, 400, { success: false, error: 'Verification code has expired. Please request a new code.' });
      }

      const jwtToken = auth.generateToken(verifiedUser);
      return sendJson(res, 200, {
        success: true,
        message: 'Email verified successfully! You are now logged in.',
        token: jwtToken,
        user: verifiedUser,
        chosenPlan: verifiedUser.plan_id || 'free'
      });
    } catch (err) {
      console.error('Verify email error:', err);
      return sendJson(res, 500, { success: false, error: 'Error verifying email.' });
    }
  }

  // POST /api/auth/resend-code
  if (method === 'POST' && urlPath === '/api/auth/resend-code') {
    try {
      const body = await parseJsonBody(req);
      const email = body.email ? String(body.email).trim().toLowerCase() : '';
      if (!email) {
        return sendJson(res, 400, { success: false, error: 'Email address is required to resend code.' });
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        return sendJson(res, 404, { success: false, error: 'No account found with this email address.' });
      }

      if (user.is_verified === 1) {
        return sendJson(res, 400, { success: false, error: 'This account is already verified. You can log in directly.' });
      }

      const newCode = auth.generateVerificationCode();
      const newExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.setVerificationToken(user.id, newCode, newExpires);

      let emailSent = false;
      let emailError = null;
      if (process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD) {
        try {
          const transporter = createGmailTransporter(process.env.SMTP_EMAIL, process.env.SMTP_APP_PASSWORD);
          console.log(`[Auth Resend] Sending fresh verification code email to ${user.email}...`);
          const info = await transporter.sendMail({
            from: `"EasyInvite" <${process.env.SMTP_EMAIL.trim()}>`,
            to: user.email,
            subject: `Your New EasyInvite Verification Code: ${newCode}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Verification Code Resent</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.5;">Here is your new 4-digit verification code to complete your registration:</p>
                <div style="text-align: center; margin: 26px 0;">
                  <div style="display: inline-block; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #2563eb; background: #eff6ff; padding: 16px 28px; border-radius: 10px; border: 2px dashed #93c5fd; font-family: monospace;">
                    ${newCode}
                  </div>
                </div>
                <p style="font-size: 13px; color: #64748b; text-align: center;">Enter this code to activate your account. Code expires in 60 minutes.</p>
              </div>
            `
          });
          console.log(`[Auth Resend] ✓ Fresh code email successfully sent to ${user.email} (messageId: ${info.messageId})`);
          emailSent = true;
        } catch (mailErr) {
          console.error('[Auth Resend] ✕ Resend code email failed:', mailErr.message);
          emailError = mailErr.message;
        }
      }

      return sendJson(res, 200, {
        success: true,
        message: 'A fresh 4-digit verification code has been sent to your email.',
        emailSent,
        emailError: emailSent ? null : emailError
      });
    } catch (err) {
      console.error('Resend code error:', err);
      return sendJson(res, 500, { success: false, error: 'Failed to resend code.' });
    }
  }

  // POST /api/auth/login
  if (method === 'POST' && urlPath === '/api/auth/login') {
    if (!auth.checkRateLimit(clientIp, 'login', 15, 60000)) {
      return sendJson(res, 429, { success: false, error: 'Too many login attempts. Please wait 60 seconds.' });
    }

    try {
      const body = await parseJsonBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendJson(res, 400, { success: false, error: 'Please enter both your email and password.' });
      }

      let user = db.getUserByEmail(email);
      if (!user && process.env.DATABASE_URL) {
        user = await neon.getUserByEmailFromNeon(email);
        if (user) {
          const existing = db.data.users.find(u => String(u.id) === String(user.id));
          if (!existing) db.data.users.push(user);
        }
      }
      if (!user) {
        return sendJson(res, 401, { success: false, error: 'Invalid email or password.' });
      }

      const isValidPassword = await auth.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return sendJson(res, 401, { success: false, error: 'Invalid email or password.' });
      }

      // Check if user email is verified
      if (user.is_verified !== 1) {
        return sendJson(res, 403, {
          success: false,
          error: 'Please verify your email address before logging in.',
          requiresVerification: true,
          email: user.email
        });
      }

      // Promote to admin if designated email
      if (user.role !== 'admin' && auth.isDesignatedAdmin(user.email)) {
        user.role = 'admin';
        db.save();
        neon.saveUser(user).catch(() => {});
      }

      const token = auth.generateToken(user);
      const safeUser = db.getUserById(user.id);
      const usage = db.getUsageBalance(user.id);

      // Set cookie header for seamless browser requests
      res.setHeader('Set-Cookie', `easyinvite_token=${token}; Path=/; Max-Age=604800; SameSite=Lax`);

      return sendJson(res, 200, {
        success: true,
        message: 'Login successful',
        token,
        user: safeUser,
        usage: {
          planId: usage.plan_id,
          sendsRemaining: usage.is_lifetime === 1 ? 'Unlimited' : usage.sends_remaining,
          isLifetime: usage.is_lifetime === 1,
          totalPurchased: usage.total_sends_purchased,
          totalConsumed: usage.total_sends_consumed
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return sendJson(res, 500, { success: false, error: 'Login failed due to a server error.' });
    }
  }

  // POST /api/auth/logout
  if (method === 'POST' && urlPath === '/api/auth/logout') {
    res.setHeader('Set-Cookie', 'easyinvite_token=; Path=/; Max-Age=0; SameSite=Lax');
    return sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
  }

  // GET /api/auth/me
  if (method === 'GET' && urlPath === '/api/auth/me') {
    const user = await auth.authenticate(req, res);
    if (!user) return; // auth handles 401 response

    const usage = db.getUsageBalance(user.id);
    const payments = db.getUserPayments(user.id);
    const pendingPayment = payments.find(p => p.status === 'PENDING');

    return sendJson(res, 200, {
      success: true,
      user,
      usage: {
        planId: usage.plan_id,
        sendsRemaining: usage.is_lifetime === 1 ? 'Unlimited' : usage.sends_remaining,
        isLifetime: usage.is_lifetime === 1,
        totalPurchased: usage.total_sends_purchased,
        totalConsumed: usage.total_sends_consumed,
        hasPendingPayment: Boolean(pendingPayment),
        pendingPlanId: pendingPayment ? pendingPayment.plan_id : null,
        pendingPayment: pendingPayment || null
      }
    });
  }

  // --------------------------------------------------------------------------
  // USER DATA SYNC ROUTES (Multi-Device Persistence)
  // --------------------------------------------------------------------------

  // GET /api/user/sync
  if (method === 'GET' && urlPath === '/api/user/sync') {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    const usage = db.getUsageBalance(user.id);
    const payments = db.getUserPayments(user.id);
    const pendingPayment = payments.find(p => p.status === 'PENDING');
    const appConfig = db.getUserAppConfig(user.id);
    const templates = db.getUserTemplates(user.id);
    const recentCampaigns = db.getUserCampaigns(user.id, 10);

    return sendJson(res, 200, {
      success: true,
      user,
      usage: {
        planId: usage.plan_id,
        sendsRemaining: usage.is_lifetime === 1 ? 'Unlimited' : usage.sends_remaining,
        isLifetime: usage.is_lifetime === 1,
        totalPurchased: usage.total_sends_purchased,
        totalConsumed: usage.total_sends_consumed,
        hasPendingPayment: Boolean(pendingPayment),
        pendingPlanId: pendingPayment ? pendingPayment.plan_id : null,
        pendingPayment: pendingPayment || null
      },
      appConfig: {
        appName: appConfig.app_name,
        packageId: appConfig.package_id,
        testingUrl: appConfig.testing_url,
        directUrl: appConfig.direct_url,
        senderName: appConfig.sender_name,
        senderEmail: appConfig.sender_email,
        hasAppPassword: Boolean(appConfig.app_password),
        smtpOnline: appConfig.smtp_online === 1
      },
      templates,
      recentCampaigns
    });
  }

  // POST /api/user/settings
  if (method === 'POST' && urlPath === '/api/user/settings') {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    try {
      const body = await parseJsonBody(req);
      const savedConfig = db.saveUserAppConfig(user.id, body);
      return sendJson(res, 200, {
        success: true,
        message: 'Settings saved successfully',
        appConfig: {
          appName: savedConfig.app_name,
          packageId: savedConfig.package_id,
          testingUrl: savedConfig.testing_url,
          directUrl: savedConfig.direct_url,
          senderName: savedConfig.sender_name,
          senderEmail: savedConfig.sender_email,
          hasAppPassword: Boolean(savedConfig.app_password),
          smtpOnline: savedConfig.smtp_online === 1
        }
      });
    } catch (err) {
      console.error('Save settings error:', err);
      return sendJson(res, 500, { success: false, error: 'Failed to save settings.' });
    }
  }

  // POST /api/admin/change-password & POST /api/user/change-password
  if (method === 'POST' && (urlPath === '/api/admin/change-password' || urlPath === '/api/user/change-password')) {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    try {
      const body = await parseJsonBody(req);
      const { currentPassword, newPassword, confirmPassword } = body;

      if (!currentPassword) {
        return sendJson(res, 400, { success: false, error: 'Please enter your current password.' });
      }

      if (!newPassword || newPassword.length < 6) {
        return sendJson(res, 400, { success: false, error: 'New password must be at least 6 characters long.' });
      }

      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return sendJson(res, 400, { success: false, error: 'New password confirmation does not match.' });
      }

      // Retrieve full user record with password_hash
      let userAuth = db.getUserAuthById(user.id);
      if (!userAuth && process.env.DATABASE_URL) {
        userAuth = await neon.getUserByIdFromNeon(user.id);
        if (userAuth) {
          const inMem = db.data.users.find(u => String(u.id) === String(userAuth.id));
          if (!inMem) db.data.users.push(userAuth);
        }
      }

      if (!userAuth || !userAuth.password_hash) {
        return sendJson(res, 400, { success: false, error: 'User record not found.' });
      }

      const isCurrentValid = await auth.verifyPassword(currentPassword, userAuth.password_hash);
      if (!isCurrentValid) {
        return sendJson(res, 400, { success: false, error: 'Current password is incorrect.' });
      }

      // Hash the new password
      const newHash = await auth.hashPassword(newPassword);

      // Update in-memory user
      userAuth.password_hash = newHash;
      userAuth.updated_at = new Date().toISOString();
      db.save();

      // Update in Neon PostgreSQL
      if (process.env.DATABASE_URL) {
        await neon.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, user.id]);
      }

      // Issue refreshed JWT token
      const refreshedToken = auth.generateToken(userAuth);
      res.setHeader('Set-Cookie', `easyinvite_token=${refreshedToken}; Path=/; Max-Age=604800; SameSite=Lax`);

      return sendJson(res, 200, {
        success: true,
        message: 'Password changed successfully!',
        token: refreshedToken
      });
    } catch (err) {
      console.error('Change password error:', err);
      return sendJson(res, 500, { success: false, error: 'Failed to update password. Please try again.' });
    }
  }

  // GET /api/user/templates
  if (method === 'GET' && urlPath === '/api/user/templates') {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    const templates = db.getUserTemplates(user.id);
    return sendJson(res, 200, { success: true, templates });
  }

  // POST /api/user/templates
  if (method === 'POST' && urlPath === '/api/user/templates') {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    // Check plan permissions: Pro, Lifetime, or Admin required to create custom templates
    const usage = db.getUsageBalance(user.id);
    const planId = (usage && usage.plan_id) ? usage.plan_id.toLowerCase() : 'free';
    if (user.role !== 'admin' && planId !== 'pro' && planId !== 'lifetime') {
      return sendJson(res, 403, {
        success: false,
        error: 'Creating custom email templates requires a Pro (Rs 300/mo) or Lifetime (Rs 1,000) plan. Please upgrade your plan.'
      });
    }

    try {
      const body = await parseJsonBody(req);
      if (!body.name || !body.subject || !body.body) {
        return sendJson(res, 400, { success: false, error: 'Template name, subject, and body are required.' });
      }

      const saved = db.saveUserTemplate(user.id, body);
      return sendJson(res, 200, { success: true, message: 'Template saved', template: saved });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Failed to save template.' });
    }
  }

  // DELETE /api/user/templates/:id
  if (method === 'DELETE' && urlPath.startsWith('/api/user/templates/')) {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    const templateId = urlPath.substring('/api/user/templates/'.length);
    const deleted = db.deleteUserTemplate(user.id, templateId);
    return sendJson(res, 200, { success: true, deleted });
  }

  // GET /api/user/campaigns
  if (method === 'GET' && urlPath === '/api/user/campaigns') {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    const campaigns = db.getUserCampaigns(user.id, 50);
    return sendJson(res, 200, { success: true, campaigns });
  }

  // --------------------------------------------------------------------------
  // BILLING & PAYMENTS ROUTES
  // --------------------------------------------------------------------------

  // GET /api/billing/plans
  if (method === 'GET' && urlPath === '/api/billing/plans') {
    const plans = db.getPlans();
    return sendJson(res, 200, {
      success: true,
      plans,
      bankDetails: BANK_DETAILS
    });
  }

  // GET /api/billing/history
  if (method === 'GET' && urlPath === '/api/billing/history') {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    const usage = db.getUsageBalance(user.id);
    const payments = db.getUserPayments(user.id);

    return sendJson(res, 200, {
      success: true,
      usage: {
        planId: usage.plan_id,
        sendsRemaining: usage.is_lifetime === 1 ? 'Unlimited' : usage.sends_remaining,
        isLifetime: usage.is_lifetime === 1,
        totalPurchased: usage.total_sends_purchased,
        totalConsumed: usage.total_sends_consumed
      },
      payments
    });
  }

  // POST /api/billing/purchase
  if (method === 'POST' && urlPath === '/api/billing/purchase') {
    const user = await auth.authenticate(req, res);
    if (!user) return;

    try {
      const body = await parseJsonBody(req);
      const planId = body.planId || body.plan_id;
      const referenceNumber = body.referenceNumber || body.reference_number;
      const screenshotBase64 = body.screenshotBase64 || body.screenshot_base64;
      const bankName = body.bankName || body.bank_name || 'Bank Transfer';

      if (!planId) {
        return sendJson(res, 400, { success: false, error: 'Please select a valid plan.' });
      }

      const plan = db.getPlanById(planId);
      if (!plan) {
        return sendJson(res, 400, { success: false, error: 'Selected plan does not exist.' });
      }

      if (!referenceNumber || String(referenceNumber).trim().length < 4) {
        return sendJson(res, 400, { success: false, error: 'Please enter a valid bank transaction / reference number (min 4 characters).' });
      }

      if (!screenshotBase64) {
        return sendJson(res, 400, { success: false, error: 'Payment screenshot proof is required. Please upload your payment receipt or screenshot.' });
      }

      let screenshotPath = null;
      if (screenshotBase64 && typeof screenshotBase64 === 'string') {
        try {
          const uploadsDir = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const matches = screenshotBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1].includes('png') ? '.png' : matches[1].includes('webp') ? '.webp' : '.jpg';
            const filename = `screenshot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
            const diskPath = path.join(uploadsDir, filename);
            const buffer = Buffer.from(matches[2], 'base64');
            if (buffer.length <= 10 * 1024 * 1024) {
              fs.writeFileSync(diskPath, buffer);
              screenshotPath = `/uploads/${filename}`;
            }
          }
        } catch (fileErr) {
          console.warn('Screenshot upload disk notice:', fileErr.message);
        }

        // Fallback: if disk write failed or on serverless lambda, keep data URL directly
        if (!screenshotPath && screenshotBase64.startsWith('data:image/')) {
          screenshotPath = screenshotBase64;
        }
      }

      const payment = db.createPayment({
        userId: user.id,
        planId: plan.id,
        amountNpr: plan.price_npr,
        sendsToCredit: plan.sends_included,
        isLifetime: plan.is_unlimited === 1,
        referenceNumber: referenceNumber.trim(),
        bankName,
        screenshotPath
      });

      return sendJson(res, 201, {
        success: true,
        message: 'Payment details submitted successfully! Your account will be credited once verified by our team.',
        payment
      });
    } catch (err) {
      console.error('Purchase error:', err);
      return sendJson(res, 500, { success: false, error: err.message || 'Failed to submit payment.' });
    }
  }

  // --------------------------------------------------------------------------
  // ADMIN ROUTES (Protected)
  // --------------------------------------------------------------------------

  // GET /api/admin/payments
  if (method === 'GET' && urlPath === '/api/admin/payments') {
    const admin = await auth.requireAdmin(req, res);
    if (!admin) return;

    const payments = db.getAllPayments();
    const stats = db.getAdminStats();
    return sendJson(res, 200, { success: true, payments, stats });
  }

  // POST /api/admin/payments/:id/approve
  if (method === 'POST' && urlPath.startsWith('/api/admin/payments/') && urlPath.endsWith('/approve')) {
    const admin = await auth.requireAdmin(req, res);
    if (!admin) return;

    const parts = urlPath.split('/');
    const paymentId = parts[parts.length - 2];

    try {
      const updated = db.approvePayment(paymentId, admin.id);
      return sendJson(res, 200, {
        success: true,
        message: `Payment ${paymentId} approved successfully! Uses credited.`,
        payment: updated
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // POST /api/admin/payments/:id/reject
  if (method === 'POST' && urlPath.startsWith('/api/admin/payments/') && urlPath.endsWith('/reject')) {
    const admin = await auth.requireAdmin(req, res);
    if (!admin) return;

    const parts = urlPath.split('/');
    const paymentId = parts[parts.length - 2];

    try {
      const body = await parseJsonBody(req);
      const adminNotes = body.adminNotes || 'Suspected fraudulent payment / invalid payment screenshot proof';

      const payment = db.getPaymentById(paymentId);
      if (!payment) {
        return sendJson(res, 404, { success: false, error: 'Payment record not found.' });
      }

      const user = db.getUserById(payment.user_id) || db.getUserAuthById(payment.user_id);
      const userEmail = (user && user.email) || payment.user_email;
      const userName = (user && user.name) || payment.user_name || 'Customer';

      // 1. Send fraud/termination notice email to user if email is known and SMTP is configured
      if (userEmail && process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD) {
        try {
          const transporter = createGmailTransporter(process.env.SMTP_EMAIL, process.env.SMTP_APP_PASSWORD);
          console.log(`[Admin] Sending payment rejection fraud notice to ${userEmail}...`);
          await transporter.sendMail({
            from: `"EasyInvite Trust & Safety" <${process.env.SMTP_EMAIL.trim()}>`,
            to: userEmail,
            subject: `Urgent: EasyInvite Account Terminated - Fraudulent Payment Proof Detected`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border: 1px solid #fee2e2; border-radius: 12px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="display: inline-block; padding: 8px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">
                    ACCOUNT TERMINATION &amp; FRAUD NOTICE
                  </div>
                </div>
                <h2 style="color: #991b1b; margin-top: 0; font-size: 20px; text-align: center;">Payment Verification Declined</h2>
                <p style="color: #374151; font-size: 14px; line-height: 1.6;">Hello ${escapeHtml(userName)},</p>
                <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                  Your payment submission for the <strong>${escapeHtml(payment.plan_name || payment.plan_id || 'Plan')}</strong> plan (Reference: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${escapeHtml(payment.reference_number)}</code>) was rejected by our administration team.
                </p>
                <div style="margin: 20px 0; padding: 16px; background: #fff5f5; border-left: 4px solid #ef4444; border-radius: 4px;">
                  <strong style="color: #991b1b; font-size: 13px;">Reason for Rejection:</strong>
                  <p style="color: #b91c1c; margin: 6px 0 0 0; font-size: 13px; line-height: 1.5;">
                    The payment screenshot or transaction reference number provided could not be verified with our bank and was flagged as fake or fraudulent proof.
                  </p>
                  ${adminNotes ? `<p style="color: #7f1d1d; margin: 8px 0 0 0; font-size: 12px;"><em>Admin note: ${escapeHtml(adminNotes)}</em></p>` : ''}
                </div>
                <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                  Under our anti-fraud and zero-tolerance policy for fraudulent transactions, <strong>your EasyInvite user account has been immediately and permanently deleted</strong> from our system.
                </p>
                <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                  If you believe this was done in error and have an authentic bank transaction statement, you may contact support with valid official bank records.
                </p>
              </div>
            `
          });
          console.log(`[Admin] ✓ Fraud notification email successfully sent to ${userEmail}`);
        } catch (mailErr) {
          console.warn('[Admin] Rejection email dispatch notice:', mailErr.message);
        }
      }

      // 2. Mark payment as rejected in DB
      db.rejectPayment(paymentId, admin.id, adminNotes);

      // 3. Automatically delete the user account and associated data
      const targetUserId = payment.user_id;
      if (targetUserId) {
        await db.deleteUser(targetUserId);
        console.log(`[Admin] ✓ User account ${targetUserId} permanently deleted due to fraudulent payment.`);
      }

      return sendJson(res, 200, {
        success: true,
        message: `Payment rejected, fraud notification email sent, and user account was automatically deleted.`,
        deletedUserId: targetUserId
      });
    } catch (err) {
      console.error('Payment rejection error:', err);
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // GET /api/admin/stats
  if (method === 'GET' && urlPath === '/api/admin/stats') {
    const admin = await auth.requireAdmin(req, res);
    if (!admin) return;

    return sendJson(res, 200, { success: true, stats: db.getAdminStats() });
  }

  // GET /api/admin/neon-status
  if (method === 'GET' && urlPath === '/api/admin/neon-status') {
    const admin = await auth.requireAdmin(req, res);
    if (!admin) return;

    try {
      const diagnostics = await db.getNeonDiagnostics();
      return sendJson(res, 200, { success: true, diagnostics });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // --------------------------------------------------------------------------
  // SEND EMAIL ROUTE (Protected with Usage Reservation & Guest Limits)
  // --------------------------------------------------------------------------
  if (method === 'POST' && urlPath === '/api/send-email') {
    let user = null;
    let isGuest = false;
    let reservation = null;
    const guestKey = (req.headers['x-guest-id'] || clientIp).toString();

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const payload = auth.verifyToken(token);
      if (payload && payload.userId) {
        user = db.getUserAuthById(payload.userId);
      }
    }

    if (user) {
      // 1. Verify email verification status for registered user
      if (user.is_verified !== 1) {
        return sendJson(res, 403, {
          success: false,
          error: 'Please verify your email address before sending invitations.',
          requiresVerification: true
        });
      }

      // 2. Atomically check balance and reserve exactly 1 Send Action
      reservation = db.reserveSendUse(user.id);
      if (!reservation.ok) {
        return sendJson(res, 402, {
          success: false,
          code: 'NO_BALANCE',
          error: 'You have 0 Send Actions remaining. Please purchase a plan on the Billing page to send invitations.',
          remaining: 0
        });
      }
    } else {
      // Free Plan: Guest user (no account needed, up to 5 sends)
      isGuest = true;
      const guestSends = db.getGuestSends(guestKey);
      if (guestSends >= 5) {
        return sendJson(res, 402, {
          success: false,
          code: 'NO_BALANCE',
          error: 'You have used all 5 free guest sends. Please choose a plan (Starter, Growth, Pro, or Lifetime) to continue sending.',
          remaining: 0,
          isGuest: true
        });
      }
    }

    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let campaignData = {
      id: campaignId,
      subject: '',
      recipientsCount: 0,
      recipientsPreview: [],
      sentCount: 0,
      failedCount: 0
    };

    try {
      const data = await parseJsonBody(req);
      let { recipients, subject, html, senderName, senderEmail, appPassword, appName } = data;

      // Fall back to user's stored app config in DB if logged in, otherwise use request values
      const userConfig = user ? db.getUserAppConfig(user.id) : {};
      senderEmail = (senderEmail || userConfig.sender_email || process.env.SMTP_EMAIL || '').trim();
      senderName = (senderName || userConfig.sender_name || (user ? user.name : '') || process.env.SENDER_NAME || 'Developer').trim();
      appPassword = (appPassword || userConfig.app_password || process.env.SMTP_APP_PASSWORD || '').trim();

      const finalAppName = (appName || userConfig.app_name || process.env.APP_NAME || '').trim();
      const finalTestingUrl = (userConfig.testing_url || process.env.CLOSED_TESTING_URL || '').trim();
      const finalDirectUrl = (userConfig.direct_url || process.env.PLAY_STORE_URL || '').trim();
      const finalPackageId = (userConfig.package_id || process.env.APP_PACKAGE_ID || '').trim();

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        if (user && reservation) db.restoreSendUse(user.id, reservation.transactionId, campaignData, 'No recipients specified');
        return sendJson(res, 400, { success: false, error: 'At least one recipient email address is required.' });
      }

      if (!subject || !html) {
        if (user && reservation) db.restoreSendUse(user.id, reservation.transactionId, campaignData, 'Missing subject or message body');
        return sendJson(res, 400, { success: false, error: 'Both email subject and message body are required.' });
      }

      if (!senderEmail || !appPassword) {
        if (user && reservation) db.restoreSendUse(user.id, reservation.transactionId, campaignData, 'Missing SMTP credentials');
        return sendJson(res, 400, {
          success: false,
          error: 'Sender Gmail address and Google App Password are required. Configure them in Settings.'
        });
      }

      campaignData.subject = subject.trim();
      campaignData.recipientsCount = recipients.length;
      campaignData.recipientsPreview = recipients.slice(0, 5).map(r => String(r).trim());

      const transporter = createGmailTransporter(senderEmail, appPassword);
      const fromHeader = senderName ? `"${senderName}" <${senderEmail}>` : senderEmail;

      // Variable interpolation
      html = html
        .replaceAll('{{app_name}}', finalAppName).replaceAll('[App Name]', finalAppName)
        .replaceAll('{{sender_name}}', senderName).replaceAll('[Your Name]', senderName)
        .replaceAll('{{link}}', finalTestingUrl).replaceAll('[Google Play Testing Link]', finalTestingUrl)
        .replaceAll('{{testing_link}}', finalTestingUrl)
        .replaceAll('{{direct_link}}', finalDirectUrl)
        .replaceAll('{{package_id}}', finalPackageId);

      subject = subject
        .replaceAll('{{app_name}}', finalAppName).replaceAll('[App Name]', finalAppName)
        .replaceAll('{{sender_name}}', senderName).replaceAll('[Your Name]', senderName);

      const plainText = htmlToPlainText(html);
      const wrappedHtml = wrapInDeliverableEmailShell(html, subject, senderName);

      // Staggered sequential send
      const results = [];
      for (let i = 0; i < recipients.length; i++) {
        const toEmail = String(recipients[i]).trim();
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        try {
          const info = await transporter.sendMail({
            from: fromHeader,
            to: toEmail,
            replyTo: senderEmail,
            subject: subject.trim(),
            text: plainText,
            html: wrappedHtml,
            headers: {
              'X-Mailer': 'EasyInvite Google Play Outreach (v2.0)',
              'X-Auto-Response-Suppress': 'OOF, AutoReply',
              'Precedence': 'personal'
            }
          });
          results.push({ status: 'fulfilled', value: info });
        } catch (err) {
          console.error(`Failed to send to ${toEmail}:`, err.message);
          results.push({ status: 'rejected', reason: err });
        }
      }

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      campaignData.sentCount = successful.length;
      campaignData.failedCount = failed.length;

      // If all sends failed before any successful dispatch, restore the reserved use
      if (successful.length === 0 && failed.length > 0) {
        const errorMsg = failed[0].reason ? failed[0].reason.message : 'All emails failed to send.';
        if (user && reservation) {
          db.restoreSendUse(user.id, reservation.transactionId, campaignData, errorMsg);
        }
        return sendJson(res, 500, {
          success: false,
          error: errorMsg,
          failedCount: failed.length
        });
      }

      // Guest send flow
      if (isGuest) {
        const newCount = db.incrementGuestSends(guestKey);
        return sendJson(res, 200, {
          success: true,
          sentCount: successful.length,
          failedCount: failed.length,
          totalCount: recipients.length,
          isGuest: true,
          guestSendsRemaining: Math.max(0, 5 - newCount)
        });
      }

      // PERMANENTLY CONSUME 1 USE (Regardless of recipient count!)
      const updatedBalance = db.consumeSendUse(user.id, reservation.transactionId, campaignData);

      return sendJson(res, 200, {
        success: true,
        sentCount: successful.length,
        failedCount: failed.length,
        totalCount: recipients.length,
        usage: {
          sendsRemaining: updatedBalance.is_lifetime === 1 ? 'Unlimited' : updatedBalance.sends_remaining,
          isLifetime: updatedBalance.is_lifetime === 1,
          totalConsumed: updatedBalance.total_sends_consumed
        }
      });
    } catch (err) {
      console.error('Send email error:', err);
      if (user && reservation) {
        db.restoreSendUse(user.id, reservation.transactionId, campaignData, err.message);
      }
      return sendJson(res, 500, {
        success: false,
        error: err.message || 'Internal server error while sending email.'
      });
    }
  }

  // Not handled here
  return false;
}

module.exports = {
  handleApiRequest,
  BANK_DETAILS
};
