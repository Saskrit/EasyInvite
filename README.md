<div align="center">

# 🚀 EasyInvite

### Google Play Closed Testing Outreach & Invitation Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Gmail SMTP](https://img.shields.io/badge/SMTP-Gmail%20Live-red.svg)](https://myaccount.google.com/apppasswords)
[![Google Play](https://img.shields.io/badge/Google%20Play-Closed%20Testing-4285f4.svg)](https://play.google.com/console)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](Dockerfile)

A modern, high-deliverability outreach platform designed specifically for Android developers running **Google Play Closed Testing** tracks (20-tester requirement).

Easily invite testers with a proven **2-Step Action Flow**, prevent emails from landing in spam, and track dispatch status directly through your own Gmail SMTP account.

---

### ⚡ One-Click Cloud Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSaskrit%2FEasyInvite&env=SMTP_EMAIL,SMTP_APP_PASSWORD,SENDER_NAME,APP_NAME,APP_PACKAGE_ID,CLOSED_TESTING_URL,PLAY_STORE_URL)
&nbsp;&nbsp;
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Saskrit/EasyInvite)
&nbsp;&nbsp;
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Saskrit/EasyInvite)

---

</div>

## ✨ Key Features

- **📱 Modern 2-Step Tester Onboarding**:
  Generates clear dual-CTA emails:
  1. **Step 1 (Join Track)**: Direct link to `play.google.com/apps/testing/<package>` to opt in as a tester.
  2. **Step 2 (Download App)**: Direct link to `play.google.com/store/apps/details?id=<package>` to install from the Play Store.

- **🛡️ 100% Inbox Placement Architecture**:
  - **Authenticated Gmail SMTP**: Every email is cryptographically signed by Google's genuine DKIM (`d=gmail.com`) and SPF.
  - **Synchronous Multipart MIME**: Automatically pairs styled HTML with a clean plain-text alternative, eliminating the `MIME_HTML_ONLY` spam penalty.
  - **1-on-1 Direct Dispatch**: Dispatches individual personal emails with `Precedence: personal` headers — zero CC/BCC bulk disclosure.
  - **Anti-Burst Staggering**: 350ms throttle delay between dispatches prevents Gmail's heuristic burst triggers.
  - **CAN-SPAM Compliant**: Standard opt-out footer ensures maximum provider trust.

- **👥 Fast Recipient Management**:
  - Add single emails with auto-validation.
  - One-click **Import CSV / TXT** support.
  - Switch between interactive **Chip View** and **Raw Multiline Paste**.

- **📝 Rich Template Manager**:
  - Built-in templates: *Early Tester Invitation*, *Short & Casual*, *Detailed Checklist*, and *Thank You Follow-up*.
  - Full WYSIWYG editor with live bold/italic shortcuts, token insertion (`{{link}}`, `{{direct_link}}`, `{{app_name}}`), and custom template creation.
  - Client-side persistence via `localStorage` with versioned migration.

- **👁️ True Pixel-Perfect Email Client Preview**:
  Preview modal isolates the email within a sandboxed iframe using the exact same HTML/CSS container sent to recipients.

- **⚙️ Dual Configuration Model**:
  Set defaults permanently via `.env` file or adjust on the fly in the browser via the **Settings** panel.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- A Gmail account with 2-Step Verification enabled

### 1. Clone the repository
```bash
git clone https://github.com/Saskrit/EasyInvite.git
cd EasyInvite
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the template file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your details:
```ini
PORT=3000

# Your Gmail address and 16-character Google App Password
SMTP_EMAIL=yourname@gmail.com
SMTP_APP_PASSWORD=xxxx xxxx xxxx xxxx
SENDER_NAME=Your Name

# Google Play Configuration
APP_NAME=My App
APP_PACKAGE_ID=com.example.myapp
CLOSED_TESTING_URL=https://play.google.com/apps/testing/com.example.myapp
PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.example.myapp
```

### 4. Start the application
```bash
npm start
```
Visit **`http://localhost:3000`** in your browser.

---

## 🔑 How to Get a Google App Password

Gmail requires an **App Password** for SMTP connections (your standard account password will not work):

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Go directly to **[App Passwords](https://myaccount.google.com/apppasswords)**.
4. Enter an app name (e.g. `EasyInvite`) and click **Create**.
5. Copy the generated **16-character password** (e.g. `abcd efgh ijkl mnop`).
6. Paste it into your `.env` as `SMTP_APP_PASSWORD` (or configure it in the in-app **Settings** tab).

---

## 🌐 Online & Cloud Deployment

EasyInvite is engineered with a zero-dependency lightweight backend (`http` + `nodemailer` + `dotenv`) and runs seamlessly on any cloud host.

### Option A: Deploy to Vercel (Fastest & 100% Serverless)
1. Push your repository to GitHub.
2. Click the **Deploy with Vercel** button above (or import your repo in the [Vercel Dashboard](https://vercel.com/new)).
3. Vercel automatically detects `vercel.json`, hosting static pages on edge CDN and running `/api/*` on zero-cold-start Serverless Functions.
4. *(Optional)* Add your environment variables (`SMTP_EMAIL`, `SMTP_APP_PASSWORD`, etc.) in the Vercel Dashboard under **Project Settings → Environment Variables**.
   *(Note: You can also configure credentials on the fly directly inside the web app in Settings!)*
5. Click **Deploy**. Your app is live with a global SSL domain!

### Option B: Deploy to Render
1. Fork or push this repository to your GitHub account.
2. Click the **Deploy to Render** button above, or create a new **Web Service** on [Render.com](https://render.com).
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Fill in your environment variables (`SMTP_EMAIL`, `SMTP_APP_PASSWORD`, `APP_NAME`, etc.).
5. Click **Create Web Service**. Your app will be live with a free SSL domain!

### Option C: Deploy to Railway
1. Click the **Deploy on Railway** button above.
2. Link your GitHub account and select this repository.
3. Add your environment variables in the Railway dashboard.
4. Deploy! Railway will automatically build and assign a public URL.

### Option D: Run with Docker
```bash
# Build Docker image
docker build -t easyinvite .

# Run container with environment file
docker run -d -p 3000:3000 --env-file .env --name easyinvite-app easyinvite
```

---

## 📖 Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `3000` | Port for the HTTP server to listen on. |
| `SMTP_EMAIL` | **Yes** | — | Your Gmail address (e.g. `developer@gmail.com`). |
| `SMTP_APP_PASSWORD` | **Yes** | — | 16-character Google App Password. |
| `SENDER_NAME` | Optional | `Developer` | Display name shown to email recipients. |
| `APP_NAME` | Optional | — | Your Android application name (replaces `{{app_name}}`). |
| `APP_PACKAGE_ID` | Optional | — | Application package name (e.g. `com.company.app`). |
| `CLOSED_TESTING_URL` | Optional | — | Closed testing track join link (replaces `{{link}}`). |
| `PLAY_STORE_URL` | Optional | — | Direct Play Store download link (replaces `{{direct_link}}`). |

---

## 🔒 Security & Privacy

- **Never commit `.env`**: The `.gitignore` is pre-configured to strictly exclude all `.env*` files and secrets.
- **Client-Side Credential Isolation**: If you enter credentials via the browser Settings UI, they are stored locally in your browser's `localStorage` and sent over HTTPS solely when dispatching.
- **Zero Third-Party Relays**: Emails travel directly from your server to `smtp.gmail.com:465`. No third-party email brokers or analytical trackers are used.
- **Health Check Endpoint**: `/health` and `/api/health` provide sanitized uptime metrics for cloud monitors without exposing any sensitive details.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
