const fs = require('fs');
const path = require('path');
const db = require('./db');
const auth = require('./auth');
const {
  parseJsonBody,
  createGmailTransporter,
  htmlToPlainText,
  wrapInDeliverableEmailShell,
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
async function handleApiRequest(req, res, urlPath) {
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
      const { name, email, password } = body;

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

      const cleanEmail = email.trim().toLowerCase();
      const existing = db.getUserByEmail(cleanEmail);
      if (existing) {
        return sendJson(res, 400, { success: false, error: 'An account with this email address already exists.' });
      }

      const passwordHash = await auth.hashPassword(password);
      const verificationToken = auth.generateVerificationToken();
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const role = auth.isDesignatedAdmin(cleanEmail) ? 'admin' : 'user';

      const newUser = db.createUser({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role,
        isVerified: 0,
        verificationToken,
        verificationTokenExpires: tokenExpires
      });

      // Try sending verification email if SMTP configured
      let emailSent = false;
      const systemSmtp = process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD;
      if (systemSmtp) {
        try {
          const transporter = createGmailTransporter(process.env.SMTP_EMAIL, process.env.SMTP_APP_PASSWORD);
          const verifyUrl = `${req.headers.origin || 'http://localhost:' + (process.env.PORT || 3000)}/verify-email?token=${verificationToken}`;
          await transporter.sendMail({
            from: `"EasyInvite" <${process.env.SMTP_EMAIL}>`,
            to: cleanEmail,
            subject: 'Verify your EasyInvite account',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #2563eb;">Welcome to EasyInvite, ${newUser.name}!</h2>
                <p>Thank you for creating an account. Please click the button below to verify your email address and activate your account:</p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email Address</a>
                </div>
                <p style="font-size: 13px; color: #64748b;">Or paste this link into your browser:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This link will expire in 24 hours.</p>
              </div>
            `
          });
          emailSent = true;
        } catch (mailErr) {
          console.warn('[Auth] Verification email dispatch notice:', mailErr.message);
        }
      }

      return sendJson(res, 201, {
        success: true,
        message: 'Account created! Please verify your email to log in.',
        requiresVerification: true,
        emailSent,
        // Provided for developer/local convenience if outbound SMTP is not connected
        devVerificationToken: verificationToken,
        devVerifyUrl: `/verify-email?token=${verificationToken}`
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
      const { token } = body;
      if (!token) {
        return sendJson(res, 400, { success: false, error: 'Verification token is required.' });
      }

      const verifiedUser = db.verifyUserEmail(token);
      if (!verifiedUser) {
        return sendJson(res, 400, { success: false, error: 'Invalid or already used verification token.' });
      }

      if (verifiedUser.expired) {
        return sendJson(res, 400, { success: false, error: 'Verification link has expired. Please request a new one.' });
      }

      const jwtToken = auth.generateToken(verifiedUser);
      return sendJson(res, 200, {
        success: true,
        message: 'Email verified successfully! You are now logged in.',
        token: jwtToken,
        user: verifiedUser
      });
    } catch (err) {
      console.error('Verify email error:', err);
      return sendJson(res, 500, { success: false, error: 'Error verifying email.' });
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

      const user = db.getUserByEmail(email);
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
          email: user.email,
          devVerificationToken: user.verification_token
        });
      }

      // Promote to admin if designated email
      if (user.role !== 'admin' && auth.isDesignatedAdmin(user.email)) {
        user.role = 'admin';
        db.save();
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
    const user = auth.authenticate(req, res);
    if (!user) return; // auth handles 401 response

    const usage = db.getUsageBalance(user.id);
    return sendJson(res, 200, {
      success: true,
      user,
      usage: {
        planId: usage.plan_id,
        sendsRemaining: usage.is_lifetime === 1 ? 'Unlimited' : usage.sends_remaining,
        isLifetime: usage.is_lifetime === 1,
        totalPurchased: usage.total_sends_purchased,
        totalConsumed: usage.total_sends_consumed
      }
    });
  }

  // --------------------------------------------------------------------------
  // USER DATA SYNC ROUTES (Multi-Device Persistence)
  // --------------------------------------------------------------------------

  // GET /api/user/sync
  if (method === 'GET' && urlPath === '/api/user/sync') {
    const user = auth.authenticate(req, res);
    if (!user) return;

    const usage = db.getUsageBalance(user.id);
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
        totalConsumed: usage.total_sends_consumed
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
    const user = auth.authenticate(req, res);
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

  // GET /api/user/templates
  if (method === 'GET' && urlPath === '/api/user/templates') {
    const user = auth.authenticate(req, res);
    if (!user) return;

    const templates = db.getUserTemplates(user.id);
    return sendJson(res, 200, { success: true, templates });
  }

  // POST /api/user/templates
  if (method === 'POST' && urlPath === '/api/user/templates') {
    const user = auth.authenticate(req, res);
    if (!user) return;

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
    const user = auth.authenticate(req, res);
    if (!user) return;

    const templateId = urlPath.substring('/api/user/templates/'.length);
    const deleted = db.deleteUserTemplate(user.id, templateId);
    return sendJson(res, 200, { success: true, deleted });
  }

  // GET /api/user/campaigns
  if (method === 'GET' && urlPath === '/api/user/campaigns') {
    const user = auth.authenticate(req, res);
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
    const user = auth.authenticate(req, res);
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
    const user = auth.authenticate(req, res);
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

      let screenshotPath = null;
      if (screenshotBase64 && typeof screenshotBase64 === 'string') {
        try {
          const matches = screenshotBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1].includes('png') ? '.png' : matches[1].includes('webp') ? '.webp' : '.jpg';
            const filename = `screenshot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
            const diskPath = path.join(__dirname, '..', 'uploads', filename);
            const buffer = Buffer.from(matches[2], 'base64');
            if (buffer.length <= 5 * 1024 * 1024) {
              fs.writeFileSync(diskPath, buffer);
              screenshotPath = `/uploads/${filename}`;
            }
          }
        } catch (fileErr) {
          console.warn('Screenshot upload notice:', fileErr.message);
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
    const admin = auth.requireAdmin(req, res);
    if (!admin) return;

    const payments = db.getAllPayments();
    const stats = db.getAdminStats();
    return sendJson(res, 200, { success: true, payments, stats });
  }

  // POST /api/admin/payments/:id/approve
  if (method === 'POST' && urlPath.startsWith('/api/admin/payments/') && urlPath.endsWith('/approve')) {
    const admin = auth.requireAdmin(req, res);
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
    const admin = auth.requireAdmin(req, res);
    if (!admin) return;

    const parts = urlPath.split('/');
    const paymentId = parts[parts.length - 2];

    try {
      const body = await parseJsonBody(req);
      const updated = db.rejectPayment(paymentId, admin.id, body.adminNotes || 'Payment rejected by administrator');
      return sendJson(res, 200, {
        success: true,
        message: `Payment ${paymentId} marked as rejected.`,
        payment: updated
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // GET /api/admin/stats
  if (method === 'GET' && urlPath === '/api/admin/stats') {
    const admin = auth.requireAdmin(req, res);
    if (!admin) return;

    return sendJson(res, 200, { success: true, stats: db.getAdminStats() });
  }

  // GET /api/admin/neon-status
  if (method === 'GET' && urlPath === '/api/admin/neon-status') {
    const admin = auth.requireAdmin(req, res);
    if (!admin) return;

    try {
      const diagnostics = await db.getNeonDiagnostics();
      return sendJson(res, 200, { success: true, diagnostics });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // --------------------------------------------------------------------------
  // SEND EMAIL ROUTE (Protected with Usage Reservation & Deduction)
  // --------------------------------------------------------------------------
  if (method === 'POST' && urlPath === '/api/send-email') {
    // 1. Authenticate user
    const user = auth.authenticate(req, res);
    if (!user) return; // 401 sent by authenticate()

    // 2. Verify email verification status
    if (user.is_verified !== 1) {
      return sendJson(res, 403, {
        success: false,
        error: 'Please verify your email address before sending invitations.',
        requiresVerification: true
      });
    }

    // 3. Atomically check balance and reserve exactly 1 Send Action
    const reservation = db.reserveSendUse(user.id);
    if (!reservation.ok) {
      return sendJson(res, 402, {
        success: false,
        code: 'NO_BALANCE',
        error: 'You have 0 Send Actions remaining. Please purchase a plan on the Billing page to send invitations.',
        remaining: 0
      });
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

      // Fall back to user's stored app config in DB if not in request
      const userConfig = db.getUserAppConfig(user.id);
      senderEmail = (senderEmail || userConfig.sender_email || process.env.SMTP_EMAIL || '').trim();
      senderName = (senderName || userConfig.sender_name || user.name || process.env.SENDER_NAME || 'Developer').trim();
      appPassword = (appPassword || userConfig.app_password || process.env.SMTP_APP_PASSWORD || '').trim();

      const finalAppName = (appName || userConfig.app_name || process.env.APP_NAME || '').trim();
      const finalTestingUrl = (userConfig.testing_url || process.env.CLOSED_TESTING_URL || '').trim();
      const finalDirectUrl = (userConfig.direct_url || process.env.PLAY_STORE_URL || '').trim();
      const finalPackageId = (userConfig.package_id || process.env.APP_PACKAGE_ID || '').trim();

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        db.restoreSendUse(user.id, reservation.transactionId, campaignData, 'No recipients specified');
        return sendJson(res, 400, { success: false, error: 'At least one recipient email address is required.' });
      }

      if (!subject || !html) {
        db.restoreSendUse(user.id, reservation.transactionId, campaignData, 'Missing subject or message body');
        return sendJson(res, 400, { success: false, error: 'Both email subject and message body are required.' });
      }

      if (!senderEmail || !appPassword) {
        db.restoreSendUse(user.id, reservation.transactionId, campaignData, 'Missing SMTP credentials');
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
        db.restoreSendUse(user.id, reservation.transactionId, campaignData, errorMsg);
        return sendJson(res, 500, {
          success: false,
          error: errorMsg,
          failedCount: failed.length
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
      db.restoreSendUse(user.id, reservation.transactionId, campaignData, err.message);
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
