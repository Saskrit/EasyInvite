const { setCorsAndSecurityHeaders } = require('../lib/mailer');

module.exports = async (req, res) => {
  setCorsAndSecurityHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  });

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
};
