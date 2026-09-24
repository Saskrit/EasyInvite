const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const nodemailer = require('nodemailer');

try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional, fallback parser below
}

// Fallback native .env parser for zero-dependency portability
(function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      });
    } catch (err) {
      console.warn('Could not read .env file:', err.message);
    }
  }
})();

// Force IPv4 first to prevent ENETUNREACH errors on networks where IPv6 is not routed
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function createGmailTransporter(user, pass) {
  const cleanPassword = String(pass).replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4, // Force IPv4
    auth: {
      user: user.trim(),
      pass: cleanPassword
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });
}

const db = require('./lib/db');
const auth = require('./lib/auth');
const { handleApiRequest } = require('./lib/routes');

// Connect and synchronize with Neon PostgreSQL
if (process.env.DATABASE_URL) {
  db.initPostgres().then(ok => {
    if (ok) console.log('✓ EasyInvite synchronized with live Neon PostgreSQL database');
  }).catch(err => {
    console.warn('[Neon Sync Notice]', err.message);
  });
}

const server = http.createServer(async (req, res) => {
  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data: blob:;");

  // CORS — restrict to same origin in production; allow localhost for dev
  const origin = req.headers.origin || '';
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const urlPath = req.url.split('?')[0];

  // Delegate API requests to centralized API router
  if (urlPath.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res, urlPath);
    if (handled !== false) {
      return;
    }
  }

  // API: Health Check (for Docker, Render, Railway, Kubernetes, etc.)
  if (req.method === 'GET' && (urlPath === '/health' || urlPath === '/api/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString() 
    }));
  }

  // API: Get Configuration (from .env)
  if (req.method === 'GET' && urlPath === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      hasEnvPassword: Boolean(process.env.SMTP_APP_PASSWORD),
      senderEmail: process.env.SMTP_EMAIL || '',
      senderName: process.env.SENDER_NAME || '',
      appName: process.env.APP_NAME || '',
      packageId: process.env.APP_PACKAGE_ID || '',
      testingUrl: process.env.CLOSED_TESTING_URL || '',
      directUrl: process.env.PLAY_STORE_URL || '',
      appPassword: process.env.SMTP_APP_PASSWORD || ''
    }));
  }

  // API: Verify SMTP Credentials
  if (req.method === 'POST' && urlPath === '/api/verify-smtp') {
    try {
      const data = await parseJsonBody(req);
      let { senderEmail, appPassword } = data;

      senderEmail = (senderEmail || process.env.SMTP_EMAIL || '').trim();
      appPassword = (appPassword || process.env.SMTP_APP_PASSWORD || '').trim();

      if (!senderEmail || !appPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          success: false, 
          error: 'Please provide both your Gmail address and Google App Password (or configure them in .env).' 
        }));
      }

      const transporter = createGmailTransporter(senderEmail, appPassword);

      await transporter.verify();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: true, 
        message: `Connection to Gmail SMTP successful for ${senderEmail.trim()}!` 
      }));
    } catch (err) {
      console.error('SMTP verification error:', err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: err.message || 'Gmail SMTP verification failed. Check email and 16-character App Password.' 
      }));
    }
  }

function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Format anchor links cleanly as "Text (URL)"
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (match, url, text) => {
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      return (!cleanText || cleanText === url) ? url : `${cleanText}: ${url}`;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '') // strip remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapInDeliverableEmailShell(bodyHtml, subject, senderName) {
  if (bodyHtml.includes('<html') || bodyHtml.includes('<!DOCTYPE')) {
    return bodyHtml;
  }

  const senderDisplay = senderName ? String(senderName).trim() : 'the developer';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeXml(subject || 'Testing Invitation')}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a, p, span { font-family: Arial, Helvetica, sans-serif !important; }
    .btn-cta a { padding: 14px 32px !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, html { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; box-sizing: border-box; }
    table { border-collapse: collapse !important; mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { border: 0 !important; height: auto !important; line-height: 100% !important; outline: none !important; text-decoration: none !important; -ms-interpolation-mode: bicubic; }
    /* Links */
    a { color: #2563eb; text-decoration: underline; }
    a:hover { color: #1d4ed8; }
    /* Typography */
    p { margin: 0 0 16px 0 !important; line-height: 1.65 !important; }
    ol, ul { margin: 8px 0 16px 0 !important; padding-left: 20px !important; line-height: 1.7 !important; }
    li { margin-bottom: 6px !important; }
    strong { font-weight: 700 !important; }
    /* CTA Button */
    .btn-cta a {
      background-color: #2563eb !important;
      border: 2px solid #2563eb !important;
      border-radius: 8px !important;
      color: #ffffff !important;
      display: inline-block !important;
      font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
      font-size: 15px !important;
      font-weight: 700 !important;
      letter-spacing: 0.4px !important;
      line-height: 1 !important;
      padding: 14px 32px !important;
      text-decoration: none !important;
      text-transform: uppercase !important;
    }
    .btn-cta a:hover {
      background-color: #1d4ed8 !important;
      border-color: #1d4ed8 !important;
    }
    /* Green CTA Button — Play Store */
    .btn-cta-green a {
      background-color: #16a34a !important;
      border: 2px solid #16a34a !important;
      border-radius: 8px !important;
      color: #ffffff !important;
      display: inline-block !important;
      font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
      font-size: 15px !important;
      font-weight: 700 !important;
      letter-spacing: 0.4px !important;
      line-height: 1 !important;
      padding: 14px 32px !important;
      text-decoration: none !important;
      text-transform: uppercase !important;
    }
    .btn-cta-green a:hover {
      background-color: #15803d !important;
      border-color: #15803d !important;
    }
    /* Editor link styling */
    .editor-link {
      color: #2563eb !important;
      word-break: break-all !important;
    }
    /* Divider */
    .divider { border: none !important; border-top: 1px solid #e2e8f0 !important; margin: 24px 0 !important; }
    /* Mobile */
    @media only screen and (max-width: 600px) {
      .email-outer { padding: 12px 6px !important; }
      .email-card { border-radius: 0 !important; }
      .email-body { padding: 24px 20px 20px 20px !important; }
      .email-footer { padding: 16px 20px !important; }
      .btn-cta a { display: block !important; text-align: center !important; padding: 14px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-outer" style="background-color: #f1f5f9; padding: 36px 16px;">
    <tr>
      <td align="center">

        <!-- Email card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08), 0 1px 4px rgba(15, 23, 42, 0.04);">

          <!-- Header accent bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%); padding: 0; height: 5px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Email body -->
          <tr>
            <td class="email-body" style="padding: 36px 40px 28px 40px; font-size: 15px; line-height: 1.65; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0 !important; font-size: 12px; color: #64748b; line-height: 1.55; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                You received this invitation from <strong style="color: #475569;">${escapeXml(senderDisplay)}</strong> to participate in official closed testing on Google Play. You were invited using your Google account.
              </p>
              <p style="margin: 0 !important; font-size: 11px; color: #94a3b8; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                If you did not expect this invitation, you can safely ignore this email. You will not be enrolled unless you click the join link and follow the steps.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email card -->

        <!-- Sub-footer -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 16px 8px 8px 8px; text-align: center; font-size: 11px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              Sent via <a href="https://github.com" style="color: #94a3b8; text-decoration: none;">EasyInvite</a> &middot; Google Play Closed Testing Outreach
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

  // API: Send Emails
  if (req.method === 'POST' && urlPath === '/api/send-email') {
    try {
      const data = await parseJsonBody(req);
      let { recipients, subject, html, senderName, senderEmail, appPassword } = data;

      senderEmail = (senderEmail || process.env.SMTP_EMAIL || '').trim();
      senderName = (senderName || process.env.SENDER_NAME || 'Developer').trim();
      appPassword = (appPassword || process.env.SMTP_APP_PASSWORD || '').trim();

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'At least one recipient email address is required.' }));
      }

      if (!subject || !html) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Both email subject and message body are required.' }));
      }

      if (!senderEmail || !appPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          success: false, 
          error: 'Sender Gmail address and Google App Password are required. Configure them in .env or Settings.' 
        }));
      }

      const transporter = createGmailTransporter(senderEmail, appPassword);

      const fromHeader = senderName 
        ? `"${senderName.trim()}" <${senderEmail.trim()}>` 
        : senderEmail.trim();

      // Fallback placeholder resolution using environment variables
      const envAppName = process.env.APP_NAME || '';
      const envTestingUrl = process.env.CLOSED_TESTING_URL || '';
      const envPlayStoreUrl = process.env.PLAY_STORE_URL || '';
      const envPackageId = process.env.APP_PACKAGE_ID || '';

      html = html
        .replaceAll('{{app_name}}', envAppName).replaceAll('[App Name]', envAppName)
        .replaceAll('{{sender_name}}', senderName).replaceAll('[Your Name]', senderName)
        .replaceAll('{{link}}', envTestingUrl).replaceAll('[Google Play Testing Link]', envTestingUrl)
        .replaceAll('{{testing_link}}', envTestingUrl)
        .replaceAll('{{direct_link}}', envPlayStoreUrl)
        .replaceAll('{{package_id}}', envPackageId);

      subject = subject
        .replaceAll('{{app_name}}', envAppName).replaceAll('[App Name]', envAppName)
        .replaceAll('{{sender_name}}', senderName).replaceAll('[Your Name]', senderName);

      // Anti-Spam Architecture:
      // 1. Synchronous Plain-Text alternative eliminates MIME_HTML_ONLY spam penalty
      const plainText = htmlToPlainText(html);
      // 2. Wrap HTML in clean standards-compliant container with opt-out footer
      const wrappedHtml = wrapInDeliverableEmailShell(html, subject, senderName);

      // 3. Staggered sequential send (350ms pause) prevents Gmail SMTP burst-rate heuristics
      const results = [];
      for (let i = 0; i < recipients.length; i++) {
        const toEmail = recipients[i].trim();
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 350));
        }

        try {
          const info = await transporter.sendMail({
            from: fromHeader,
            to: toEmail,
            replyTo: senderEmail.trim(),
            subject: subject.trim(),
            text: plainText,
            html: wrappedHtml,
            headers: {
              'X-Mailer': 'EasyInvite Google Play Outreach (v1.2)',
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

      if (successful.length === 0 && failed.length > 0) {
        const errorMsg = failed[0].reason ? failed[0].reason.message : 'Failed to send emails via Gmail.';
        console.error('All email sends failed:', failed);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          success: false, 
          error: errorMsg,
          failedCount: failed.length 
        }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        sentCount: successful.length,
        failedCount: failed.length,
        totalCount: recipients.length
      }));
    } catch (err) {
      console.error('Send email error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: err.message || 'Internal server error while sending email.' 
      }));
    }
  }

  // Static File Serving — with clean route aliases and path traversal protection
  let requestedPath = urlPath;
  if (requestedPath === '/' || requestedPath === '/send-invite' || requestedPath === '/send-invitation') {
    requestedPath = 'index.html';
  } else if (requestedPath === '/templates' || requestedPath === '/email-templates') {
    requestedPath = 'templates.html';
  } else if (requestedPath === '/settings' || requestedPath === '/admin-settings' || requestedPath === '/admin/settings') {
    requestedPath = 'settings.html';
  } else if (requestedPath === '/billing' || requestedPath === '/pricing') {
    requestedPath = 'billing.html';
  } else if (requestedPath === '/admin' || requestedPath === '/admin/payments' || requestedPath === '/admin-payments') {
    requestedPath = 'admin-payments.html';
  } else if (requestedPath === '/verify-email') {
    requestedPath = 'verify-email.html';
  } else if (requestedPath === '/login' || requestedPath === '/signin' || requestedPath === '/register' || requestedPath === '/signup') {
    requestedPath = 'login.html';
  }

  // Strip any ../ traversal attempts
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  // Ensure the resolved path stays inside the project root
  if (!filePath.startsWith(__dirname + path.sep) && filePath !== __dirname) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    } else {
      const isDynamicAsset = ['.html', '.js', '.css'].includes(extname);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': isDynamicAsset ? 'no-cache, no-store, must-revalidate, max-age=0' : 'public, max-age=86400'
      });
      res.end(content);
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`EasyInvite server running at http://localhost:${PORT} (port ${PORT})`);
  });

  // Graceful shutdown handling for container and cloud environments
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

module.exports = server;
