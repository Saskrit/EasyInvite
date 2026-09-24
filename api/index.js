const configHandler = require('./config');
const verifyHandler = require('./verify-smtp');
const sendEmailHandler = require('./send-email');
const healthHandler = require('./health');
const { setCorsAndSecurityHeaders } = require('../lib/mailer');
const { handleApiRequest } = require('../lib/routes');
const db = require('../lib/db');

let initPromise = null;
function ensureDbInit() {
  if (!initPromise) {
    initPromise = db.initPostgres().catch(err => {
      console.warn('[Vercel API] initPostgres error:', err.message);
    });
  }
  return initPromise;
}

module.exports = async (req, res) => {
  setCorsAndSecurityHeaders(res, req.headers.origin);

  // Initialize and synchronize Neon database on serverless cold starts
  if (process.env.DATABASE_URL) {
    await ensureDbInit();
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Ensure normalized /api path
  const rawPath = (req.url || '').split('?')[0];
  const apiPath = rawPath.startsWith('/api') ? rawPath : `/api${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;

  // Try centralized router (handles /api/auth/*, /api/billing/*, /api/admin/*, /api/user/*, /api/send-email)
  const handled = await handleApiRequest(req, res, apiPath);
  if (handled !== false) {
    return;
  }

  // Legacy route fallbacks
  const urlPath = apiPath.replace(/^\/api/, '');
  if (urlPath === '/config' || urlPath === 'config') {
    return configHandler(req, res);
  }
  if (urlPath === '/verify-smtp' || urlPath === 'verify-smtp') {
    return verifyHandler(req, res);
  }
  if (urlPath === '/send-email' || urlPath === 'send-email') {
    return sendEmailHandler(req, res);
  }
  if (urlPath === '/health' || urlPath === 'health' || urlPath === '' || urlPath === '/') {
    return healthHandler(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ success: false, error: `Route not found: ${req.url}` }));
};
