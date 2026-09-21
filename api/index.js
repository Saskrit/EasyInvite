const configHandler = require('./config');
const verifyHandler = require('./verify-smtp');
const sendEmailHandler = require('./send-email');
const healthHandler = require('./health');
const { setCorsAndSecurityHeaders } = require('../lib/mailer');

module.exports = async (req, res) => {
  setCorsAndSecurityHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const urlPath = (req.url || '').split('?')[0].replace(/^\/api/, '');

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
  return res.end(JSON.stringify({ success: false, error: `Route not found: /api${urlPath}` }));
};
