const dns = require('dns');
const nodemailer = require('nodemailer');

// Force IPv4 first to prevent ENETUNREACH errors in cloud/serverless environments
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Safely parse JSON body from either standard Node request stream
 * or pre-parsed Vercel Serverless Function request object.
 */
function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (e) {
      return Promise.resolve({});
    }
  }
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

/**
 * Create a Nodemailer transporter configured for Gmail SMTP (port 465, IPv4).
 */
function createGmailTransporter(user, pass) {
  const cleanPassword = String(pass).replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4, // Force IPv4 to prevent ENETUNREACH in serverless/cloud environments
    auth: {
      user: user.trim(),
      pass: cleanPassword
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });
}

/**
 * Convert HTML to clean plain text for multipart MIME deliverability.
 */
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

/**
 * XML/HTML entity escaping helper.
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Standards-compliant deliverable email shell with responsive container and opt-out footer.
 */
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

/**
 * Apply common security and CORS headers.
 */
function setCorsAndSecurityHeaders(res, origin = '') {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = {
  parseJsonBody,
  createGmailTransporter,
  htmlToPlainText,
  wrapInDeliverableEmailShell,
  escapeXml,
  setCorsAndSecurityHeaders
};
