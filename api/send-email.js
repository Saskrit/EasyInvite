const { setCorsAndSecurityHeaders } = require('../lib/mailer');
const { handleApiRequest } = require('../lib/routes');

module.exports = async (req, res) => {
  setCorsAndSecurityHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const handled = await handleApiRequest(req, res, '/api/send-email');
  if (handled !== false) {
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
};
