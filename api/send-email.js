const {
  parseJsonBody,
  createGmailTransporter,
  htmlToPlainText,
  wrapInDeliverableEmailShell,
  setCorsAndSecurityHeaders
} = require('../lib/mailer');

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
        error: 'Sender Gmail address and Google App Password are required. Configure them in Settings or Environment Variables.'
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

    // Deliverability Engine:
    // 1. Plain-text alternative
    const plainText = htmlToPlainText(html);
    // 2. Standards-compliant responsive HTML shell
    const wrappedHtml = wrapInDeliverableEmailShell(html, subject, senderName);

    // 3. Staggered sequential send (300ms pause)
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      const toEmail = recipients[i].trim();
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
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
};
