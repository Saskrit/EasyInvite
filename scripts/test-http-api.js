const assert = require('assert');

async function runHttpTests() {
  const BASE = 'http://localhost:3000';
  console.log('Testing HTTP Endpoints against ' + BASE);

  // 1. Static page aliases
  const pages = ['/', '/send-invite.html', '/billing', '/admin-payments', '/verify-email'];
  for (const page of pages) {
    const res = await fetch(BASE + page);
    assert.strictEqual(res.status, 200, `Page ${page} should return 200 OK`);
  }
  console.log('✓ All HTML pages and aliases load with 200 OK');

  // 2. /api/auth/me unauthenticated
  const meRes = await fetch(BASE + '/api/auth/me');
  assert.strictEqual(meRes.status, 401);
  const meUnauth = await meRes.json();
  assert.strictEqual(meUnauth.success, false);
  console.log('✓ Unauthenticated /api/auth/me returns 401 Unauthorized');

  // 3. Register a user
  const email = `webuser_${Date.now()}@test.com`;
  const regRes = await fetch(BASE + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Web User', email, password: 'SecurePassword123' })
  });
  assert.strictEqual(regRes.status, 201);
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true);
  assert.strictEqual(regData.requiresVerification, true);
  const verificationToken = regData.devVerificationToken;
  assert.ok(verificationToken);
  console.log('✓ Registration successful, email verification required, token generated');

  // 4. Verify email
  const verifyRes = await fetch(BASE + '/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: verificationToken })
  });
  assert.strictEqual(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyData.success, true);
  console.log('✓ Email verification successful');

  // 5. Login
  const loginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'SecurePassword123' })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  const userToken = loginData.token;
  assert.strictEqual(loginData.usage.sendsRemaining, 0);
  console.log('✓ Login successful, initial balance = 0 Send actions');

  // 6. Billing plans
  const plansRes = await fetch(BASE + '/api/billing/plans');
  assert.strictEqual(plansRes.status, 200);
  const plansData = await plansRes.json();
  const plans = plansData.plans || [];
  assert.strictEqual(plans.length, 4);
  console.log('✓ Billing plans retrieved: ' + plans.map(p => `${p.name} (NPR ${p.price_npr})`).join(', '));

  // 7. Normal user cannot access admin API
  const adminForbiddenRes = await fetch(BASE + '/api/admin/payments', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(adminForbiddenRes.status, 403);
  console.log('✓ Normal user forbidden from Admin API (403)');

  // 8. Purchase plan (Starter: NPR 100 for 10 uses)
  const purchaseRes = await fetch(BASE + '/api/billing/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      plan_id: 'starter',
      bank_name: 'Nabil Bank',
      sender_account_name: 'Web User',
      sender_account_number: '01234567890123',
      reference_number: 'NBL' + Date.now(),
      notes: 'Initial test starter purchase'
    })
  });
  assert.strictEqual(purchaseRes.status, 201);
  const purchaseData = await purchaseRes.json();
  const paymentId = purchaseData.payment.id;
  assert.strictEqual(purchaseData.payment.status, 'PENDING');
  console.log('✓ Submitted manual bank transfer payment: ' + paymentId);

  // 9. Admin login
  const adminLoginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@easyinvite.com', password: 'Admin@12345' })
  });
  assert.strictEqual(adminLoginRes.status, 200);
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;
  assert.strictEqual(adminData.user.role, 'admin');
  console.log('✓ Admin login successful');

  // 10. Admin view pending payments
  const adminPaymentsRes = await fetch(BASE + '/api/admin/payments?status=PENDING', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminPaymentsRes.status, 200);
  const adminPaymentsData = await adminPaymentsRes.json();
  const pendingPayments = adminPaymentsData.payments || [];
  assert.ok(pendingPayments.some(p => p.id === paymentId));
  console.log('✓ Admin sees pending payment');

  // 11. Admin approves payment
  const approveRes = await fetch(`${BASE}/api/admin/payments/${paymentId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(approveRes.status, 200);
  console.log('✓ Admin approved payment');

  // 12. Check user balance after approval
  const userMeRes = await fetch(BASE + '/api/auth/me', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(userMeRes.status, 200);
  const userMe = await userMeRes.json();
  assert.strictEqual(userMe.usage.sendsRemaining, 10);
  console.log('✓ User balance correctly credited with 10 Send actions (Starter plan)');

  // 13. Idempotent check: approving again must fail
  const duplicateApprove = await fetch(`${BASE}/api/admin/payments/${paymentId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(duplicateApprove.status, 400);
  console.log('✓ Server-side protection against duplicate approval verified');

  console.log('\n========================================');
  console.log('🎉 ALL HTTP API TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runHttpTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
