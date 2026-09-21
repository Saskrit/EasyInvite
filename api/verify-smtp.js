const { parseJsonBody, createGmailTransporter, setCorsAndSecurityHeaders } = require('../lib/mailer');

module.exports = async (req, res) => {
  setCorsAndSecurityHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  }

  try {
    const data = await parseJsonBody(req);
    let { senderEmail, appPassword } = data;

    senderEmail = (senderEmail || process.env.SMTP_EMAIL || '').trim();
    appPassword = (appPassword || process.env.SMTP_APP_PASSWORD || '').trim();

    if (!senderEmail || !appPassword) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error: 'Please provide both your Gmail address and Google App Password (or configure them in Settings / Environment Variables).'
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
};
