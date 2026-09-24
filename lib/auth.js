const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const neon = require('./neon');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'easyinvite_jwt_super_secure_secret_key_2026';

// In-memory rate limiter
const rateLimitMap = new Map();

function checkRateLimit(ip, endpoint, maxAttempts = 15, windowMs = 60000) {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(key, record);

  // Periodic cleanup
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k);
    }
  }

  return record.count <= maxAttempts;
}

// Password hashing
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// JWT Token generation
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Extract token from request
function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Cookie fallback
  const cookieHeader = req.headers.cookie || '';
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('easyinvite_token='));
    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split('=')[1]);
    }
  }

  return null;
}

// Authenticate request middleware (async — falls back to Neon on cold-start)
async function authenticate(req, res) {
  const token = extractToken(req);
  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Authentication required. Please log in.' }));
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Invalid or expired session. Please log in again.' }));
    return null;
  }

  // First try in-memory cache (fast path)
  let user = db.getUserById(decoded.id);

  // Fallback: on Vercel cold start the in-memory db may be empty.
  // Query Neon directly and rehydrate the cache.
  if (!user && process.env.DATABASE_URL) {
    try {
      const neonUser = await neon.getUserByIdFromNeon(decoded.id);
      if (neonUser) {
        // Merge the freshly-fetched user back into the in-memory store
        const existing = db.data.users.find(u => String(u.id) === String(neonUser.id));
        if (!existing) {
          db.data.users.push(neonUser);
        }
        user = db.getUserById(neonUser.id);
      }
    } catch (err) {
      console.warn('[Auth] Neon fallback lookup error:', err.message);
    }
  }

  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'User account not found.' }));
    return null;
  }

  req.user = user;
  return user;
}

// Require admin role middleware (async)
async function requireAdmin(req, res) {
  const user = await authenticate(req, res);
  if (!user) return null;

  if (user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Access denied: Admin privileges required.' }));
    return null;
  }

  return user;
}

// Generate 4-digit numeric verification code (1000 - 9999)
function generateVerificationCode() {
  return String(crypto.randomInt(1000, 10000));
}

// Generate random verification token (fallback compatibility)
function generateVerificationToken() {
  return generateVerificationCode();
}

// Helper to determine if an email should automatically receive the admin role
function isDesignatedAdmin(email) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const envAdmin = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const smtpEmail = (process.env.SMTP_EMAIL || '').trim().toLowerCase();

  return (
    cleanEmail === 'admin@easyinvite.com' ||
    (envAdmin && cleanEmail === envAdmin) ||
    (smtpEmail && cleanEmail === smtpEmail)
  );
}

// Seed default admin account if not already created
(async function seedDefaultAdmin() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@easyinvite.com').toLowerCase();
    let existing = db.getUserByEmail(adminEmail);
    if (!existing && process.env.DATABASE_URL) {
      existing = await neon.getUserByEmailFromNeon(adminEmail);
      if (existing) {
        const inMem = db.data.users.find(u => String(u.id) === String(existing.id));
        if (!inMem) db.data.users.push(existing);
      }
    }
    if (!existing) {
      const passwordHash = await hashPassword('Admin@12345');
      db.createUser({
        name: 'System Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        isVerified: 1
      });
      console.log(`[Auth] Seeded default administrator account: ${adminEmail} (password: Admin@12345)`);
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.is_verified = 1;
      db.save();
      neon.saveUser(existing).catch(() => {});
    }
  } catch (err) {
    console.warn('[Auth] Admin seeding notice:', err.message);
  }
})();

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractToken,
  authenticate,
  requireAdmin,
  generateVerificationToken,
  generateVerificationCode,
  checkRateLimit,
  isDesignatedAdmin
};
