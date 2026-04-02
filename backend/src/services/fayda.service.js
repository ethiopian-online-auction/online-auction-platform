/**
 * Fayda eSignet OIDC Service
 * 
 * MOCK MODE (default for university project / no credentials yet):
 *   Set FAYDA_MOCK=true in .env  →  simulates the full OIDC flow locally
 * 
 * REAL MODE (when you get credentials from id.gov.et):
 *   Set FAYDA_MOCK=false and fill FAYDA_CLIENT_ID, FAYDA_CLIENT_SECRET, FAYDA_BASE_URL
 */

const crypto = require('crypto');

const MOCK_MODE = process.env.FAYDA_MOCK !== 'false'; // default true
const FAYDA_BASE = process.env.FAYDA_BASE_URL || 'https://esignet.fayda.et';
const CLIENT_ID = process.env.FAYDA_CLIENT_ID || 'mock-client-id';
const CLIENT_SECRET = process.env.FAYDA_CLIENT_SECRET || 'mock-client-secret';

// ─── Mock user database (simulates Fayda national ID records) ────────────────
const MOCK_USERS = {
  '123456789012': {
    sub: '123456789012',
    name: 'Abebe Kebede',
    given_name: 'Abebe',
    family_name: 'Kebede',
    email: 'abebe.kebede@example.com',
    phone_number: '+251911234567',
    birthdate: '1990-05-15',
    gender: 'male',
    address: { locality: 'Addis Ababa', country: 'ET' },
  },
  '987654321098': {
    sub: '987654321098',
    name: 'Tigist Alemu',
    given_name: 'Tigist',
    family_name: 'Alemu',
    email: 'tigist.alemu@example.com',
    phone_number: '+251922345678',
    birthdate: '1995-08-22',
    gender: 'female',
    address: { locality: 'Dire Dawa', country: 'ET' },
  },
};

// ─── In-memory store for mock auth codes ─────────────────────────────────────
const mockAuthCodes = new Map(); // code → { faydaId, scope, nonce, state }

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the authorization URL to redirect the user to Fayda eSignet
 */
const buildAuthorizationUrl = (redirectUri, state, nonce, scope = 'openid profile') => {
  if (MOCK_MODE) {
    // Point to our own mock authorization page
    const params = new URLSearchParams({ state, nonce, redirect_uri: redirectUri, scope });
    return `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/fayda/mock-authorize?${params}`;
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope,
    state,
    nonce,
    acr_values: 'mosip:idp:acr:static-code', // OTP-based auth
  });
  return `${FAYDA_BASE}/authorize?${params}`;
};

/**
 * Exchange authorization code for tokens
 * Returns { id_token, access_token }
 */
const exchangeCodeForTokens = async (code, redirectUri) => {
  if (MOCK_MODE) {
    const session = mockAuthCodes.get(code);
    if (!session) throw new Error('Invalid or expired mock auth code');
    mockAuthCodes.delete(code);

    const user = MOCK_USERS[session.faydaId];
    if (!user) throw new Error('Mock user not found');

    // Build a fake JWT id_token (not cryptographically signed — demo only)
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      ...user,
      iss: 'mock-fayda-esignet',
      aud: CLIENT_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce: session.nonce,
    })).toString('base64url');
    const id_token = `${header}.${payload}.mock_signature`;

    return { id_token, access_token: `mock_access_${crypto.randomUUID()}` };
  }

  // Real eSignet token exchange
  const res = await fetch(`${FAYDA_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
};

/**
 * Fetch user info / KYC data using access token
 */
const getUserInfo = async (accessToken) => {
  if (MOCK_MODE) {
    // Extract faydaId from mock token
    const faydaId = accessToken.replace('mock_access_', '').split('-')[0];
    // Find user by iterating mock users (in real mode this comes from the server)
    const user = Object.values(MOCK_USERS).find(u =>
      accessToken.includes('mock_access_')
    );
    // Return first mock user for simplicity in demo
    return Object.values(MOCK_USERS)[0];
  }

  const res = await fetch(`${FAYDA_BASE}/oidc/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info from Fayda');
  return res.json();
};

/**
 * Decode id_token payload (works for both mock and real JWT)
 */
const decodeIdToken = (id_token) => {
  const parts = id_token.split('.');
  if (parts.length < 2) throw new Error('Invalid id_token format');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
};

/**
 * Generate a mock auth code (used by the mock authorize endpoint)
 */
const generateMockAuthCode = (faydaId, scope, nonce, state) => {
  const code = crypto.randomBytes(16).toString('hex');
  mockAuthCodes.set(code, { faydaId, scope, nonce, state });
  // Auto-expire after 5 minutes
  setTimeout(() => mockAuthCodes.delete(code), 5 * 60 * 1000);
  return code;
};

module.exports = {
  MOCK_MODE,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getUserInfo,
  decodeIdToken,
  generateMockAuthCode,
  MOCK_USERS,
};
