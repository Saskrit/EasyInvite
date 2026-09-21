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

// Application State Initializer
let state = loadState();

function loadState() {
  try {
    // Purge legacy mock data
    localStorage.removeItem("bakibook_tester_state");
    const saved = localStorage.getItem("easyinvite_state_v1");
    if (saved) {
      const parsed = JSON.parse(saved);
      const mergedTemplates = {
        ...DEFAULT_STATE.templates,
        ...(parsed.templates || {})
      };
      // Force-refresh built-in templates that don't have the new two-button layout
      const builtInKeys = ['default', 'casual', 'detailed', 'thankyou'];
      for (const key of builtInKeys) {
        if (mergedTemplates[key] && !mergedTemplates[key].body.includes('btn-cta-green')) {
          mergedTemplates[key] = DEFAULT_STATE.templates[key];
        }
      }
      return {
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
        templates: mergedTemplates
      };
    }
  } catch (e) {
    console.warn("Could not parse saved state:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try {
    localStorage.setItem("easyinvite_state_v1", JSON.stringify(state));
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

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderRecipients();
  renderTemplatesGrid();
  loadSettingsIntoFields();
  updatePlayConfigStatus();
  updateSmtpUI(state.smtpOnline);
  setupEventListeners();

  // Restore the last active view the user was on (persisted in sessionStorage)
  const savedView = sessionStorage.getItem("easyinvite_active_view") || "send-invitation";
  switchView(savedView);

  // Silently populate the editor with the current template — no toast on load
  applyTemplate(currentTemplateId, true);

  // Load any configured defaults or credentials from .env
  loadServerEnvConfig();
});

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Navigation tabs
  elements.navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetView = btn.getAttribute("data-view");
      if (targetView) switchView(targetView);
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

  if (!suppressToast) {
    showToast(`Applied template: "${template.name}"`, "info");
  }
}

function updateEditorWithTestingLink(newUrl) {
  applyTemplate(currentTemplateId);
}

// ==========================================================================
// Sending Invitations (Direct Real Gmail Dispatch or Simulator)
// ==========================================================================
async function handleSendInvitations() {
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

    const finalHtml = html
      .replaceAll("[App Name]", appNameVal)
      .replaceAll("{{app_name}}", appNameVal)
      .replaceAll("[Your Name]", senderNameVal)
      .replaceAll("{{sender_name}}", senderNameVal)
      .replaceAll("[Google Play Testing Link]", testingPlaceholder);

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    if (data.success) {
      updateSmtpUI(true, "Verified Online");
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
      applyTemplate(key);
      switchView("send-invitation");
      showToast(`Loaded template: "${t.name}" into editor`, "success");
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
    state.templates[newId] = { name, desc, subject, body };
    showToast(`Created new template: "${name}"`, "success");
  }

  saveState();
  closeTemplateModal();
  renderTemplatesGrid();
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
      applyTemplate(currentTemplateId);
    }
  }

  saveState();
  renderTemplatesGrid();
  showToast(`Template "${tpl.name}" deleted.`, "info");
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
      applyTemplate(currentTemplateId);
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
  applyTemplate(currentTemplateId);
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
            You received this invitation from <strong style="color:#475569;">${escHtml(senderName)}</strong> to participate in official closed testing on Google Play.
          </p>
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        </td></tr>
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
  applyTemplate(currentTemplateId);

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
    toast.style.transform = "translateX(40px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
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
