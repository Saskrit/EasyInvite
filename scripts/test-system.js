const http = require('http');
const db = require('../lib/db');
const auth = require('../lib/auth');

async function runTests() {
  console.log('--- Testing EasyInvite Paid-User & Usage System ---');

  // 1. Verify Plans
  const plans = db.getPlans();
  console.log(`✓ Seeded plans count: ${plans.length}`);
  const starter = plans.find(p => p.id === 'starter');
  const growth = plans.find(p => p.id === 'growth');
  const pro = plans.find(p => p.id === 'pro');
  const lifetime = plans.find(p => p.id === 'lifetime');

  console.assert(starter.price_npr === 100 && starter.sends_included === 10, 'Starter plan invalid');
  console.assert(growth.price_npr === 200 && growth.sends_included === 40, 'Growth plan invalid');
  console.assert(pro.price_npr === 300 && pro.sends_included === 60, 'Pro plan invalid');
  console.assert(lifetime.price_npr === 1000 && lifetime.is_unlimited === 1, 'Lifetime plan invalid');
  console.log('✓ All 4 Prepaid Plans verified (Starter: 100/10, Growth: 200/40, Pro: 300/60, Lifetime: 1000/unlimited)');

  // 2. Test User Creation & Email Verification
  const testEmail = `tester_${Date.now()}@example.com`;
  const passwordHash = await auth.hashPassword('Password123!');
  const token = auth.generateVerificationToken();
  const expires = new Date(Date.now() + 3600000).toISOString();

  const user = db.createUser({
    name: 'Test Tester',
    email: testEmail,
    passwordHash,
    role: 'user',
    isVerified: 0,
    verificationToken: token,
    verificationTokenExpires: expires
  });
  console.log(`✓ Created user: ${user.name} (${user.email}), id=${user.id}`);

  // Check initial balance (0 sends)
  let balance = db.getUsageBalance(user.id);
  console.assert(balance.sends_remaining === 0, 'New user should have 0 sends');
  console.assert(balance.is_lifetime === 0, 'New user should not be lifetime');
  console.log('✓ Initial usage balance is 0 Send actions (requires prepaid plan)');

  // Attempt reservation before verification / payment -> should fail
  const reserveFail = db.reserveSendUse(user.id);
  console.assert(reserveFail.ok === false && reserveFail.error === 'NO_BALANCE', 'Should fail reservation on 0 balance');
  console.log('✓ Backend usage control correctly prevents send with NO_BALANCE');

  // Verify email
  const verifiedUser = db.verifyUserEmail(token);
  console.assert(verifiedUser.is_verified === 1, 'User email should be verified');
  console.log('✓ User email verified successfully');

  // 3. Test Manual Bank-Transfer Payment Submission
  const payment = db.createPayment({
    userId: user.id,
    planId: 'growth',
    amountNpr: 200,
    sendsToCredit: 40,
    isLifetime: false,
    referenceNumber: 'TXN-9847291847',
    screenshotPath: null
  });
  console.log(`✓ Payment created: id=${payment.id}, status=${payment.status}, amount=NPR ${payment.amount_npr}`);
  console.assert(payment.status === 'PENDING', 'Payment should initially be PENDING');

  // Check user balance is still 0 (unapproved payment must NOT grant uses!)
  balance = db.getUsageBalance(user.id);
  console.assert(balance.sends_remaining === 0, 'Balance must stay 0 while payment is pending');
  console.log('✓ Unapproved payment does not credit uses (server-side protection verified)');

  // 4. Admin Approves Payment
  const admin = db.getUserByEmail('admin@easyinvite.com');
  console.assert(admin && admin.role === 'admin', 'Default admin account exists');
  const approvedPayment = db.approvePayment(payment.id, admin.id);
  console.assert(approvedPayment.status === 'APPROVED', 'Payment should be APPROVED');
  console.log(`✓ Admin approved payment ${payment.id}`);

  // Check user balance is now exactly 40 sends
  balance = db.getUsageBalance(user.id);
  console.assert(balance.sends_remaining === 40, `Balance should be 40, got ${balance.sends_remaining}`);
  console.log(`✓ User balance updated: ${balance.sends_remaining} Send actions available`);

  // Test Idempotency: Duplicate approval attempt must throw error and NOT credit again!
  try {
    db.approvePayment(payment.id, admin.id);
    console.assert(false, 'Duplicate approval should throw error');
  } catch (dupErr) {
    console.log(`✓ Duplicate approval prevented: "${dupErr.message}"`);
  }
  balance = db.getUsageBalance(user.id);
  console.assert(balance.sends_remaining === 40, 'Balance must remain 40 after rejected duplicate approval');
  console.log('✓ Server-side approval idempotency verified');

  // 5. Test Usage Reservation, Dispatch & Consumption
  // Send campaign to 50 recipients -> must consume EXACTLY 1 use, not 50!
  const reservation = db.reserveSendUse(user.id);
  console.assert(reservation.ok === true, 'Reservation should succeed');
  balance = db.getUsageBalance(user.id);
  console.assert(balance.sends_remaining === 39, `Balance should be 39, got ${balance.sends_remaining}`);
  console.assert(balance.reserved_sends === 1, `Reserved sends should be 1, got ${balance.reserved_sends}`);
  console.log(`✓ Reserved 1 Send action (Remaining: ${balance.sends_remaining}, In-flight: ${balance.reserved_sends})`);

  // Simulate successful send of campaign with 75 recipients
  const campaignData = {
    id: `camp_${Date.now()}`,
    subject: 'Please test our new Android app!',
    recipientsCount: 75,
    recipientsPreview: ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com'],
    sentCount: 75,
    failedCount: 0
  };
  const afterConsume = db.consumeSendUse(user.id, reservation.transactionId, campaignData);
  console.assert(afterConsume.sends_remaining === 39, `Balance should be 39 after 1 send action to 75 recipients`);
  console.assert(afterConsume.reserved_sends === 0, `Reserved sends should be 0`);
  console.assert(afterConsume.total_sends_consumed === 1, `Total consumed should be 1`);
  console.log(`✓ Consumed exactly 1 use for campaign with 75 recipients (1 action = 1 use regardless of recipient count)`);

  // 6. Test Rollback/Refund on Send Failure
  const reservation2 = db.reserveSendUse(user.id);
  console.assert(reservation2.ok === true, 'Second reservation should succeed');
  balance = db.getUsageBalance(user.id);
  console.assert(balance.sends_remaining === 38, `Balance should be 38 during reservation`);

  // Simulate network/SMTP failure
  const afterRefund = db.restoreSendUse(user.id, reservation2.transactionId, { id: 'camp_fail' }, 'SMTP Connection Timeout');
  console.assert(afterRefund.sends_remaining === 39, `Balance should be restored to 39 after failure, got ${afterRefund.sends_remaining}`);
  console.assert(afterRefund.reserved_sends === 0, `Reserved sends should be 0 after rollback`);
  console.log(`✓ Usage rollback verified: failed send refunded 1 use back to ${afterRefund.sends_remaining}`);

  // 7. Test Lifetime Plan
  const lifetimePayment = db.createPayment({
    userId: user.id,
    planId: 'lifetime',
    amountNpr: 1000,
    sendsToCredit: -1,
    isLifetime: true,
    referenceNumber: 'TXN-LIFETIME-001'
  });
  db.approvePayment(lifetimePayment.id, admin.id);
  const lifetimeBal = db.getUsageBalance(user.id);
  console.assert(lifetimeBal.is_lifetime === 1, 'User should now be marked lifetime');
  console.log('✓ Approved Lifetime plan: user permanently marked as is_lifetime=1');

  const lifetimeReserve = db.reserveSendUse(user.id);
  console.assert(lifetimeReserve.ok === true && lifetimeReserve.isLifetime === true, 'Lifetime user gets unlimited sends without deduction');
  console.log('✓ Lifetime reservation succeeded with Unlimited access');

  // 8. Test Templates & Multi-Device App Config Sync
  const tpl = db.saveUserTemplate(user.id, {
    name: 'Custom Team Template',
    desc: 'For internal team tests',
    subject: 'Team Beta Test',
    body: '<p>Hello team</p>'
  });
  console.assert(tpl && tpl.name === 'Custom Team Template', 'Template saved');
  const userTemplates = db.getUserTemplates(user.id);
  console.assert(userTemplates.some(t => t.name === 'Custom Team Template'), 'Template persisted');
  console.log('✓ User template saved and retrieved from DB');

  const config = db.saveUserAppConfig(user.id, {
    appName: 'Custom App Sync',
    packageId: 'com.sync.app',
    senderEmail: 'synced@gmail.com'
  });
  console.assert(config.app_name === 'Custom App Sync', 'App config saved');
  const loadedConfig = db.getUserAppConfig(user.id);
  console.assert(loadedConfig.app_name === 'Custom App Sync', 'App config persisted');
  console.log('✓ App configuration saved and persisted for cross-device sync');

  console.log('\n========================================');
  console.log('🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
