/**
 * EasyInvite - Tester Outreach Application Logic
 * Pure client-side focus on composing, previewing, and sending
 * Google Play Closed Testing invitations via Gmail SMTP.
 */

// Default State & Configuration
const DEFAULT_STATE = {
  appName: "",
  playStoreLink: "",
  directPlayLink: "",
  packageName: "",
  senderName: "",
  senderEmail: "",
  appPassword: "",
  smtpOnline: true,
  smtpVerified: false,
  currentTemplateId: "default",
  recipients: [],
  templates: {
    default: {
      name: "Early Tester Invitation",
      desc: "Modern two-button format with Join + Play Store links",
      subject: "You're invited to test {{app_name}} on Google Play",
      body: `<p>Hi there,</p>
<p>I'm inviting you to be one of the early testers of <strong>{{app_name}}</strong>. Your help is genuinely valuable — finding bugs, testing features, and shaping the app before its public launch.</p>
<p><strong>How to join:</strong></p>
<ol style="margin: 8px 0 16px 20px; padding: 0; line-height: 1.75;">
  <li>Click <strong>Join as a Tester</strong> and sign in with your Google account.</li>
  <li>Tap <strong>"Become a tester"</strong> on the Play Store testing page.</li>
  <li>Click <strong>Download on Play Store</strong> to install the app.</li>
  <li>Try it out and reply to this email with any feedback.</li>
</ol>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 8px 0;">
  <tr>
    <td style="padding-right: 10px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta">
        <tr><td><a href="{{link}}" target="_blank">1. JOIN AS A TESTER</a></td></tr>
      </table>
    </td>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green">
        <tr><td><a href="{{direct_link}}" target="_blank">2. DOWNLOAD ON PLAY STORE</a></td></tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 4px 0 20px 0; font-size: 12px; color: #64748b;">Step 1: Join test track &rarr; Step 2: Download on Google Play</p>
<p>It's completely free and only takes a couple of minutes. If you find any bugs or have suggestions, simply reply to this email.</p>
<p>Thank you for helping make <strong>{{app_name}}</strong> better.</p>
<p>Best regards,<br><strong>{{sender_name}}</strong></p>`
    },
    casual: {
      name: "Short & Casual",
      desc: "Quick and informal — great for friends and colleagues",
      subject: "Quick favor — help test my app on Google Play?",
      body: `<p>Hey!</p>
<p>I'm about to launch <strong>{{app_name}}</strong> on Google Play and could really use a few testers before the public release. Just two quick steps:</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 8px 0;">
  <tr>
    <td style="padding-right: 10px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta">
        <tr><td><a href="{{link}}" target="_blank">1. JOIN AS A TESTER</a></td></tr>
      </table>
    </td>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green">
        <tr><td><a href="{{direct_link}}" target="_blank">2. DOWNLOAD ON PLAY STORE</a></td></tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 4px 0 20px 0; font-size: 12px; color: #64748b;">Step 1: Join test track &rarr; Step 2: Download on Google Play</p>
<p><em>Note: You must complete Step 1 first before Step 2 works!</em></p>
<p>Let me know what you think — just reply to this email!</p>
<p>Thanks!</p>`
    },
    detailed: {
      name: "Detailed Invitation",
      desc: "Includes full instructions and testing checklist",
      subject: "You're invited to our Closed Beta on Google Play",
      body: `<p>Hello,</p>
<p>You've been personally selected to participate in the closed testing program for <strong>{{app_name}}</strong> ahead of its official launch on Google Play.</p>
<p><strong>Getting started is simple — just 2 steps:</strong></p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 8px 0;">
  <tr>
    <td style="padding-right: 10px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta">
        <tr><td><a href="{{link}}" target="_blank">1. JOIN AS A TESTER</a></td></tr>
      </table>
    </td>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green">
        <tr><td><a href="{{direct_link}}" target="_blank">2. DOWNLOAD ON PLAY STORE</a></td></tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 4px 0 20px 0; font-size: 12px; color: #64748b;">Step 1: Join test track &rarr; Step 2: Download on Google Play</p>
<p><em>Sign in with your Google Play email in Step 1, then install the app via Step 2.</em></p>
<p><strong>While testing, please explore:</strong></p>
<ul style="margin: 8px 0 16px 20px; line-height: 1.75;">
  <li>Overall usability and workflow</li>
  <li>App performance and stability</li>
  <li>Any bugs or unexpected behaviour</li>
</ul>
<p>Your feedback makes a real difference. Simply reply to this email with anything you notice.</p>
<p>Thank you for helping us make <strong>{{app_name}}</strong> better!</p>`
    },
    thankyou: {
      name: "Thank You (Follow Up)",
      desc: "Sent after testers join — confirms their access",
      subject: "Thank you for joining our closed test!",
      body: `<p>Hi,</p>
<p>Thank you so much for joining the closed testing program for <strong>{{app_name}}</strong>! Your support means a lot.</p>
<p>Here are your quick-access links:</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 8px 0;">
  <tr>
    <td style="padding-right: 10px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta">
        <tr><td><a href="{{link}}" target="_blank">TESTING OPT-IN</a></td></tr>
      </table>
    </td>
    <td>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green">
        <tr><td><a href="{{direct_link}}" target="_blank">PLAY STORE DOWNLOAD</a></td></tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin: 4px 0 20px 0; font-size: 12px; color: #64748b;">Bookmark these links — they'll be useful as we push updates.</p>
<p>Whenever you spot a bug or have an idea to improve the app, just reply directly to this email. I read every message.</p>
<p>Cheers!</p>`
    }
  }
};

// Version stamp for built-in templates.
// Bump this string whenever DEFAULT_STATE.templates changes to force a reset.
const BUILTIN_TPL_VERSION = "v3-dual-button";

// Application State Initializer
let state = loadState();

function loadState() {
  try {
    if (typeof localStorage !== "undefined") {
      // Purge legacy mock data
      localStorage.removeItem("bakibook_tester_state");
      const saved = localStorage.getItem("easyinvite_state_v1");
      if (saved) {
        const parsed = JSON.parse(saved);

        // Separate user-created templates from built-in ones
        const builtInKeys = new Set(['default', 'casual', 'detailed', 'thankyou']);
        const savedBuiltinVersion = parsed._builtinTplVersion || "";
        const needsReset = savedBuiltinVersion !== BUILTIN_TPL_VERSION;

        // Always start with fresh built-in templates
        const mergedTemplates = { ...DEFAULT_STATE.templates };

        // Layer user-created (custom_*) templates on top — never reset those
        for (const [key, tpl] of Object.entries(parsed.templates || {})) {
          if (!builtInKeys.has(key)) {
            mergedTemplates[key] = tpl; // preserve user-made templates
          } else if (!needsReset) {
            mergedTemplates[key] = tpl; // keep saved built-in only if version matches
          }
        }

        const newState = {
          ...DEFAULT_STATE,
          ...parsed,
          appName: parsed.appName !== undefined ? parsed.appName : (DEFAULT_STATE.appName || ""),
          playStoreLink: parsed.playStoreLink || "",
          directPlayLink: parsed.directPlayLink || "",
          packageName: parsed.packageName || "",
          senderName: parsed.senderName !== undefined ? parsed.senderName : DEFAULT_STATE.senderName,
          appPassword: parsed.appPassword || "",
          smtpOnline: parsed.smtpOnline !== undefined ? parsed.smtpOnline : true,
          smtpVerified: !!parsed.smtpVerified,
          currentTemplateId: parsed.currentTemplateId || "default",
          templates: mergedTemplates,
          _builtinTplVersion: BUILTIN_TPL_VERSION, // write current version to state
        };

        if (needsReset) {
          try {
            localStorage.setItem("easyinvite_state_v1", JSON.stringify(newState));
          } catch (e) {}
        }

        return newState;
      }
    }
  } catch (e) {
    console.warn("Could not parse saved state:", e);
  }
  const freshState = { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), _builtinTplVersion: BUILTIN_TPL_VERSION };
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("easyinvite_state_v1", JSON.stringify(freshState));
    }
  } catch (e) {}
  return freshState;
}

function saveState() {
  try {
    if (typeof localStorage !== "undefined") {
      // Always persist the current built-in version so migration knows what's cached
      state._builtinTplVersion = BUILTIN_TPL_VERSION;
      localStorage.setItem("easyinvite_state_v1", JSON.stringify(state));
    }
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}


// Global DOM references
const elements = {
  // Navigation
  navButtons: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view-content"),

  // Recipients
  tagsContainer: document.getElementById("tags-input-container"),
  tagsList: document.getElementById("tags-list"),
  chipInlineInput: document.getElementById("chip-inline-input"),
  textareaContainer: document.getElementById("textarea-container"),
  recipientsTextarea: document.getElementById("recipients-textarea"),
  toggleInputModeBtn: document.getElementById("toggle-input-mode-btn"),
  recipientCountText: document.getElementById("recipient-count-text"),
  btnImportCsv: document.getElementById("btn-import-csv"),
  csvFileInput: document.getElementById("csv-file-input"),
  
  // Email Form
  emailSubject: document.getElementById("email-subject"),
  messageEditor: document.getElementById("message-editor"),
  editorAppIdBadge: document.getElementById("editor-app-id-badge"),
  editorAppIdDot: document.getElementById("editor-app-id-dot"),
  editorAppIdText: document.getElementById("editor-app-id-text"),
  editorToolbarBtns: document.querySelectorAll(".toolbar-btn"),
  editorStyleSelect: document.getElementById("editor-style-select"),
  btnAppLinkDropdown: document.getElementById("btn-app-link-dropdown"),
  appLinkDropdownWrap: document.getElementById("app-link-dropdown-wrap"),
  appLinkMenu: document.getElementById("app-link-menu"),
  menuHeaderAppId: document.getElementById("menu-header-app-id"),
  optInsertTestingLink: document.getElementById("opt-insert-testing-link"),
  optTestingUrlPreview: document.getElementById("opt-testing-url-preview"),
  optInsertDirectLink: document.getElementById("opt-insert-direct-link"),
  optDirectUrlPreview: document.getElementById("opt-direct-url-preview"),
  optInsertCtaButton: document.getElementById("opt-insert-cta-button"),
  optInsertStoreButton: document.getElementById("opt-insert-store-button"),
  optInsertBothLinks: document.getElementById("opt-insert-both-links"),
  btnMenuGotoSettings: document.getElementById("btn-menu-goto-settings"),
  btnQuickTestingLink: document.getElementById("btn-quick-testing-link"),
  btnQuickDirectLink: document.getElementById("btn-quick-direct-link"),
  btnQuickBothLinks: document.getElementById("btn-quick-both-links"),
  btnSaveCurrentAsTemplate: document.getElementById("btn-save-current-as-template"),
  btnOpenTemplateSelector: document.getElementById("btn-open-template-selector"),
  btnSendInvitation: document.getElementById("btn-send-invitation"),
  sendButtonText: document.getElementById("send-button-text"),
  btnPreviewEmail: document.getElementById("btn-preview-email"),

  // Templates View
  fullTemplatesGrid: document.getElementById("full-templates-grid"),
  btnCreateTemplate: document.getElementById("btn-create-template"),
  
  // Settings View: Google Play Configuration
  playConfigStatusPill: document.getElementById("play-config-status-pill"),
  playConfigDot: document.getElementById("play-config-dot"),
  playConfigStatusText: document.getElementById("play-config-status-text"),
  btnAutoGenerateUrls: document.getElementById("btn-auto-generate-urls"),
  settingAppName: document.getElementById("setting-app-name"),
  settingPackageId: document.getElementById("setting-package-id"),
  settingTestingUrl: document.getElementById("setting-testing-url"),
  linkTestClosedUrl: document.getElementById("link-test-closed-url"),
  settingDirectUrl: document.getElementById("setting-direct-url"),
  linkTestDirectUrl: document.getElementById("link-test-direct-url"),
  btnClearPlayConfig: document.getElementById("btn-clear-play-config"),
  btnSavePlayConfig: document.getElementById("btn-save-play-config"),

  // Settings View: Sender & SMTP
  settingSenderName: document.getElementById("setting-sender-name"),
  settingSenderEmail: document.getElementById("setting-sender-email"),
  settingAppPassword: document.getElementById("setting-app-password"),
  senderNameSourceHint: document.getElementById("sender-name-source-hint"),
  senderNameError: document.getElementById("sender-name-error"),
  btnTestSmtp: document.getElementById("btn-test-smtp"),
  btnSaveSettings: document.getElementById("btn-save-settings"),

  // SMTP Real & Live Online/Offline Status Elements
  invitationSmtpBadge: document.getElementById("invitation-smtp-badge"),
  invitationSmtpDot: document.getElementById("invitation-smtp-dot"),
  invitationSmtpText: document.getElementById("invitation-smtp-text"),
  btnDeliverabilityInfo: document.getElementById("btn-deliverability-info"),
  sidebarSmtpCard: document.getElementById("sidebar-smtp-card"),
  sidebarSmtpDot: document.getElementById("sidebar-smtp-dot"),
  sidebarSmtpLabel: document.getElementById("sidebar-smtp-label"),
  settingSmtpStatusPill: document.getElementById("setting-smtp-status-pill"),
  settingStatusText: document.getElementById("setting-status-text"),
  btnStatusOnline: document.getElementById("btn-status-online"),
  btnStatusOffline: document.getElementById("btn-status-offline"),
  smtpStatusDescription: document.getElementById("smtp-status-description"),

  // Modals
  emailPreviewModal: document.getElementById("email-preview-modal"),
  closePreviewModal: document.getElementById("close-preview-modal"),
  closePreviewModalFooter: document.getElementById("close-preview-modal-footer"),
  btnSendFromPreview: document.getElementById("btn-send-from-preview"),
  previewTo: document.getElementById("preview-to"),
  previewFrom: document.getElementById("preview-from"),
  previewSubject: document.getElementById("preview-subject"),
  previewContentArea: document.getElementById("preview-content-area"),
  previewCtaButton: document.getElementById("preview-cta-button"),
  previewCtaTesting: document.getElementById("preview-cta-testing"),
  previewCtaDirect: document.getElementById("preview-cta-direct"),

  // Anti-Spam Deliverability Modal
  deliverabilityModal: document.getElementById("deliverability-modal"),
  closeDeliverabilityModal: document.getElementById("close-deliverability-modal"),
  closeDeliverabilityModalBtn: document.getElementById("close-deliverability-modal-btn"),

  // Template Editor Modal
  templateEditorModal: document.getElementById("template-editor-modal"),
  templateModalTitle: document.getElementById("template-modal-title"),
  closeTemplateModal: document.getElementById("close-template-modal"),
  closeTemplateModalFooter: document.getElementById("close-template-modal-footer"),
  btnSaveTemplateModal: document.getElementById("btn-save-template-modal"),
  tplEditId: document.getElementById("tpl-edit-id"),
  tplEditName: document.getElementById("tpl-edit-name"),
  tplEditDesc: document.getElementById("tpl-edit-desc"),
  tplEditSubject: document.getElementById("tpl-edit-subject"),
  tplEditBody: document.getElementById("tpl-edit-body"),       // hidden input (stores HTML for save)
  tplBodyEditor: document.getElementById("tpl-edit-body-editor"), // visible WYSIWYG div
  btnTplBold: document.getElementById("btn-tpl-bold"),
  btnTplItalic: document.getElementById("btn-tpl-italic"),
  btnTplInsertLink: document.getElementById("btn-tpl-insert-link"),
  btnTplInsertDirectLink: document.getElementById("btn-tpl-insert-direct-link"),
  btnTplInsertBothBlock: document.getElementById("btn-tpl-insert-both-block"),

  toastContainer: document.getElementById("toast-container")
};

// Current active mode for recipients: 'chips' | 'raw'
let recipientInputMode = "chips";
let currentTemplateId = "default";

// Page Detection Helper
function getCurrentPage() {
  if (document.body && document.body.getAttribute("data-page")) {
    return document.body.getAttribute("data-page");
  }
  const path = (window.location.pathname || "").toLowerCase();
  if (path.includes("templates")) return "email-templates";
  if (path.includes("settings")) return "settings";
  if (path.includes("billing")) return "billing";
  if (path.includes("admin")) return "admin-payments";
  return "send-invitation";
}

// ==========================================================================
// User Authentication, Usage Balances & Multi-Device Cloud Sync
// ==========================================================================
let currentUser = null;
let currentUserUsage = null;

async function initAuth() {
  ensureAuthModal();
  const token = localStorage.getItem("easyinvite_auth_token");
  if (!token) {
    renderSidebarUserSection();
    return;
  }

  try {
    const res = await fetch("/api/user/sync", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("easyinvite_auth_token");
        currentUser = null;
        currentUserUsage = null;
      }
      renderSidebarUserSection();
      return;
    }

    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      currentUserUsage = data.usage;

      // Sync database app configuration into state
      if (data.appConfig) {
        if (data.appConfig.appName) state.appName = data.appConfig.appName;
        if (data.appConfig.packageId) state.packageName = data.appConfig.packageId;
        if (data.appConfig.testingUrl) state.playStoreLink = data.appConfig.testingUrl;
        if (data.appConfig.directUrl) state.directPlayLink = data.appConfig.directUrl;
        if (data.appConfig.senderName) state.senderName = data.appConfig.senderName;
        if (data.appConfig.senderEmail) state.senderEmail = data.appConfig.senderEmail;
        if (data.appConfig.smtpOnline !== undefined) state.smtpOnline = data.appConfig.smtpOnline;
      }

      // Sync database templates into state
      if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
        data.templates.forEach(t => {
          state.templates[t.id] = {
            name: t.name,
            desc: t.desc || '',
            subject: t.subject,
            body: t.body
          };
        });
      }

      saveState();
      loadSettingsIntoFields();
      updatePlayConfigStatus();
      updateAppIdBadge();
      if (elements.fullTemplatesGrid) renderTemplatesGrid();
    }
  } catch (err) {
    console.warn("Could not sync user cloud profile:", err);
  } finally {
    renderSidebarUserSection();
  }
}

function renderSidebarUserSection() {
  const container = document.getElementById("sidebar-user-section");
  const adminNav = document.getElementById("sidebar-admin-link");

  if (currentUser && currentUser.role === 'admin') {
    if (adminNav) adminNav.style.display = 'flex';
  } else {
    if (adminNav) adminNav.style.display = 'none';
  }

  if (!container) return;

  if (currentUser) {
    const initial = (currentUser.name ? currentUser.name[0] : 'U').toUpperCase();
    const isAdmin = currentUser.role === 'admin';
    const isLifetime = currentUserUsage && currentUserUsage.isLifetime;
    const balanceText = isLifetime
      ? 'Unlimited (Lifetime)'
      : (currentUserUsage ? `${currentUserUsage.sendsRemaining} Sends left` : 'Loading balance...');

    const balancePillHtml = isAdmin ? '' : `
      <a href="billing.html" class="user-balance-pill ${isLifetime ? 'lifetime' : ''}" title="View plans & buy sends">
        <span>⚡ ${balanceText}</span>
        <span style="font-size: 0.72rem; opacity: 0.8;">${isLifetime ? 'Lifetime &rarr;' : 'Top up &rarr;'}</span>
      </a>
    `;

    container.innerHTML = `
      <div class="sidebar-user-card">
        <div class="user-profile-row">
          <div class="user-avatar">${escapeHtml(initial)}</div>
          <div class="user-meta">
            <div class="user-display-name">
              <span>${escapeHtml(currentUser.name)}</span>
              ${isAdmin ? '<span class="user-role-tag">Admin</span>' : ''}
            </div>
            <div class="user-email-text" title="${escapeHtml(currentUser.email)}">${escapeHtml(currentUser.email)}</div>
          </div>
        </div>
        ${balancePillHtml}
        <button type="button" class="btn-sidebar-logout" onclick="handleLogout()">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button type="button" class="btn-sidebar-login" onclick="showAuthModal('signin')">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign In / Register
      </button>
    `;
  }
}

function ensureAuthModal() {
  if (document.getElementById("auth-modal")) return;

  const modalHtml = `
  <div class="modal-backdrop" id="auth-modal" style="display: none; z-index: 10000;">
    <div class="modal-card auth-modal-card">
      <div class="auth-tabs">
        <button type="button" class="auth-tab-btn active" id="auth-tab-signin" onclick="switchAuthTab('signin')">Sign In</button>
        <button type="button" class="auth-tab-btn" id="auth-tab-register" onclick="switchAuthTab('register')">Create Account</button>
        <button type="button" class="auth-tab-btn" id="auth-tab-verify" onclick="switchAuthTab('verify')" style="display: none;">Verify Email</button>
      </div>

      <div class="modal-body" style="padding: 24px;">
        <!-- Form 1: Sign In -->
        <form id="auth-signin-form" onsubmit="submitSignIn(event)">
          <div class="form-group">
            <label class="form-label" for="signin-email">Email Address</label>
            <input type="email" id="signin-email" class="form-control" placeholder="you@gmail.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="signin-password">Password</label>
            <input type="password" id="signin-password" class="form-control" placeholder="••••••••" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary" id="btn-submit-signin" style="width: 100%; margin-top: 8px;">
            Sign In
          </button>
          <div style="text-align: center; margin-top: 14px; font-size: 0.82rem; color: #64748b;">
            Don't have an account? <a href="#" onclick="event.preventDefault(); switchAuthTab('register');" style="color: #2563eb; font-weight: 600;">Register here</a>
          </div>
        </form>

        <!-- Form 2: Register -->
        <form id="auth-register-form" onsubmit="submitRegister(event)" style="display: none;">
          <div class="form-group">
            <label class="form-label" for="register-name">Full Name</label>
            <input type="text" id="register-name" class="form-control" placeholder="John Doe" required autocomplete="name" />
          </div>
          <div class="form-group">
            <label class="form-label" for="register-email">Email Address</label>
            <input type="email" id="register-email" class="form-control" placeholder="you@gmail.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="register-password">Password (min 6 characters)</label>
            <input type="password" id="register-password" class="form-control" placeholder="••••••••" minlength="6" required autocomplete="new-password" />
          </div>
          <button type="submit" class="btn-primary" id="btn-submit-register" style="width: 100%; margin-top: 8px;">
            Create Account
          </button>
          <div style="text-align: center; margin-top: 14px; font-size: 0.82rem; color: #64748b;">
            Already have an account? <a href="#" onclick="event.preventDefault(); switchAuthTab('signin');" style="color: #2563eb; font-weight: 600;">Sign in</a>
          </div>
        </form>

        <!-- Form 3: Verify Email -->
        <form id="auth-verify-form" onsubmit="submitVerification(event)" style="display: none;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <h4 style="margin: 0; font-size: 1.05rem;">Email Verification Required</h4>
            <p style="font-size: 0.82rem; color: #64748b; margin: 4px 0 0;" id="verify-email-prompt">We sent a verification link to your email.</p>
          </div>
          <div class="form-group">
            <label class="form-label" for="verify-token-input">Verification Token / Code</label>
            <input type="text" id="verify-token-input" class="form-control" placeholder="Enter token from email or dev link" required />
            <div id="dev-verify-helper" style="margin-top: 8px; font-size: 0.76rem; color: #2563eb;"></div>
          </div>
          <button type="submit" class="btn-primary" id="btn-submit-verify" style="width: 100%; margin-top: 8px;">
            Verify and Log In
          </button>
          <div style="text-align: center; margin-top: 14px; font-size: 0.82rem; color: #64748b;">
            <a href="#" onclick="event.preventDefault(); switchAuthTab('signin');" style="color: #64748b;">Back to Sign In</a>
          </div>
        </form>
      </div>

      <div style="padding: 12px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: right;">
        <button type="button" class="btn-secondary" onclick="closeAuthModal()">Close</button>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function showAuthModal(tab = 'signin') {
  ensureAuthModal();
  switchAuthTab(tab);
  document.getElementById("auth-modal").style.display = "flex";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.style.display = "none";
}

function switchAuthTab(tab) {
  ensureAuthModal();
  const tabSignin = document.getElementById("auth-tab-signin");
  const tabRegister = document.getElementById("auth-tab-register");
  const tabVerify = document.getElementById("auth-tab-verify");
  const formSignin = document.getElementById("auth-signin-form");
  const formRegister = document.getElementById("auth-register-form");
  const formVerify = document.getElementById("auth-verify-form");

  tabSignin.classList.remove("active");
  tabRegister.classList.remove("active");
  if (tabVerify) tabVerify.classList.remove("active");

  formSignin.style.display = "none";
  formRegister.style.display = "none";
  if (formVerify) formVerify.style.display = "none";

  if (tab === "signin") {
    tabSignin.classList.add("active");
    formSignin.style.display = "block";
  } else if (tab === "register") {
    tabRegister.classList.add("active");
    formRegister.style.display = "block";
  } else if (tab === "verify") {
    if (tabVerify) {
      tabVerify.style.display = "block";
      tabVerify.classList.add("active");
    }
    if (formVerify) formVerify.style.display = "block";
  }
}

async function submitSignIn(e) {
  e.preventDefault();
  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value;
  const btn = document.getElementById("btn-submit-signin");

  btn.disabled = true;
  btn.textContent = "Signing in...";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("easyinvite_auth_token", data.token);
      currentUser = data.user;
      closeAuthModal();
      showToast(`Welcome back, ${currentUser.name}!`, "success");
      await initAuth();
    } else if (data.requiresVerification) {
      showToast("Please verify your email address.", "info");
      document.getElementById("verify-email-prompt").textContent = `We sent a verification link to ${email}.`;
      if (data.devVerificationToken) {
        document.getElementById("verify-token-input").value = data.devVerificationToken;
        document.getElementById("dev-verify-helper").innerHTML = `
          <strong>Quick verification:</strong> <a href="/verify-email?token=${data.devVerificationToken}" target="_blank">Click here to verify</a>
        `;
      }
      switchAuthTab("verify");
    } else {
      showToast(data.error || "Login failed.", "error");
    }
  } catch (err) {
    showToast("Network error during login.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const btn = document.getElementById("btn-submit-register");

  btn.disabled = true;
  btn.textContent = "Creating account...";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast("Account created! Please verify your email.", "success");
      document.getElementById("verify-email-prompt").textContent = `A verification code was created for ${email}.`;
      if (data.devVerificationToken) {
        document.getElementById("verify-token-input").value = data.devVerificationToken;
        document.getElementById("dev-verify-helper").innerHTML = `
          <strong>Quick verification link:</strong> <a href="${data.devVerifyUrl}" target="_blank">Click here to verify immediately</a>
        `;
      }
      switchAuthTab("verify");
    } else {
      showToast(data.error || "Registration failed.", "error");
    }
  } catch (err) {
    showToast("Network error during registration.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

async function submitVerification(e) {
  e.preventDefault();
  const token = document.getElementById("verify-token-input").value.trim();
  const btn = document.getElementById("btn-submit-verify");

  btn.disabled = true;
  btn.textContent = "Verifying...";

  try {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await res.json();

    if (data.success) {
      if (data.token) {
        localStorage.setItem("easyinvite_auth_token", data.token);
      }
      closeAuthModal();
      showToast("Email verified successfully! You are now logged in.", "success");
      await initAuth();
    } else {
      showToast(data.error || "Verification failed.", "error");
    }
  } catch (err) {
    showToast("Network error during email verification.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Verify and Log In";
  }
}

function handleLogout() {
  localStorage.removeItem("easyinvite_auth_token");
  currentUser = null;
  currentUserUsage = null;
  fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  renderSidebarUserSection();
  showToast("Logged out successfully.", "info");
}

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize authentication, cloud sync, and sidebar user section
  initAuth();

  const activePage = getCurrentPage();
  try {
    sessionStorage.setItem("easyinvite_active_view", activePage);
  } catch (e) {}

  // Highlight active nav item matching the current page
  elements.navButtons.forEach(btn => {
    if (btn.getAttribute("data-view") === activePage) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Render components specific to the current page
  if (elements.tagsList || elements.recipientsTextarea) {
    renderRecipients();
  }
  if (elements.fullTemplatesGrid) {
    renderTemplatesGrid();
  }
  if (elements.settingPackageId || elements.settingSenderEmail || elements.settingAppName) {
    loadSettingsIntoFields();
  }
  updatePlayConfigStatus();
  updateSmtpUI(state.smtpOnline);
  setupEventListeners();

  // If there are multiple views on the same page (e.g. monolithic SPA mode), switchView
  if (elements.views.length > 1) {
    switchView(activePage);
  } else if (elements.views.length === 1) {
    elements.views[0].style.display = (activePage === "send-invitation") ? "flex" : "block";
  }

  // Restore currentTemplateId from state if present
  if (state.currentTemplateId && state.templates[state.currentTemplateId]) {
    currentTemplateId = state.currentTemplateId;
  }

  // Silently populate the editor with the current template — only if editor exists
  if (elements.messageEditor) {
    applyTemplate(currentTemplateId, true);
  }

  // Proactively clear any template toast flags so no toast ever appears on page load or refresh
  try {
    sessionStorage.removeItem("easyinvite_applied_toast");
    localStorage.removeItem("easyinvite_applied_toast");
  } catch (e) {}

  // Load any configured defaults or credentials from .env
  loadServerEnvConfig();
});

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Navigation tabs — support both multi-page standalone files and in-page SPA tabs
  elements.navButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetView = btn.getAttribute("data-view");
      const targetElem = targetView ? document.getElementById(`view-${targetView}`) : null;

      // If multiple views exist in this document (SPA mode), prevent full page load and toggle in-place
      if (targetElem && elements.views.length > 1) {
        e.preventDefault();
        switchView(targetView);
      }
      // Otherwise, the natural <a href="..."> browser navigation directs cleanly to the page file!
    });
  });

  // Other internal links that switch views
  document.querySelectorAll("[data-view]").forEach(elem => {
    if (!elem.classList.contains("nav-item")) {
      elem.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = elem.getAttribute("data-view");
        if (targetView) switchView(targetView);
      });
    }
  });

  // "Templates" button in editor header
  if (elements.btnOpenTemplateSelector) {
    elements.btnOpenTemplateSelector.addEventListener("click", (e) => {
      e.preventDefault();
      switchView("email-templates");
    });
  }

  // "Save as Template" button in editor header
  if (elements.btnSaveCurrentAsTemplate) {
    elements.btnSaveCurrentAsTemplate.addEventListener("click", (e) => {
      e.preventDefault();
      const currentSubject = (elements.emailSubject && elements.emailSubject.value.trim()) || "";
      const currentHtml = (elements.messageEditor && elements.messageEditor.innerHTML.trim()) || "";

      openTemplateModal(null);

      if (elements.templateModalTitle) elements.templateModalTitle.textContent = "Save as New Template";
      if (elements.tplEditName) elements.tplEditName.value = currentSubject ? "Template: " + currentSubject.substring(0, 20) : "My Custom Template";
      if (elements.tplEditSubject) elements.tplEditSubject.value = currentSubject;
      if (elements.tplBodyEditor) elements.tplBodyEditor.innerHTML = currentHtml;
    });
  }

  // Recipients: Chip Inline Input
  if (elements.chipInlineInput) {
    elements.chipInlineInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "," || e.key === " ") {
        e.preventDefault();
        addChipFromInput();
      } else if (e.key === "Backspace" && elements.chipInlineInput.value === "" && state.recipients.length > 0) {
        removeRecipient(state.recipients.length - 1);
      }
    });

    elements.chipInlineInput.addEventListener("blur", () => {
      addChipFromInput();
    });
  }

  // Toggle Input Mode (Chips vs Raw textarea)
  if (elements.toggleInputModeBtn) {
    elements.toggleInputModeBtn.addEventListener("click", () => {
      if (recipientInputMode === "chips") {
        recipientInputMode = "raw";
        if (elements.tagsContainer) elements.tagsContainer.style.display = "none";
        if (elements.textareaContainer) elements.textareaContainer.style.display = "block";
        if (elements.recipientsTextarea) elements.recipientsTextarea.value = state.recipients.join("\n");
        elements.toggleInputModeBtn.textContent = "Switch to Chip View";
      } else {
        recipientInputMode = "chips";
        syncRecipientsFromTextarea();
        if (elements.tagsContainer) elements.tagsContainer.style.display = "flex";
        if (elements.textareaContainer) elements.textareaContainer.style.display = "none";
        elements.toggleInputModeBtn.textContent = "Switch to Raw Paste";
        renderRecipients();
      }
    });
  }

  if (elements.recipientsTextarea) {
    elements.recipientsTextarea.addEventListener("input", () => {
      syncRecipientsFromTextarea();
    });
  }

  // CSV Import
  if (elements.btnImportCsv && elements.csvFileInput) {
    elements.btnImportCsv.addEventListener("click", () => {
      elements.csvFileInput.click();
    });

    elements.csvFileInput.addEventListener("change", handleCsvUpload);
  }

  // WYSIWYG Toolbar Formatting
  elements.editorToolbarBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      if (action === "createLink") {
        const url = prompt("Enter hyperlink URL:", state.playStoreLink || "https://");
        if (url) document.execCommand(action, false, url);
      } else if (action) {
        document.execCommand(action, false, null);
      }
      if (elements.messageEditor) elements.messageEditor.focus();
    });
  });

  if (elements.editorStyleSelect) {
    elements.editorStyleSelect.addEventListener("change", (e) => {
      document.execCommand("formatBlock", false, e.target.value);
      if (elements.messageEditor) elements.messageEditor.focus();
    });
  }

  // App Link Shortcuts & Dropdown listeners
  if (elements.btnAppLinkDropdown) {
    elements.btnAppLinkDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAppLinkMenu();
    });
  }

  // Prevent mousedown on shortcuts from blurring editor selection
  [
    elements.btnAppLinkDropdown,
    elements.optInsertTestingLink,
    elements.optInsertDirectLink,
    elements.optInsertCtaButton,
    elements.optInsertBothLinks,
    elements.btnQuickTestingLink,
    elements.btnQuickDirectLink
  ].forEach(btn => {
    if (btn) {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
      });
    }
  });

  if (elements.optInsertTestingLink) {
    elements.optInsertTestingLink.addEventListener("click", insertTestingLinkShortcut);
  }
  if (elements.btnQuickTestingLink) {
    elements.btnQuickTestingLink.addEventListener("click", insertTestingLinkShortcut);
  }

  if (elements.optInsertDirectLink) {
    elements.optInsertDirectLink.addEventListener("click", insertDirectLinkShortcut);
  }
  if (elements.btnQuickDirectLink) {
    elements.btnQuickDirectLink.addEventListener("click", insertDirectLinkShortcut);
  }

  if (elements.optInsertCtaButton) {
    elements.optInsertCtaButton.addEventListener("click", insertCtaButtonShortcut);
  }

  if (elements.optInsertStoreButton) {
    elements.optInsertStoreButton.addEventListener("click", insertStoreButtonShortcut);
  }

  if (elements.optInsertBothLinks) {
    elements.optInsertBothLinks.addEventListener("click", insertBothLinksShortcut);
  }

  if (elements.btnQuickBothLinks) {
    elements.btnQuickBothLinks.addEventListener("click", insertBothLinksShortcut);
  }

  if (elements.btnMenuGotoSettings) {
    elements.btnMenuGotoSettings.addEventListener("click", () => {
      closeAppLinkMenu();
      switchView("settings");
      if (elements.settingPackageId) elements.settingPackageId.focus();
    });
  }

  if (elements.editorAppIdBadge) {
    elements.editorAppIdBadge.addEventListener("click", () => {
      switchView("settings");
      if (elements.settingPackageId) elements.settingPackageId.focus();
    });
  }

  // Close App Link dropdown on click outside
  document.addEventListener("click", (e) => {
    if (elements.appLinkDropdownWrap && !elements.appLinkDropdownWrap.contains(e.target)) {
      closeAppLinkMenu();
    }
  });

  // Track selection inside message-editor so insertions happen at caret
  if (elements.messageEditor) {
    elements.messageEditor.addEventListener("keyup", saveEditorSelection);
    elements.messageEditor.addEventListener("mouseup", saveEditorSelection);
    elements.messageEditor.addEventListener("touchend", saveEditorSelection);
  }

  // Ensure on typing that scroll stays strictly and exclusively inside the typing box
  if (elements.messageEditor) {
    const keepScrollInTypingBox = () => {
      if (elements.messageEditor.parentElement) {
        elements.messageEditor.parentElement.scrollTop = 0;
      }
      const formCard = document.querySelector(".form-card");
      if (formCard && formCard.scrollTop !== 0) formCard.scrollTop = 0;
      const mainWrapper = document.querySelector(".main-wrapper");
      if (mainWrapper && mainWrapper.scrollTop !== 0) mainWrapper.scrollTop = 0;
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    elements.messageEditor.addEventListener("input", keepScrollInTypingBox);
    elements.messageEditor.addEventListener("keydown", () => {
      requestAnimationFrame(keepScrollInTypingBox);
    });
    elements.messageEditor.addEventListener("keyup", () => {
      requestAnimationFrame(keepScrollInTypingBox);
    });
  }

  // Send Button & Email Preview
  if (elements.btnSendInvitation) {
    elements.btnSendInvitation.addEventListener("click", handleSendInvitations);
  }

  if (elements.btnPreviewEmail) {
    elements.btnPreviewEmail.addEventListener("click", openEmailPreviewModal);
  }

  if (elements.closePreviewModal) {
    elements.closePreviewModal.addEventListener("click", closeEmailPreviewModal);
  }

  if (elements.closePreviewModalFooter) {
    elements.closePreviewModalFooter.addEventListener("click", closeEmailPreviewModal);
  }

  if (elements.btnSendFromPreview) {
    elements.btnSendFromPreview.addEventListener("click", () => {
      closeEmailPreviewModal();
      handleSendInvitations();
    });
  }

  // Close modal when clicking backdrop
  if (elements.emailPreviewModal) {
    elements.emailPreviewModal.addEventListener("click", (e) => {
      if (e.target === elements.emailPreviewModal) {
        closeEmailPreviewModal();
      }
    });
  }

  // Anti-Spam Deliverability Modal Controls
  if (elements.btnDeliverabilityInfo) {
    elements.btnDeliverabilityInfo.addEventListener("click", () => {
      if (elements.deliverabilityModal) elements.deliverabilityModal.style.display = "flex";
    });
  }
  if (elements.closeDeliverabilityModal) {
    elements.closeDeliverabilityModal.addEventListener("click", () => {
      if (elements.deliverabilityModal) elements.deliverabilityModal.style.display = "none";
    });
  }
  if (elements.closeDeliverabilityModalBtn) {
    elements.closeDeliverabilityModalBtn.addEventListener("click", () => {
      if (elements.deliverabilityModal) elements.deliverabilityModal.style.display = "none";
    });
  }
  if (elements.deliverabilityModal) {
    elements.deliverabilityModal.addEventListener("click", (e) => {
      if (e.target === elements.deliverabilityModal) {
        elements.deliverabilityModal.style.display = "none";
      }
    });
  }

  // Templates View: New Template
  if (elements.btnCreateTemplate) {
    elements.btnCreateTemplate.addEventListener("click", () => {
      openTemplateModal(null);
    });
  }

  // Template Editor Modal Controls
  if (elements.closeTemplateModal) {
    elements.closeTemplateModal.addEventListener("click", closeTemplateModal);
  }
  if (elements.closeTemplateModalFooter) {
    elements.closeTemplateModalFooter.addEventListener("click", closeTemplateModal);
  }
  if (elements.templateEditorModal) {
    elements.templateEditorModal.addEventListener("click", (e) => {
      if (e.target === elements.templateEditorModal) closeTemplateModal();
    });
  }
  if (elements.btnSaveTemplateModal) {
    elements.btnSaveTemplateModal.addEventListener("click", handleSaveTemplateFromModal);
  }
  if (elements.btnTplInsertLink) {
    elements.btnTplInsertLink.addEventListener("click", () => {
      if (elements.tplBodyEditor) {
        elements.tplBodyEditor.focus();
        document.execCommand("insertText", false, "{{link}}");
      }
    });
  }

  if (elements.btnTplInsertDirectLink) {
    elements.btnTplInsertDirectLink.addEventListener("click", () => {
      if (elements.tplBodyEditor) {
        elements.tplBodyEditor.focus();
        document.execCommand("insertText", false, "{{direct_link}}");
      }
    });
  }

  if (elements.btnTplInsertBothBlock) {
    elements.btnTplInsertBothBlock.addEventListener("click", () => {
      if (elements.tplBodyEditor) {
        elements.tplBodyEditor.focus();
        const block = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:16px 0 8px 0;"><tr><td style="padding-right:10px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta"><tr><td><a href="{{link}}" target="_blank">1. JOIN AS A TESTER</a></td></tr></table></td><td><table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-cta-green"><tr><td><a href="{{direct_link}}" target="_blank">2. DOWNLOAD ON PLAY STORE</a></td></tr></table></td></tr></table><p style="font-size:12px;color:#64748b;margin:4px 0 16px 0;">Step 1: Join test track &rarr; Step 2: Download on Google Play</p>`;
        document.execCommand("insertHTML", false, block);
      }
    });
  }

  // Google Play Configuration Event Listeners
  if (elements.settingPackageId) {
    elements.settingPackageId.addEventListener("input", handlePackageIdInput);
  }
  if (elements.settingTestingUrl) {
    elements.settingTestingUrl.addEventListener("input", updatePlayConfigStatus);
  }
  if (elements.settingDirectUrl) {
    elements.settingDirectUrl.addEventListener("input", updatePlayConfigStatus);
  }
  if (elements.btnAutoGenerateUrls) {
    elements.btnAutoGenerateUrls.addEventListener("click", handleAutoGenerateUrls);
  }
  if (elements.btnSavePlayConfig) {
    elements.btnSavePlayConfig.addEventListener("click", handleSavePlayConfig);
  }
  if (elements.btnClearPlayConfig) {
    elements.btnClearPlayConfig.addEventListener("click", handleClearPlayConfig);
  }

  // Settings View: Test SMTP & Save
  if (elements.btnTestSmtp) {
    elements.btnTestSmtp.addEventListener("click", handleTestSmtpConnection);
  }

  if (elements.btnSaveSettings) {
    elements.btnSaveSettings.addEventListener("click", handleSaveSettings);
  }

  // SMTP Online / Offline Segmented Control
  if (elements.btnStatusOnline) {
    elements.btnStatusOnline.addEventListener("click", () => {
      updateSmtpUI(true);
      saveState();
      showToast("SMTP sending is now Online (Live Dispatch)", "success");
    });
  }

  if (elements.btnStatusOffline) {
    elements.btnStatusOffline.addEventListener("click", () => {
      updateSmtpUI(false);
      saveState();
      showToast("SMTP sending is now Offline (Paused)", "info");
    });
  }

  // Quick navigation to Settings from status badges
  if (elements.invitationSmtpBadge) {
    elements.invitationSmtpBadge.addEventListener("click", () => {
      switchView("settings");
    });
  }

  if (elements.sidebarSmtpCard) {
    elements.sidebarSmtpCard.addEventListener("click", () => {
      switchView("settings");
    });
  }
}

// ==========================================================================
// View Routing / Tab Switching
// ==========================================================================
function switchView(viewKey) {
  const pageFileMap = {
    "send-invitation": "index.html",
    "email-templates": "templates.html",
    "settings": "settings.html"
  };

  const targetViewElem = document.getElementById(`view-${viewKey}`);
  if (!targetViewElem) {
    // If target view does not exist in the current page document, redirect to its dedicated file
    const targetFile = pageFileMap[viewKey] || "index.html";
    try {
      sessionStorage.setItem("easyinvite_active_view", viewKey);
    } catch (e) {}
    window.location.href = targetFile;
    return;
  }

  try {
    sessionStorage.setItem("easyinvite_active_view", viewKey);
  } catch (e) {}

  // Update nav active states
  elements.navButtons.forEach(btn => {
    if (btn.getAttribute("data-view") === viewKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update view contents
  elements.views.forEach(view => {
    if (view.id === `view-${viewKey}`) {
      view.style.display = (viewKey === "send-invitation") ? "flex" : "block";
    } else {
      view.style.display = "none";
    }
  });

  // Trigger view-specific re-renders
  if (viewKey === "email-templates") {
    renderTemplatesGrid();
  } else if (viewKey === "settings") {
    loadSettingsIntoFields();
  }
}

// ==========================================================================
// Recipients Chips & Input Logic
// ==========================================================================
function renderRecipients() {
  if (!elements.tagsList) return;
  elements.tagsList.innerHTML = "";

  state.recipients.forEach((email, index) => {
    const chip = document.createElement("div");
    chip.className = "tag-chip";
    chip.innerHTML = `
      <span>${escapeHtml(email)}</span>
      <button type="button" class="tag-remove-btn" data-index="${index}" title="Remove email">&times;</button>
    `;

    chip.querySelector(".tag-remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeRecipient(index);
    });

    elements.tagsList.appendChild(chip);
  });

  updateRecipientsCount();
}

function addChipFromInput() {
  if (!elements.chipInlineInput) return;
  const raw = elements.chipInlineInput.value.trim();
  if (!raw) return;

  // Split in case user pasted comma or space separated emails
  const candidates = raw.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  let addedCount = 0;

  candidates.forEach(email => {
    const clean = email.toLowerCase();
    if (isValidEmail(clean) && !state.recipients.includes(clean)) {
      state.recipients.push(clean);
      addedCount++;
    }
  });

  elements.chipInlineInput.value = "";
  if (addedCount > 0) {
    saveState();
    renderRecipients();
  }
}

function removeRecipient(index) {
  state.recipients.splice(index, 1);
  saveState();
  renderRecipients();
}

function syncRecipientsFromTextarea() {
  if (!elements.recipientsTextarea) return;
  const raw = elements.recipientsTextarea.value;
  const emails = raw.split(/[\r\n,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const uniqueEmails = [...new Set(emails.filter(isValidEmail))];
  state.recipients = uniqueEmails;
  saveState();
  updateRecipientsCount();
}

function updateRecipientsCount() {
  const count = state.recipients.length;
  if (elements.recipientCountText) {
    elements.recipientCountText.textContent = `${count} recipient${count === 1 ? "" : "s"} ready`;
  }
  
  if (elements.sendButtonText) {
    if (count > 1) {
      elements.sendButtonText.textContent = `Send ${count} Invitations`;
    } else if (count === 1) {
      elements.sendButtonText.textContent = `Send 1 Invitation`;
    } else {
      elements.sendButtonText.textContent = `Send Invitation(s)`;
    }
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper to extract or resolve app name and sender name
function formatAppNameFromPackage(pkg) {
  if (!pkg) return "our app";
  const parts = pkg.split(".").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  if (!last) return "our app";
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function getResolvedAppName() {
  return (elements.settingAppName && elements.settingAppName.value.trim())
    || state.appName
    || (state.packageName ? formatAppNameFromPackage(state.packageName) : "our app");
}

function getResolvedSenderName() {
  return (elements.settingSenderName && elements.settingSenderName.value.trim())
    || state.senderName
    || "";
}

// ==========================================================================
// Template Selection & Insertion Logic
// ==========================================================================
function applyTemplate(templateId, suppressToast = false) {
  currentTemplateId = templateId;
  state.currentTemplateId = templateId;
  saveState();
  const template = state.templates[templateId];
  if (!template) return;

  const appNameVal = getResolvedAppName();
  const senderNameVal = getResolvedSenderName();
  const testingPlaceholder = state.playStoreLink || "{{link}}";
  const directPlaceholder = state.directPlayLink || "{{direct_link}}";
  const pkgPlaceholder = state.packageName || "{{package_id}}";

  if (elements.emailSubject) {
    elements.emailSubject.value = template.subject
      .replaceAll("{{app_name}}", appNameVal)
      .replaceAll("[App Name]", appNameVal)
      .replaceAll("{{sender_name}}", senderNameVal)
      .replaceAll("[Your Name]", senderNameVal);
  }

  if (elements.messageEditor) {
    let formattedBody = template.body
      .replaceAll("{{link}}", testingPlaceholder)
      .replaceAll("{{testing_link}}", testingPlaceholder)
      .replaceAll("[Google Play Testing Link]", testingPlaceholder)
      .replaceAll("{{direct_link}}", directPlaceholder)
      .replaceAll("{{package_id}}", pkgPlaceholder)
      .replaceAll("{{app_name}}", appNameVal)
      .replaceAll("[App Name]", appNameVal)
      .replaceAll("{{sender_name}}", senderNameVal)
      .replaceAll("[Your Name]", senderNameVal);

    elements.messageEditor.innerHTML = formattedBody;
  }
}

function updateEditorWithTestingLink(newUrl) {
  applyTemplate(currentTemplateId, true);
}

// ==========================================================================
// Sending Invitations (Direct Real Gmail Dispatch with Backend Usage Control)
// ==========================================================================
async function handleSendInvitations() {
  const authToken = localStorage.getItem("easyinvite_auth_token");
  if (!authToken) {
    showToast("Please sign in or create an account to send invitations.", "warning");
    showAuthModal("signin");
    return;
  }

  // Sync if currently typing in textarea mode
  if (recipientInputMode === "raw") {
    syncRecipientsFromTextarea();
  }

  if (state.recipients.length === 0) {
    showToast("Please add at least one recipient email address!", "info");
    if (elements.chipInlineInput) elements.chipInlineInput.focus();
    return;
  }

  const subject = elements.emailSubject ? elements.emailSubject.value.trim() : "";
  if (!subject) {
    showToast("Please enter an email subject line", "info");
    if (elements.emailSubject) elements.emailSubject.focus();
    return;
  }

  const html = elements.messageEditor ? elements.messageEditor.innerHTML : "";
  if (!html) {
    showToast("Please enter an email message", "info");
    if (elements.messageEditor) elements.messageEditor.focus();
    return;
  }

  // Verify SMTP Online status
  if (!state.smtpOnline) {
    showToast("SMTP dispatch is currently Offline. Switch to Online in Settings to send live emails.", "warning");
    return;
  }

  // Verify sender email is configured
  if (!state.senderEmail) {
    showToast("Please enter your Gmail address in Settings first!", "warning");
    switchView("settings");
    if (elements.settingSenderEmail) elements.settingSenderEmail.focus();
    return;
  }

  const recipientCount = state.recipients.length;
  const originalText = elements.sendButtonText ? elements.sendButtonText.textContent : "Send Invitation(s)";

  // Set loading state on button
  if (elements.btnSendInvitation) elements.btnSendInvitation.disabled = true;
  if (elements.sendButtonText) {
    elements.sendButtonText.textContent = `Sending Live via Gmail (${recipientCount})...`;
  }

  // Real & Live Gmail SMTP Dispatch
  try {
    const appNameVal = getResolvedAppName();
    const senderNameVal = getResolvedSenderName();
    const testingPlaceholder = state.playStoreLink || "{{link}}";
    const directPlaceholder = state.directPlayLink || "{{direct_link}}";

    const finalSubject = subject
      .replaceAll("[App Name]", appNameVal)
      .replaceAll("{{app_name}}", appNameVal)
      .replaceAll("[Your Name]", senderNameVal)
      .replaceAll("{{sender_name}}", senderNameVal);

    const pkgPlaceholder = state.packageName || "{{package_id}}";

    const finalHtml = html
      .replaceAll("[App Name]", appNameVal)
      .replaceAll("{{app_name}}", appNameVal)
      .replaceAll("[Your Name]", senderNameVal)
      .replaceAll("{{sender_name}}", senderNameVal)
      .replaceAll("[Google Play Testing Link]", testingPlaceholder)
      .replaceAll("{{link}}", testingPlaceholder)
      .replaceAll("{{testing_link}}", testingPlaceholder)
      .replaceAll("{{direct_link}}", directPlaceholder)
      .replaceAll("{{package_id}}", pkgPlaceholder);

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipients: state.recipients,
        subject: finalSubject,
        html: finalHtml,
        senderName: senderNameVal,
        senderEmail: state.senderEmail.trim(),
        appPassword: (state.appPassword || "").trim(),
        appName: appNameVal
      })
    });

    const data = await res.json();

    if (res.status === 402 || data.code === "NO_BALANCE") {
      showToast("You have 0 Send Actions remaining. Please purchase a plan on the Billing page.", "warning");
      setTimeout(() => {
        window.location.href = "billing.html";
      }, 1800);
      return;
    }

    if (data.success) {
      updateSmtpUI(true, "Verified Online");
      if (data.usage) {
        currentUserUsage = {
          ...(currentUserUsage || {}),
          sendsRemaining: data.usage.sendsRemaining,
          isLifetime: data.usage.isLifetime
        };
        renderSidebarUserSection();
      }

      showToast(`Successfully sent ${data.sentCount} invitation${data.sentCount === 1 ? "" : "s"} via Gmail!`, "success");

      // Clear recipients for the next batch
      state.recipients = [];
      saveState();
      renderRecipients();

      if (elements.recipientsTextarea) {
        elements.recipientsTextarea.value = "";
      }
    } else {
      updateSmtpUI(false, "Offline (Auth Failed)");
      showToast(`Failed: ${data.error}`, "error");
    }
  } catch (err) {
    console.error("Dispatch error:", err);
    updateSmtpUI(false, "Offline (Network Error)");
    showToast(`Network error: ${err.message}`, "error");
  } finally {
    if (elements.btnSendInvitation) elements.btnSendInvitation.disabled = false;
    if (elements.sendButtonText) elements.sendButtonText.textContent = originalText;
  }
}

// ==========================================================================
// Templates View: Full CRUD (Add, Edit, Delete, Apply)
// ==========================================================================
function renderTemplatesGrid() {
  if (!elements.fullTemplatesGrid) return;
  elements.fullTemplatesGrid.innerHTML = "";

  const keys = Object.keys(state.templates);
  if (keys.length === 0) {
    elements.fullTemplatesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--text-muted);">
        <p style="font-size: 1.05rem; font-weight: 600; color: #334155; margin-bottom: 8px;">No templates found</p>
        <p style="font-size: 0.85rem; margin-bottom: 18px;">Create a template to save custom invitation messaging for Google Play testing.</p>
        <button type="button" class="btn-primary" id="btn-empty-create-template">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Template
        </button>
      </div>
    `;
    const emptyBtn = document.getElementById("btn-empty-create-template");
    if (emptyBtn) {
      emptyBtn.addEventListener("click", () => openTemplateModal(null));
    }
    return;
  }

  keys.forEach(key => {
    const t = state.templates[key];
    const card = document.createElement("div");
    card.className = "template-card";

    const linkPlaceholder = state.playStoreLink || "{{link}}";

    card.innerHTML = `
      <div>
        <div class="template-card-header">
          <h4 class="template-card-title">${escapeHtml(t.name)}</h4>
          ${key === currentTemplateId ? '<span class="template-badge-active">Active</span>' : ''}
        </div>
        ${t.desc ? `<p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px;">${escapeHtml(t.desc)}</p>` : ''}
        <p style="font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 6px;">Subject: ${escapeHtml(t.subject)}</p>
        <div class="template-card-body">
          ${t.body.replaceAll("{{link}}", linkPlaceholder)}
        </div>
      </div>
      <div class="template-card-actions">
        <button type="button" class="btn-primary-small btn-apply-tpl" data-id="${key}" title="Apply this template to the invitation composer">
          Apply to Form
        </button>
        <div class="template-action-icons">
          <button type="button" class="btn-icon-small btn-edit-tpl" data-id="${key}" title="Edit Template">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button type="button" class="btn-icon-small btn-delete-tpl text-danger" data-id="${key}" title="Delete Template">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    `;

    // Apply button
    card.querySelector(".btn-apply-tpl").addEventListener("click", () => {
      state.currentTemplateId = key;
      currentTemplateId = key;
      saveState();

      if (elements.messageEditor) {
        applyTemplate(key, true);
        switchView("send-invitation");
      } else {
        window.location.href = "index.html";
      }
    });

    // Edit button
    card.querySelector(".btn-edit-tpl").addEventListener("click", () => {
      openTemplateModal(key);
    });

    // Delete button
    card.querySelector(".btn-delete-tpl").addEventListener("click", () => {
      handleDeleteTemplate(key);
    });

    elements.fullTemplatesGrid.appendChild(card);
  });
}

function openTemplateModal(templateId = null) {
  if (!elements.templateEditorModal) return;

  const defaultBody = `<p>Hi there,</p><p>You're invited to test our closed beta on Google Play!</p><p>Download and join here:<br><a href="{{link}}" target="_blank">{{link}}</a></p><p>Thanks for your help testing!</p>`;

  if (templateId && state.templates[templateId]) {
    const t = state.templates[templateId];
    if (elements.templateModalTitle) elements.templateModalTitle.textContent = "Edit Template";
    if (elements.tplEditId) elements.tplEditId.value = templateId;
    if (elements.tplEditName) elements.tplEditName.value = t.name;
    if (elements.tplEditDesc) elements.tplEditDesc.value = t.desc || "";
    if (elements.tplEditSubject) elements.tplEditSubject.value = t.subject || "";
    if (elements.tplBodyEditor) elements.tplBodyEditor.innerHTML = t.body || "";
  } else {
    if (elements.templateModalTitle) elements.templateModalTitle.textContent = "New Template";
    if (elements.tplEditId) elements.tplEditId.value = "";
    if (elements.tplEditName) elements.tplEditName.value = "";
    if (elements.tplEditDesc) elements.tplEditDesc.value = "";
    if (elements.tplEditSubject) elements.tplEditSubject.value = "You're invited to test our app on Google Play";
    if (elements.tplBodyEditor) elements.tplBodyEditor.innerHTML = defaultBody;
  }

  elements.templateEditorModal.style.display = "flex";
  if (elements.tplEditName) elements.tplEditName.focus();
}

function closeTemplateModal() {
  if (elements.templateEditorModal) {
    elements.templateEditorModal.style.display = "none";
  }
}

function handleSaveTemplateFromModal() {
  const name = (elements.tplEditName && elements.tplEditName.value.trim()) || "";
  const desc = (elements.tplEditDesc && elements.tplEditDesc.value.trim()) || "";
  const subject = (elements.tplEditSubject && elements.tplEditSubject.value.trim()) || "";
  // Read body from the WYSIWYG div
  const body = (elements.tplBodyEditor && elements.tplBodyEditor.innerHTML.trim()) || "";
  const id = (elements.tplEditId && elements.tplEditId.value.trim()) || "";

  if (!name) {
    showToast("Please enter a template name.", "warning");
    if (elements.tplEditName) elements.tplEditName.focus();
    return;
  }

  if (!subject) {
    showToast("Please enter an email subject line.", "warning");
    if (elements.tplEditSubject) elements.tplEditSubject.focus();
    return;
  }

  if (!body) {
    showToast("Please enter the email template body content.", "warning");
    if (elements.tplEditBody) elements.tplEditBody.focus();
    return;
  }

  let savedTplId = id;
  if (id && state.templates[id]) {
    // Update existing template
    state.templates[id] = { name, desc, subject, body };
    if (currentTemplateId === id) {
      applyTemplate(id);
    }
    showToast(`Template "${name}" updated successfully!`, "success");
  } else {
    // Create new template
    const newId = "custom_" + Date.now();
    savedTplId = newId;
    state.templates[newId] = { name, desc, subject, body };
    showToast(`Created new template: "${name}"`, "success");
  }

  saveState();
  closeTemplateModal();
  renderTemplatesGrid();

  // Persist template to database for multi-device sync
  const authToken = localStorage.getItem("easyinvite_auth_token");
  if (authToken) {
    fetch("/api/user/templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        id: savedTplId,
        name,
        desc,
        subject,
        body
      })
    }).catch(err => console.warn("Template cloud sync notice:", err));
  }
}

function handleDeleteTemplate(key) {
  const tpl = state.templates[key];
  if (!tpl) return;

  if (!confirm(`Are you sure you want to delete the template "${tpl.name}"?`)) {
    return;
  }

  delete state.templates[key];

  if (currentTemplateId === key) {
    const remainingKeys = Object.keys(state.templates);
    currentTemplateId = remainingKeys.length > 0 ? remainingKeys[0] : "";
    if (currentTemplateId) {
      applyTemplate(currentTemplateId, true);
    }
  }

  saveState();
  renderTemplatesGrid();

  const authToken = localStorage.getItem("easyinvite_auth_token");
  if (authToken) {
    fetch(`/api/user/templates/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${authToken}` }
    }).catch(err => console.warn("Template cloud delete notice:", err));
  }

  showToast(`Deleted template "${tpl.name}"`, "info");
}

// ==========================================================================
// Settings View
// ==========================================================================
// ==========================================================================
// SMTP UI Status Synchronizer
// ==========================================================================
function updateSmtpUI(isOnline, customStatusText) {
  state.smtpOnline = !!isOnline;

  // 1. Send Invitation bottom badge
  if (elements.invitationSmtpBadge) {
    elements.invitationSmtpBadge.classList.toggle("online", state.smtpOnline);
    elements.invitationSmtpBadge.classList.toggle("offline", !state.smtpOnline);
  }
  if (elements.invitationSmtpDot) {
    elements.invitationSmtpDot.classList.toggle("online", state.smtpOnline);
    elements.invitationSmtpDot.classList.toggle("offline", !state.smtpOnline);
  }
  if (elements.invitationSmtpText) {
    elements.invitationSmtpText.textContent = state.smtpOnline ? "SMTP: Online (Live)" : "SMTP: Offline (Paused)";
  }

  // 2. Sidebar live badge
  if (elements.sidebarSmtpDot) {
    elements.sidebarSmtpDot.classList.toggle("online", state.smtpOnline);
    elements.sidebarSmtpDot.classList.toggle("offline", !state.smtpOnline);
  }
  if (elements.sidebarSmtpLabel) {
    elements.sidebarSmtpLabel.textContent = state.smtpOnline ? "SMTP: Online" : "SMTP: Offline";
  }

  // 3. Settings view controls
  if (elements.btnStatusOnline) {
    elements.btnStatusOnline.classList.toggle("active", state.smtpOnline);
  }
  if (elements.btnStatusOffline) {
    elements.btnStatusOffline.classList.toggle("active", !state.smtpOnline);
  }
  if (elements.settingSmtpStatusPill) {
    elements.settingSmtpStatusPill.classList.toggle("online", state.smtpOnline);
    elements.settingSmtpStatusPill.classList.toggle("offline", !state.smtpOnline);
  }
  if (elements.settingStatusText) {
    elements.settingStatusText.textContent = customStatusText || (state.smtpOnline ? "Online (Live)" : "Offline (Paused)");
  }
  if (elements.smtpStatusDescription) {
    elements.smtpStatusDescription.innerHTML = state.smtpOnline
      ? "<strong>Real &amp; Live</strong>: Invitations are sent directly to real recipients via your Gmail account."
      : "<strong>Offline (Paused)</strong>: Outgoing email dispatch is paused. Toggle to Online to resume sending live invitations.";
  }
}

async function loadServerEnvConfig() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return;
    const config = await res.json();
    if (!config || !config.success) return;

    let updated = false;

    if (!state.senderEmail && config.senderEmail) {
      state.senderEmail = config.senderEmail;
      updated = true;
    }
    if (!state.appPassword && config.appPassword) {
      state.appPassword = config.appPassword;
      updated = true;
    }
    if (!state.senderName && config.senderName) {
      state.senderName = config.senderName;
      state._senderNameFromEnv = true; // Track that this came from .env
      updated = true;
    }
    if (!state.appName && config.appName) {
      state.appName = config.appName;
      updated = true;
    }
    if (!state.packageName && config.packageId) {
      state.packageName = config.packageId;
      updated = true;
    }
    if (!state.playStoreLink && config.testingUrl) {
      state.playStoreLink = config.testingUrl;
      updated = true;
    }
    if (!state.directPlayLink && config.directUrl) {
      state.directPlayLink = config.directUrl;
      updated = true;
    }

    if (updated) {
      saveState();
      loadSettingsIntoFields();
      updatePlayConfigStatus();
      updateAppIdBadge();
      applyTemplate(currentTemplateId, true); // silent — user didn't pick a template
    }
  } catch (err) {
    console.log("Could not load server .env configuration:", err);
  }
}

function loadSettingsIntoFields() {
  if (elements.settingAppName) elements.settingAppName.value = state.appName || "";
  if (elements.settingPackageId) elements.settingPackageId.value = state.packageName || "";
  if (elements.settingTestingUrl) elements.settingTestingUrl.value = state.playStoreLink || "";
  if (elements.settingDirectUrl) elements.settingDirectUrl.value = state.directPlayLink || "";
  if (elements.settingSenderName) elements.settingSenderName.value = state.senderName || "";
  if (elements.settingSenderEmail) elements.settingSenderEmail.value = state.senderEmail || "";
  if (elements.settingAppPassword) elements.settingAppPassword.value = state.appPassword || "";

  // Show env-source badge if sender name came from .env
  if (elements.senderNameSourceHint) {
    if (state._senderNameFromEnv && state.senderName) {
      elements.senderNameSourceHint.innerHTML = `<span class="env-source-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>from .env</span>`;
    } else {
      elements.senderNameSourceHint.innerHTML = "";
    }
  }

  // Clear any validation error styling when loading fresh
  if (elements.settingSenderName) elements.settingSenderName.classList.remove("form-control--error");
  if (elements.senderNameError) elements.senderNameError.classList.remove("visible");

  updatePlayConfigStatus();
  updateSmtpUI(state.smtpOnline);
}

function clearSenderNameError() {
  if (elements.settingSenderName) elements.settingSenderName.classList.remove("form-control--error");
  if (elements.senderNameError) elements.senderNameError.classList.remove("visible");
}

function showSenderNameError() {
  if (elements.settingSenderName) {
    elements.settingSenderName.classList.add("form-control--error");
    elements.settingSenderName.focus();
  }
  if (elements.senderNameError) elements.senderNameError.classList.add("visible");
}


function handleSaveSettings() {
  if (elements.settingAppName) state.appName = elements.settingAppName.value.trim();
  if (elements.settingPackageId) state.packageName = elements.settingPackageId.value.trim();
  if (elements.settingTestingUrl) state.playStoreLink = elements.settingTestingUrl.value.trim();
  if (elements.settingDirectUrl) state.directPlayLink = elements.settingDirectUrl.value.trim();

  // Validate sender name — it is required
  const newSenderName = elements.settingSenderName ? elements.settingSenderName.value.trim() : "";
  if (!newSenderName) {
    showSenderNameError();
    showToast("Sender Name is required. Testers need to know who the email is from.", "error");
    return;
  }
  clearSenderNameError();

  // If user typed a different name, it's no longer exclusively from .env
  if (newSenderName !== state.senderName) {
    state._senderNameFromEnv = false;
  }
  state.senderName = newSenderName;

  if (elements.settingSenderEmail) state.senderEmail = elements.settingSenderEmail.value.trim();
  if (elements.settingAppPassword) state.appPassword = elements.settingAppPassword.value.trim();

  saveState();
  loadSettingsIntoFields(); // Re-render to update badge state
  updatePlayConfigStatus();
  updateSmtpUI(state.smtpOnline);
  applyTemplate(currentTemplateId, true); // silent — settings save has its own toast

  // Persist settings to user account in database
  const authToken = localStorage.getItem("easyinvite_auth_token");
  if (authToken) {
    fetch("/api/user/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        appName: state.appName,
        packageId: state.packageName,
        testingUrl: state.playStoreLink,
        directUrl: state.directPlayLink,
        senderName: state.senderName,
        senderEmail: state.senderEmail,
        appPassword: state.appPassword,
        smtpOnline: state.smtpOnline
      })
    }).catch(err => console.warn("Could not sync settings to server:", err));
  }

  showToast("All settings successfully saved!", "success");
}

async function handleTestSmtpConnection() {
  const senderEmail = (elements.settingSenderEmail && elements.settingSenderEmail.value.trim()) || state.senderEmail;
  const appPassword = (elements.settingAppPassword && elements.settingAppPassword.value.trim()) || state.appPassword;

  if (!senderEmail) {
    showToast("Please enter your Gmail address in the field above to test!", "info");
    if (elements.settingSenderEmail) elements.settingSenderEmail.focus();
    return;
  }

  const originalContent = elements.btnTestSmtp.innerHTML;
  elements.btnTestSmtp.disabled = true;
  elements.btnTestSmtp.innerHTML = `
    <svg class="spin-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
    Verifying Connection...
  `;

  try {
    const res = await fetch("/api/verify-smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderEmail, appPassword })
    });
    const data = await res.json();
    if (data.success) {
      state.senderEmail = senderEmail;
      state.appPassword = appPassword;
      state.smtpVerified = true;
      updateSmtpUI(true, "Verified Online");
      saveState();
      showToast(data.message || "Connected to Gmail SMTP! Status is now Online.", "success");
    } else {
      updateSmtpUI(false, "Offline (Auth Failed)");
      saveState();
      showToast(data.error || "Gmail verification failed. Check email or password.", "error");
    }
  } catch (err) {
    console.error("Test connection error:", err);
    updateSmtpUI(false, "Offline (Network Error)");
    showToast(`Connection error: ${err.message}`, "error");
  } finally {
    elements.btnTestSmtp.disabled = false;
    elements.btnTestSmtp.innerHTML = originalContent;
  }
}

// ==========================================================================
// Email Preview Modal Logic
// ==========================================================================
function openEmailPreviewModal() {
  if (!elements.emailPreviewModal) return;

  const recipientSample = state.recipients.length > 0 ? state.recipients[0] : "tester@example.com";
  const recipientCount = state.recipients.length;

  const appNameVal = getResolvedAppName();
  const senderNameVal = getResolvedSenderName() || "the developer";
  const testingPlaceholder = state.playStoreLink || "{{link}}";
  const directPlaceholder = state.directPlayLink || "{{direct_link}}";

  if (elements.previewFrom) {
    elements.previewFrom.textContent = senderNameVal
      ? `${senderNameVal} <${state.senderEmail || "you@gmail.com"}>`
      : `<${state.senderEmail || "you@gmail.com"}>`;
  }

  if (elements.previewTo) {
    elements.previewTo.textContent = recipientCount > 1
      ? `${recipientSample} (+${recipientCount - 1} more)`
      : recipientSample;
  }

  const rawSubject = (elements.emailSubject && elements.emailSubject.value) || "You're invited to test our app";
  const resolvedSubject = rawSubject
    .replaceAll("[App Name]", appNameVal).replaceAll("{{app_name}}", appNameVal)
    .replaceAll("[Your Name]", senderNameVal).replaceAll("{{sender_name}}", senderNameVal);

  if (elements.previewSubject) {
    elements.previewSubject.textContent = resolvedSubject;
  }

  // Build the email body with all placeholders resolved
  const rawBody = elements.messageEditor ? elements.messageEditor.innerHTML : "";
  const resolvedBody = rawBody
    .replaceAll("{{app_name}}", appNameVal).replaceAll("[App Name]", appNameVal)
    .replaceAll("{{sender_name}}", senderNameVal).replaceAll("[Your Name]", senderNameVal)
    .replaceAll("{{link}}", testingPlaceholder).replaceAll("[Google Play Testing Link]", testingPlaceholder)
    .replaceAll("{{direct_link}}", directPlaceholder);

  // Render in iframe with the same CSS used in the actual sent email
  if (elements.previewContentArea) {
    // Use an iframe so styles are isolated and match actual email
    elements.previewContentArea.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:100%;border:none;display:block;min-height:400px;background:#f1f5f9;border-radius:8px;";
    iframe.scrolling = "no";
    elements.previewContentArea.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const emailHtml = buildEmailPreviewHtml(resolvedBody, resolvedSubject, senderNameVal);
    iframeDoc.open();
    iframeDoc.write(emailHtml);
    iframeDoc.close();

    // Auto-resize iframe to content height
    iframe.onload = () => {
      try {
        iframe.style.height = iframe.contentDocument.body.scrollHeight + 40 + "px";
      } catch(e) {}
    };
    // Fallback resize after render
    setTimeout(() => {
      try { iframe.style.height = iframe.contentDocument.body.scrollHeight + 40 + "px"; } catch(e) {}
    }, 150);
  }

  elements.emailPreviewModal.style.display = "flex";
}

/** Builds the same HTML email shell used by the server for actual sending */
function buildEmailPreviewHtml(bodyHtml, subject, senderName) {
  const escHtml = (s) => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escHtml(subject)}</title>
<style>
  body,html{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
  *{box-sizing:border-box;}
  table{border-collapse:collapse;}
  p{margin:0 0 16px 0;line-height:1.65;}
  ol,ul{margin:8px 0 16px 0;padding-left:20px;line-height:1.7;}
  li{margin-bottom:6px;}
  a{color:#2563eb;}
  strong{font-weight:700;}
  .btn-cta a{display:inline-block;background-color:#2563eb;color:#ffffff!important;border:2px solid #2563eb;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.4px;padding:13px 28px;text-decoration:none!important;text-transform:uppercase;line-height:1;white-space:nowrap;}
  .btn-cta-green a{display:inline-block;background-color:#16a34a;color:#ffffff!important;border:2px solid #16a34a;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.4px;padding:13px 28px;text-decoration:none!important;text-transform:uppercase;line-height:1;white-space:nowrap;}
  .editor-link{color:#2563eb!important;word-break:break-all;}
</style>
</head>
<body style="margin:0;padding:36px 16px;background:#f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr><td align="center">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
             style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.08),0 1px 4px rgba(15,23,42,.04);">
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%);height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 40px 28px;font-size:15px;line-height:1.65;color:#1e293b;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;line-height:1.55;">
            You received this invitation from <strong style="color:#475569;">${escHtml(senderName)}</strong> to participate in official closed testing on Google Play. You were invited using your Google account.
          </p>
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
            If you did not expect this invitation, you can safely ignore this email. You will not be enrolled unless you click the join link and follow the steps.
          </p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
        <tr>
          <td style="padding: 16px 8px 8px 8px; text-align: center; font-size: 11px; color: #94a3b8;">
            Sent via <a href="https://github.com" style="color: #94a3b8; text-decoration: none;">EasyInvite</a> &middot; Google Play Closed Testing Outreach
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}


function closeEmailPreviewModal() {
  if (elements.emailPreviewModal) {
    elements.emailPreviewModal.style.display = "none";
  }
}

// ==========================================================================
// Google Play Configuration & App Link Shortcuts Logic
// ==========================================================================

let savedEditorRange = null;

function saveEditorSelection() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (elements.messageEditor && elements.messageEditor.contains(range.commonAncestorContainer)) {
      savedEditorRange = range.cloneRange();
    }
  }
}

function restoreEditorSelection() {
  if (savedEditorRange && elements.messageEditor) {
    elements.messageEditor.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedEditorRange);
  }
}

function insertHtmlAtCaret(html) {
  if (!elements.messageEditor) return;
  restoreEditorSelection();
  elements.messageEditor.focus();

  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (elements.messageEditor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      const el = document.createElement("div");
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node, lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      saveEditorSelection();
      return;
    }
  }

  // Fallback if caret is outside messageEditor
  if (document.queryCommandSupported("insertHTML")) {
    document.execCommand("insertHTML", false, html);
  } else {
    elements.messageEditor.innerHTML += html;
  }
  saveEditorSelection();
}

function updatePlayConfigStatus() {
  const appName = (elements.settingAppName && elements.settingAppName.value.trim()) || state.appName || "";
  const pkg = (elements.settingPackageId && elements.settingPackageId.value.trim()) || state.packageName || "";
  const testingUrl = (elements.settingTestingUrl && elements.settingTestingUrl.value.trim()) || state.playStoreLink || "";
  const directUrl = (elements.settingDirectUrl && elements.settingDirectUrl.value.trim()) || state.directPlayLink || "";
  const isConfigured = !!pkg || !!testingUrl || !!directUrl || !!appName;

  // Status pill in Settings Card
  if (elements.playConfigStatusPill) {
    elements.playConfigStatusPill.classList.toggle("configured", isConfigured);
  }
  if (elements.playConfigStatusText) {
    elements.playConfigStatusText.textContent = isConfigured 
      ? (appName ? `Configured: ${appName}` : (pkg ? `Configured: ${pkg}` : "Configured"))
      : "Not Configured";
  }

  // App ID badge in Editor Header
  if (elements.editorAppIdBadge) {
    elements.editorAppIdBadge.classList.toggle("configured", isConfigured);
  }
  if (elements.editorAppIdText) {
    elements.editorAppIdText.textContent = isConfigured 
      ? (appName ? `App: ${appName}` : (pkg ? `App: ${pkg}` : "App: Configured"))
      : "App: Not Set";
  }

  // Test Link Action anchors in Settings
  if (elements.linkTestClosedUrl) {
    if (testingUrl && testingUrl.startsWith("http")) {
      elements.linkTestClosedUrl.href = testingUrl;
      elements.linkTestClosedUrl.style.display = "inline-flex";
    } else {
      elements.linkTestClosedUrl.style.display = "none";
    }
  }

  if (elements.linkTestDirectUrl) {
    if (directUrl && directUrl.startsWith("http")) {
      elements.linkTestDirectUrl.href = directUrl;
      elements.linkTestDirectUrl.style.display = "inline-flex";
    } else {
      elements.linkTestDirectUrl.style.display = "none";
    }
  }

  updateAppLinkDropdownPreviews();
}

function updateAppLinkDropdownPreviews() {
  const appName = (elements.settingAppName && elements.settingAppName.value.trim()) || state.appName || "";
  const pkg = state.packageName || (elements.settingPackageId && elements.settingPackageId.value.trim()) || "";
  const testingUrl = state.playStoreLink || (elements.settingTestingUrl && elements.settingTestingUrl.value.trim()) || "";
  const directUrl = state.directPlayLink || (elements.settingDirectUrl && elements.settingDirectUrl.value.trim()) || "";

  if (elements.menuHeaderAppId) {
    elements.menuHeaderAppId.textContent = appName ? `${appName} (${pkg || "No ID"})` : (pkg || "No App Configured");
  }
  if (elements.optTestingUrlPreview) {
    elements.optTestingUrlPreview.textContent = testingUrl || "(Not configured in Settings)";
  }
  if (elements.optDirectUrlPreview) {
    elements.optDirectUrlPreview.textContent = directUrl || "(Not configured in Settings)";
  }
}

function handlePackageIdInput() {
  const pkg = (elements.settingPackageId && elements.settingPackageId.value.trim()) || "";
  if (pkg) {
    // If App Name is empty, suggest a clean title-cased name
    if (elements.settingAppName && !elements.settingAppName.value.trim()) {
      elements.settingAppName.value = formatAppNameFromPackage(pkg);
    }

    const currentTesting = (elements.settingTestingUrl && elements.settingTestingUrl.value.trim()) || "";
    if (!currentTesting || currentTesting.includes("play.google.com/apps/testing/")) {
      elements.settingTestingUrl.value = `https://play.google.com/apps/testing/${pkg}`;
    }
    const currentDirect = (elements.settingDirectUrl && elements.settingDirectUrl.value.trim()) || "";
    if (!currentDirect || currentDirect.includes("play.google.com/store/apps/details?id=")) {
      elements.settingDirectUrl.value = `https://play.google.com/store/apps/details?id=${pkg}`;
    }
  }
  updatePlayConfigStatus();
}

function handleAutoGenerateUrls() {
  const pkg = (elements.settingPackageId && elements.settingPackageId.value.trim()) || "";
  if (!pkg) {
    showToast("Please enter an Application Package ID first (e.g. com.company.app)", "info");
    if (elements.settingPackageId) elements.settingPackageId.focus();
    return;
  }
  if (elements.settingAppName && !elements.settingAppName.value.trim()) {
    elements.settingAppName.value = formatAppNameFromPackage(pkg);
  }
  if (elements.settingTestingUrl) {
    elements.settingTestingUrl.value = `https://play.google.com/apps/testing/${pkg}`;
  }
  if (elements.settingDirectUrl) {
    elements.settingDirectUrl.value = `https://play.google.com/store/apps/details?id=${pkg}`;
  }
  updatePlayConfigStatus();
  showToast(`Auto-generated Google Play URLs for "${pkg}"!`, "success");
}

function handleSavePlayConfig() {
  const appName = (elements.settingAppName && elements.settingAppName.value.trim()) || "";
  const pkg = (elements.settingPackageId && elements.settingPackageId.value.trim()) || "";
  const testingUrl = (elements.settingTestingUrl && elements.settingTestingUrl.value.trim()) || "";
  const directUrl = (elements.settingDirectUrl && elements.settingDirectUrl.value.trim()) || "";

  state.appName = appName;
  state.packageName = pkg;
  state.playStoreLink = testingUrl;
  state.directPlayLink = directUrl;

  saveState();
  updatePlayConfigStatus();
  applyTemplate(currentTemplateId, true); // silent — Play config save has its own flow

  const authToken = localStorage.getItem("easyinvite_auth_token");
  if (authToken) {
    fetch("/api/user/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        appName: state.appName,
        packageId: state.packageName,
        testingUrl: state.playStoreLink,
        directUrl: state.directPlayLink,
        senderName: state.senderName,
        senderEmail: state.senderEmail,
        appPassword: state.appPassword,
        smtpOnline: state.smtpOnline
      })
    }).catch(err => console.warn("Could not sync app config to server:", err));
  }

  if (elements.previewCtaButton) {
    elements.previewCtaButton.href = state.playStoreLink || "#";
  }
  if (elements.previewCtaTesting) {
    elements.previewCtaTesting.href = state.playStoreLink || "#";
  }
  if (elements.previewCtaDirect) {
    elements.previewCtaDirect.href = state.directPlayLink || "#";
  }

  showToast(appName ? `Google Play configuration saved for ${appName}!` : (pkg ? `Google Play configuration saved for ${pkg}!` : "Google Play configuration saved!"), "success");
}

function handleClearPlayConfig() {
  if (elements.settingAppName) elements.settingAppName.value = "";
  if (elements.settingPackageId) elements.settingPackageId.value = "";
  if (elements.settingTestingUrl) elements.settingTestingUrl.value = "";
  if (elements.settingDirectUrl) elements.settingDirectUrl.value = "";

  state.appName = "";
  state.packageName = "";
  state.playStoreLink = "";
  state.directPlayLink = "";

  saveState();
  updatePlayConfigStatus();

  if (elements.previewCtaButton) {
    elements.previewCtaButton.href = "#";
  }
  if (elements.previewCtaTesting) {
    elements.previewCtaTesting.href = "#";
  }
  if (elements.previewCtaDirect) {
    elements.previewCtaDirect.href = "#";
  }
  showToast("Google Play configuration cleared.", "info");
}

function toggleAppLinkMenu() {
  if (!elements.appLinkMenu) return;
  const isVisible = elements.appLinkMenu.style.display === "block";
  if (isVisible) {
    closeAppLinkMenu();
  } else {
    updateAppLinkDropdownPreviews();
    elements.appLinkMenu.style.display = "block";
    if (elements.appLinkDropdownWrap) elements.appLinkDropdownWrap.classList.add("open");
  }
}

function closeAppLinkMenu() {
  if (elements.appLinkMenu) elements.appLinkMenu.style.display = "none";
  if (elements.appLinkDropdownWrap) elements.appLinkDropdownWrap.classList.remove("open");
}

function insertTestingLinkShortcut() {
  const link = state.playStoreLink || (elements.settingTestingUrl && elements.settingTestingUrl.value.trim());
  if (!link) {
    showToast("Closed Testing URL is not set in Settings! Redirecting to Settings...", "warning");
    switchView("settings");
    if (elements.settingPackageId) elements.settingPackageId.focus();
    closeAppLinkMenu();
    return;
  }
  const html = `<p><a href="${escapeHtml(link)}" class="editor-link" target="_blank">${escapeHtml(link)}</a></p>`;
  insertHtmlAtCaret(html);
  closeAppLinkMenu();
  showToast("Inserted Closed Testing Link from Settings", "info");
}

function insertDirectLinkShortcut() {
  const link = state.directPlayLink || (elements.settingDirectUrl && elements.settingDirectUrl.value.trim());
  if (!link) {
    showToast("Play Store Direct Listing Link is not set in Settings! Redirecting to Settings...", "warning");
    switchView("settings");
    if (elements.settingDirectUrl) elements.settingDirectUrl.focus();
    closeAppLinkMenu();
    return;
  }
  const html = `<p><a href="${escapeHtml(link)}" class="editor-link" target="_blank">${escapeHtml(link)}</a></p>`;
  insertHtmlAtCaret(html);
  closeAppLinkMenu();
  showToast("Inserted Play Store Direct Link from Settings", "info");
}

function insertCtaButtonShortcut() {
  const link = state.playStoreLink || (elements.settingTestingUrl && elements.settingTestingUrl.value.trim());
  if (!link) {
    showToast("Closed Testing Track URL is not set in Settings! Redirecting to Settings...", "warning");
    switchView("settings");
    if (elements.settingPackageId) elements.settingPackageId.focus();
    closeAppLinkMenu();
    return;
  }
  const buttonHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 14px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: #2563eb; text-align: center;">
          <a href="${escapeHtml(link)}" target="_blank" style="background-color: #2563eb; border: 1px solid #2563eb; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 13px; font-weight: 700; padding: 11px 22px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">1. JOIN AS A TESTER &rarr;</a>
        </td>
      </tr>
    </table>
  `;
  insertHtmlAtCaret(buttonHtml);
  closeAppLinkMenu();
  showToast("Inserted &ldquo;1. Join as a Tester&rdquo; Button", "info");
}

function insertStoreButtonShortcut() {
  const link = state.directPlayLink || (elements.settingDirectUrl && elements.settingDirectUrl.value.trim());
  if (!link) {
    showToast("Play Store Direct Listing Link is not set in Settings! Redirecting to Settings...", "warning");
    switchView("settings");
    if (elements.settingDirectUrl) elements.settingDirectUrl.focus();
    closeAppLinkMenu();
    return;
  }
  const buttonHtml = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 14px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: #059669; text-align: center;">
          <a href="${escapeHtml(link)}" target="_blank" style="background-color: #059669; border: 1px solid #059669; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 13px; font-weight: 700; padding: 11px 22px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">2. DOWNLOAD ON PLAY STORE &rarr;</a>
        </td>
      </tr>
    </table>
  `;
  insertHtmlAtCaret(buttonHtml);
  closeAppLinkMenu();
  showToast("Inserted &ldquo;2. Download on Play Store&rdquo; Button", "info");
}

function insertBothLinksShortcut() {
  const testingUrl = state.playStoreLink || (elements.settingTestingUrl && elements.settingTestingUrl.value.trim());
  const directUrl = state.directPlayLink || (elements.settingDirectUrl && elements.settingDirectUrl.value.trim());

  if (!testingUrl && !directUrl) {
    showToast("Google Play links are not configured in Settings! Redirecting to Settings...", "warning");
    switchView("settings");
    if (elements.settingPackageId) elements.settingPackageId.focus();
    closeAppLinkMenu();
    return;
  }

  const bothHtml = `
    <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 6px; font-family: inherit;">
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe; margin-bottom: 6px; text-transform: uppercase;">Step 1 (Required First)</span>
        <p style="margin: 2px 0 6px 0; font-size: 14px; font-weight: 600; color: #1e293b;">Join the Closed Testing Track:</p>
        <p style="margin: 0; font-size: 13px;"><a href="${escapeHtml(testingUrl || '#')}" class="editor-link" target="_blank">${escapeHtml(testingUrl || 'Link pending in Settings')}</a></p>
      </div>
      <div>
        <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0; margin-bottom: 6px; text-transform: uppercase;">Step 2 (After Joining)</span>
        <p style="margin: 2px 0 6px 0; font-size: 14px; font-weight: 600; color: #1e293b;">Download from Google Play Store:</p>
        <p style="margin: 0; font-size: 13px;"><a href="${escapeHtml(directUrl || '#')}" class="editor-link" target="_blank">${escapeHtml(directUrl || 'Link pending in Settings')}</a></p>
      </div>
    </div>
  `;
  insertHtmlAtCaret(bothHtml);
  closeAppLinkMenu();
  showToast("Inserted 2-Step Tester Flow Block", "info");
}

// ==========================================================================
// Helper Utilities
// ==========================================================================
function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const text = event.target.result;
    const extractedEmails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];

    if (extractedEmails.length > 0) {
      let added = 0;
      extractedEmails.forEach(email => {
        const clean = email.toLowerCase();
        if (!state.recipients.includes(clean)) {
          state.recipients.push(clean);
          added++;
        }
      });
      saveState();
      renderRecipients();
      showToast(`Imported ${added} new emails from file!`, "success");
    } else {
      showToast("No valid email addresses found in file.", "info");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function showToast(message, type = "info") {
  if (!elements.toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = type === "success" 
    ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
    : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;

  toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
