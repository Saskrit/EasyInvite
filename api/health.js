const { setCorsAndSecurityHeaders } = require('../lib/mailer');

module.exports = (req, res) => {
  setCorsAndSecurityHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({
    status: 'ok',
    platform: 'vercel-serverless',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }));
};
