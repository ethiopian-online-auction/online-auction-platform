/**
 * Fayda eSignet Controller
 * Handles: SSO login, KYC verification, seller identity verification
 */

const crypto = require('crypto');
const { query } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.util');
const { setEx, get, del } = require('../config/redis');
const faydaService = require('../services/fayda.service');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// ─── Helper: build redirect URI ───────────────────────────────────────────────
const getRedirectUri = () => `${BACKEND_URL}/api/auth/fayda/callback`;

// ─── 1. Initiate Fayda SSO Login ─────────────────────────────────────────────
const initiateLogin = async (req, res) => {
  try {
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    // Store state+nonce in Redis for 10 minutes to verify on callback
    await setEx(`fayda_state:${state}`, { nonce, purpose: 'login' }, 600);

    const authUrl = faydaService.buildAuthorizationUrl(
      getRedirectUri(), state, nonce, 'openid profile email phone'
    );

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Fayda initiate login error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate Fayda login' });
  }
};

// ─── 2. Initiate Fayda KYC (for existing logged-in users) ────────────────────
const initiateKYC = async (req, res) => {
  try {
    const { userId } = req.user;
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    await setEx(`fayda_state:${state}`, { nonce, purpose: 'kyc', userId }, 600);

    const authUrl = faydaService.buildAuthorizationUrl(
      getRedirectUri(), state, nonce, 'openid profile email phone'
    );

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Fayda initiate KYC error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate Fayda KYC' });
  }
};

// ─── 3. OAuth Callback (handles both login and KYC) ──────────────────────────
const handleCallback = async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${FRONTEND_URL}/auth/fayda-error?error=${oauthError}`);
    }

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/auth/fayda-error?error=missing_params`);
    }

    // Verify state
    const session = await get(`fayda_state:${state}`);
    if (!session) {
      return res.redirect(`${FRONTEND_URL}/auth/fayda-error?error=invalid_state`);
    }
    await del(`fayda_state:${state}`);

    // Exchange code for tokens
    const tokens = await faydaService.exchangeCodeForTokens(code, getRedirectUri());
    const idTokenPayload = faydaService.decodeIdToken(tokens.id_token);

    const faydaId = idTokenPayload.sub;
    const faydaName = idTokenPayload.name;
    const faydaEmail = idTokenPayload.email;
    const faydaPhone = idTokenPayload.phone_number;

    // ── KYC flow: link Fayda ID to existing user ──
    if (session.purpose === 'kyc' && session.userId) {
      await query(
        `UPDATE users SET fayda_id = $1, fayda_verified = true, fayda_verification_date = NOW() WHERE id = $2`,
        [faydaId, session.userId]
      );
      return res.redirect(`${FRONTEND_URL}/settings?fayda=verified`);
    }

    // ── Login/SSO flow ──
    // Check if user already linked this Fayda ID
    let userResult = await query(
      `SELECT id, name, email, phone, role, is_verified, is_blacklisted,
              subscription_plan, subscription_status, wallet_balance, fayda_verified
       FROM users WHERE fayda_id = $1`,
      [faydaId]
    );

    let user;

    if (userResult.rows.length > 0) {
      // Existing Fayda-linked user → log them in
      user = userResult.rows[0];
    } else if (faydaEmail) {
      // Check if email already registered → link accounts
      const emailResult = await query(
        `SELECT id, name, email, phone, role, is_verified, is_blacklisted,
                subscription_plan, subscription_status, wallet_balance
         FROM users WHERE email = $1`,
        [faydaEmail]
      );

      if (emailResult.rows.length > 0) {
        // Link Fayda ID to existing account
        await query(
          `UPDATE users SET fayda_id = $1, fayda_verified = true, fayda_verification_date = NOW() WHERE id = $2`,
          [faydaId, emailResult.rows[0].id]
        );
        user = { ...emailResult.rows[0], fayda_verified: true };
      } else {
        // New user — auto-register via Fayda
        const newUser = await query(
          `INSERT INTO users (name, email, phone, fayda_id, is_verified, fayda_verified, fayda_verification_date, role, subscription_plan, subscription_status)
           VALUES ($1, $2, $3, $4, true, true, NOW(), 'buyer', 'free', 'active')
           RETURNING id, name, email, phone, role, is_verified, subscription_plan, subscription_status, wallet_balance, fayda_verified`,
          [faydaName, faydaEmail, faydaPhone, faydaId]
        );
        user = newUser.rows[0];
      }
    } else {
      // No email from Fayda — create minimal account
      const newUser = await query(
        `INSERT INTO users (name, fayda_id, is_verified, fayda_verified, fayda_verification_date, role, subscription_plan, subscription_status)
         VALUES ($1, $2, true, true, NOW(), 'buyer', 'free', 'active')
         RETURNING id, name, email, phone, role, is_verified, subscription_plan, subscription_status, wallet_balance, fayda_verified`,
        [faydaName || 'Fayda User', faydaId]
      );
      user = newUser.rows[0];
    }

    if (user.is_blacklisted) {
      return res.redirect(`${FRONTEND_URL}/auth/fayda-error?error=account_suspended`);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await setEx(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    // Redirect to frontend with token
    res.redirect(
      `${FRONTEND_URL}/auth/fayda-success?token=${accessToken}&refresh=${refreshToken}&userId=${user.id}`
    );
  } catch (error) {
    console.error('Fayda callback error:', error);
    res.redirect(`${FRONTEND_URL}/auth/fayda-error?error=server_error`);
  }
};

// ─── 4. Mock Authorization Page (dev/demo only) ───────────────────────────────
const mockAuthorize = (req, res) => {
  const { state, nonce, redirect_uri, scope } = req.query;

  // Serve a simple HTML page to simulate Fayda login UI
  const mockUsers = Object.entries(faydaService.MOCK_USERS)
    .map(([id, u]) => `<option value="${id}">${u.name} (FIN: ${id})</option>`)
    .join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Fayda eSignet — Mock Login</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; background: #f0f4ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { background: white; border-radius: 16px; padding: 40px; width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #1a56db, #0ea5e9); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
        h1 { font-size: 22px; font-weight: 700; color: #1e293b; }
        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 28px; }
        .mock-badge { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; font-size: 12px; padding: 6px 12px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
        label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        select, input { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 16px; outline: none; }
        select:focus, input:focus { border-color: #1a56db; }
        .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #1a56db, #0ea5e9); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
        .btn:hover { opacity: 0.92; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <div class="logo-icon">🇪🇹</div>
          <div>
            <div style="font-weight:700;font-size:18px;color:#1e293b">Fayda eSignet</div>
            <div style="font-size:12px;color:#64748b">National ID Program — Ethiopia</div>
          </div>
        </div>
        <div class="mock-badge">⚠️ MOCK MODE — For development & demo only</div>
        <p class="subtitle">Select a test identity to simulate Fayda authentication</p>
        <form method="POST" action="/api/auth/fayda/mock-authorize">
          <input type="hidden" name="state" value="${state}" />
          <input type="hidden" name="nonce" value="${nonce}" />
          <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
          <input type="hidden" name="scope" value="${scope}" />
          <label>Select Test Identity (Fayda ID)</label>
          <select name="faydaId">${mockUsers}</select>
          <label>OTP Code (any 6 digits in mock mode)</label>
          <input type="text" name="otp" placeholder="e.g. 123456" maxlength="6" />
          <button type="submit" class="btn">Authenticate with Fayda</button>
        </form>
        <div class="footer">Powered by MOSIP eSignet • Ethiopia NIDP</div>
      </div>
    </body>
    </html>
  `);
};

// ─── 5. Mock Authorization POST (submit) ─────────────────────────────────────
const mockAuthorizeSubmit = (req, res) => {
  const { state, nonce, redirect_uri, faydaId } = req.body;

  if (!faydaService.MOCK_USERS[faydaId]) {
    return res.status(400).send('Invalid mock Fayda ID');
  }

  const code = faydaService.generateMockAuthCode(faydaId, 'openid profile', nonce, state);
  res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
};

// ─── 6. Get Fayda KYC status for current user ────────────────────────────────
const getKYCStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await query(
      `SELECT fayda_id, fayda_verified, fayda_verification_date FROM users WHERE id = $1`,
      [userId]
    );
    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        kycVerified: user?.fayda_verified || false,
        faydaLinked: !!user?.fayda_id,
        verifiedAt: user?.fayda_verification_date || null,
        mockMode: faydaService.MOCK_MODE,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get KYC status' });
  }
};

module.exports = {
  initiateLogin,
  initiateKYC,
  handleCallback,
  mockAuthorize,
  mockAuthorizeSubmit,
  getKYCStatus,
};
