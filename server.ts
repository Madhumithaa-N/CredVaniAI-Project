import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const FASTAPI_BACKEND_URL = (process.env.FASTAPI_BACKEND_URL || '').trim().replace(/\/$/, '');

// Ephemeral in-memory fallback keys when env vars are unset in preview
const RUNTIME_ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || crypto.randomBytes(32).toString('hex')
);
const RUNTIME_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex')
);

const SUPPORTED_LANGUAGES = [
  { language_id: 1, language_code: 'en', language_name: 'English', native_name: 'English', is_enabled: true, is_rtl: false, display_order: 1 },
  { language_id: 2, language_code: 'kn', language_name: 'Kannada', native_name: 'ಕನ್ನಡ', is_enabled: true, is_rtl: false, display_order: 2 },
  { language_id: 3, language_code: 'ta', language_name: 'Tamil', native_name: 'தமிழ்', is_enabled: true, is_rtl: false, display_order: 3 },
  { language_id: 4, language_code: 'hi', language_name: 'Hindi', native_name: 'हिन्दी', is_enabled: true, is_rtl: false, display_order: 4 },
  { language_id: 5, language_code: 'te', language_name: 'Telugu', native_name: 'తెలుగు', is_enabled: true, is_rtl: false, display_order: 5 },
  { language_id: 6, language_code: 'ml', language_name: 'Malayalam', native_name: 'മലയാളം', is_enabled: true, is_rtl: false, display_order: 6 },
  { language_id: 7, language_code: 'mr', language_name: 'Marathi', native_name: 'मराठी', is_enabled: true, is_rtl: false, display_order: 7 },
  { language_id: 8, language_code: 'ur', language_name: 'Urdu', native_name: 'اردو', is_enabled: true, is_rtl: true, display_order: 8 },
  { language_id: 9, language_code: 'bn', language_name: 'Bengali', native_name: 'বাংলা', is_enabled: true, is_rtl: false, display_order: 9 },
  { language_id: 10, language_code: 'gu', language_name: 'Gujarati', native_name: 'ગુજરાતી', is_enabled: true, is_rtl: false, display_order: 10 },
  { language_id: 11, language_code: 'pa', language_name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ', is_enabled: true, is_rtl: false, display_order: 11 },
  { language_id: 12, language_code: 'or', language_name: 'Odia', native_name: 'ଓଡ଼ିଆ', is_enabled: true, is_rtl: false, display_order: 12 },
  { language_id: 13, language_code: 'as', language_name: 'Assamese', native_name: 'অসমীয়া', is_enabled: true, is_rtl: false, display_order: 13 },
  { language_id: 14, language_code: 'kok', language_name: 'Konkani', native_name: 'कोंकणी', is_enabled: true, is_rtl: false, display_order: 14 },
];

const LANGUAGE_NAME_MAP: Record<string, string> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.language_code, `${l.language_name} (${l.native_name})`])
);

const LOAN_CATEGORIES = [
  { category_id: 1, category_slug: 'personal', category_name: 'Personal Loans', description: 'Unsecured instant credit for medical, wedding, travel, and personal needs.', icon: 'UserCheck', status: 'active' },
  { category_id: 2, category_slug: 'home', category_name: 'Home Loans', description: 'Repo-linked housing finance for buying, building, or renovating a home.', icon: 'Home', status: 'active' },
  { category_id: 3, category_slug: 'education', category_name: 'Education Loans', description: 'Higher-study loans for Indian and abroad universities with moratorium.', icon: 'GraduationCap', status: 'active' },
  { category_id: 4, category_slug: 'vehicle', category_name: 'Vehicle Loans', description: 'Auto loans for EVs, cars, and two-wheelers up to 90% on-road value.', icon: 'Car', status: 'active' },
  { category_id: 5, category_slug: 'business', category_name: 'Business / MSME Loans', description: 'MUDRA & CGTMSE collateral-free expansion and working capital credit.', icon: 'Briefcase', status: 'active' },
  { category_id: 6, category_slug: 'gold', category_name: 'Gold Loans', description: '30-minute liquidity against household gold jewellery with minimal documentation.', icon: 'Coins', status: 'active' },
  { category_id: 7, category_slug: 'lap', category_name: 'Loan Against Property', description: 'Unlock high-value capital against residential or commercial property.', icon: 'Building2', status: 'active' },
  { category_id: 8, category_slug: 'credit_line', category_name: 'Credit Cards / Credit Lines', description: 'Revolving UPI-linked credit lines and hybrid flexi overdraft accounts.', icon: 'CreditCard', status: 'active' },
  { category_id: 9, category_slug: 'women', category_name: 'Women-Focused Loans', description: 'Stand-Up India, Mahila Udyam, and discounted housing credit for women.', icon: 'HeartHandshake', status: 'active' },
  { category_id: 10, category_slug: 'disability', category_name: 'Loans for Persons with Disabilities', description: 'NHFDC Divyangjan Swavalamban & assistive-equipment concessional loans.', icon: 'Accessibility', status: 'active' },
];

const LOAN_PRODUCTS = [
  { loan_id: 1, category_id: 2, category_slug: 'home', lender_name: 'State Bank of India (SBI)', loan_name: 'SBI Regular Repo-Linked Home Loan', interest_rate: 8.40, minimum_amount: 300000, maximum_amount: 50000000, maximum_tenure: 360, eligibility_criteria: 'CIBIL 700+, age 18–70, salaried or 2yr ITR', processing_fee: '0.35% (Max ₹10,000)', official_source_url: 'https://homeloans.sbi/', last_verified_at: new Date().toISOString() },
  { loan_id: 2, category_id: 2, category_slug: 'home', lender_name: 'Bank of Baroda', loan_name: 'Baroda Home Loan Advantage', interest_rate: 8.35, minimum_amount: 300000, maximum_amount: 50000000, maximum_tenure: 360, eligibility_criteria: 'CIBIL 701+, savings linked offset', processing_fee: 'Nil – ₹7,500', official_source_url: 'https://www.bankofbaroda.in/', last_verified_at: new Date().toISOString() },
  { loan_id: 3, category_id: 1, category_slug: 'personal', lender_name: 'HDFC Bank', loan_name: 'HDFC Xpress Personal Loan', interest_rate: 10.65, minimum_amount: 50000, maximum_amount: 4000000, maximum_tenure: 72, eligibility_criteria: 'CIBIL 720+, ₹25,000+ monthly net salary', processing_fee: 'Up to ₹4,999', official_source_url: 'https://www.hdfcbank.com/', last_verified_at: new Date().toISOString() },
  { loan_id: 4, category_id: 3, category_slug: 'education', lender_name: 'State Bank of India (SBI)', loan_name: 'SBI Global Ed-Vantage Scheme', interest_rate: 8.50, minimum_amount: 750000, maximum_amount: 15000000, maximum_tenure: 180, eligibility_criteria: 'Confirmed admission to recognized university', processing_fee: '₹10,000 refundable', official_source_url: 'https://sbi.co.in/', last_verified_at: new Date().toISOString() },
  { loan_id: 5, category_id: 4, category_slug: 'vehicle', lender_name: 'ICICI Bank', loan_name: 'ICICI Green EV & Auto Loan', interest_rate: 8.75, minimum_amount: 100000, maximum_amount: 15000000, maximum_tenure: 84, eligibility_criteria: 'CIBIL 710+, salaried or ITR proof', processing_fee: '0.50% of loan', official_source_url: 'https://www.icicibank.com/', last_verified_at: new Date().toISOString() },
  { loan_id: 6, category_id: 5, category_slug: 'business', lender_name: 'SIDBI / Public Banks', loan_name: 'CGTMSE & PM Mudra Tarun Loan', interest_rate: 9.25, minimum_amount: 50000, maximum_amount: 20000000, maximum_tenure: 84, eligibility_criteria: 'Udyam registered MSME with GST trail', processing_fee: '0.50% – 1.00%', official_source_url: 'https://www.udyamimitra.in/', last_verified_at: new Date().toISOString() },
  { loan_id: 7, category_id: 6, category_slug: 'gold', lender_name: 'SBI / Muthoot', loan_name: 'Instant Household Gold Loan', interest_rate: 8.70, minimum_amount: 20000, maximum_amount: 5000000, maximum_tenure: 36, eligibility_criteria: '22-carat gold jewellery KYC, zero income proof', processing_fee: '0.25% – ₹500', official_source_url: 'https://sbi.co.in/', last_verified_at: new Date().toISOString() },
  { loan_id: 8, category_id: 7, category_slug: 'lap', lender_name: 'Axis Bank', loan_name: 'Axis Property Power LAP', interest_rate: 9.10, minimum_amount: 500000, maximum_amount: 50000000, maximum_tenure: 180, eligibility_criteria: 'Clear title deed & CIBIL 720+', processing_fee: 'Up to 1.00%', official_source_url: 'https://www.axisbank.com/', last_verified_at: new Date().toISOString() },
  { loan_id: 9, category_id: 8, category_slug: 'credit_line', lender_name: 'Bajaj Finserv / HDFC', loan_name: 'Flexi Hybrid Credit Line', interest_rate: 11.20, minimum_amount: 50000, maximum_amount: 2500000, maximum_tenure: 60, eligibility_criteria: 'CIBIL 700+, pay interest only on drawn sum', processing_fee: '1.00% annual', official_source_url: 'https://www.bajajfinserv.in/', last_verified_at: new Date().toISOString() },
  { loan_id: 10, category_id: 9, category_slug: 'women', lender_name: 'Stand-Up India / SBI', loan_name: 'Stand-Up India & Stree Shakti Loan', interest_rate: 8.25, minimum_amount: 1000000, maximum_amount: 10000000, maximum_tenure: 84, eligibility_criteria: '≥51% women-owned enterprise or woman co-applicant', processing_fee: 'Nil under priority', official_source_url: 'https://www.standupmitra.in/', last_verified_at: new Date().toISOString() },
  { loan_id: 11, category_id: 10, category_slug: 'disability', lender_name: 'NHFDC (Divyangjan)', loan_name: 'Divyangjan Swavalamban Yojana', interest_rate: 5.00, minimum_amount: 50000, maximum_amount: 5000000, maximum_tenure: 120, eligibility_criteria: '40%+ UDID disability certificate (1% women rebate)', processing_fee: 'Nil (Zero fee)', official_source_url: 'https://www.nhfdc.nic.in/', last_verified_at: new Date().toISOString() },
];

// In-memory runtime store when FASTAPI_BACKEND_URL (with MSSQL CredVaniAI_DB) is not active
interface StoredUser {
  user_id: number;
  full_name: string;
  email: string;
  mobile_number: string;
  password_hash: string;
  preferred_language: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profile: {
    age: number | null;
    occupation: string | null;
    monthly_income: number | null;
    employment_type: string | null;
    location: string | null;
    user_category: string;
  };
}

const memUsers = new Map<number, StoredUser>();
const memRefreshTokens = new Map<string, { user_id: number; expires_at: number; revoked: boolean }>();
const memOtps = new Map<number, { otp_hash: string; expires_at: number }>();
const memResets = new Map<string, { user_id: number; expires_at: number; used: boolean }>();
const memPreferences = new Map<number, any[]>();
const memConversations = new Map<number, { conversation_id: number; user_id: number | null; language: string; created_at: string; messages: any[] }>();
let nextUserId = 1;
let nextConvId = 1;
let nextMsgId = 1;

function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function digestToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizeMobile(val: string): string | null {
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (/^[6-9]\d{9}$/.test(digits)) return digits;
  return null;
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return out;
}

function sanitizeUser(u: StoredUser) {
  return {
    user_id: u.user_id,
    full_name: u.full_name,
    email: u.email,
    mobile_number: u.mobile_number,
    preferred_language: u.preferred_language,
    is_verified: u.is_verified,
    created_at: u.created_at,
    profile: u.profile,
  };
}

async function signTokens(user: StoredUser) {
  const accessToken = await new SignJWT({ sub: String(user.user_id), lang: user.preferred_language, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(RUNTIME_ACCESS_SECRET);

  const jti = crypto.randomBytes(16).toString('hex');
  const refreshToken = await new SignJWT({ sub: String(user.user_id), jti, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(RUNTIME_REFRESH_SECRET);

  memRefreshTokens.set(digestToken(refreshToken), {
    user_id: user.user_id,
    expires_at: Date.now() + 14 * 86400 * 1000,
    revoked: false,
  });

  return { accessToken, refreshToken };
}

function setRefreshCookie(res: Response, refreshToken: string, rememberMe: boolean) {
  const parts = [
    `credvani_refresh=${encodeURIComponent(refreshToken)}`,
    'HttpOnly',
    'Secure',
    'SameSite=None',
    'Partitioned',
    'Path=/',
  ];
  if (rememberMe) {
    parts.push(`Max-Age=${14 * 86400}`);
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearRefreshCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    'credvani_refresh=; HttpOnly; Secure; SameSite=None; Partitioned; Path=/; Max-Age=0'
  );
}

async function getAuthUser(req: Request): Promise<StoredUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  try {
    const { payload } = await jwtVerify(token, RUNTIME_ACCESS_SECRET);
    if (payload.type !== 'access' || !payload.sub) return null;
    return memUsers.get(Number(payload.sub)) || null;
  } catch {
    return null;
  }
}

function verifyMutationOrigin(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (host && originHost !== host) {
        return res.status(403).json({ detail: { code: 'INVALID_ORIGIN', message: 'Origin mismatch.' } });
      }
    } catch {
      return res.status(403).json({ detail: { code: 'INVALID_ORIGIN', message: 'Invalid Origin header.' } });
    }
  }
  next();
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', verifyMutationOrigin);

  // Optional transparent proxy to Python FastAPI + SQL Server backend when FASTAPI_BACKEND_URL is set
  if (FASTAPI_BACKEND_URL) {
    app.use('/api', async (req: Request, res: Response) => {
      try {
        const targetUrl = `${FASTAPI_BACKEND_URL}${req.url}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (req.headers.authorization) headers.Authorization = req.headers.authorization;
        if (req.headers.cookie) headers.Cookie = req.headers.cookie;

        const upstream = await fetch(targetUrl, {
          method: req.method,
          headers,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        });
        const setCookie = upstream.headers.get('set-cookie');
        if (setCookie) res.setHeader('Set-Cookie', setCookie);
        const text = await upstream.text();
        res.status(upstream.status).type('application/json').send(text);
      } catch (err: any) {
        res.status(502).json({ detail: { code: 'FASTAPI_UNREACHABLE', message: err?.message || 'FastAPI proxy error' } });
      }
    });
  } else {
    // Health
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', mode: 'preview-express', targetDatabase: 'CredVaniAI_DB' });
    });

    // Languages
    app.get('/api/languages', (_req, res) => {
      res.json(SUPPORTED_LANGUAGES);
    });

    // Loans
    app.get('/api/loans/categories', (_req, res) => {
      res.json(LOAN_CATEGORIES);
    });

    app.get('/api/loans', (req, res) => {
      const cat = typeof req.query.category === 'string' ? req.query.category : null;
      const list = cat ? LOAN_PRODUCTS.filter((p) => p.category_slug === cat) : LOAN_PRODUCTS;
      res.json(list);
    });

    app.get('/api/loans/:loanId', (req, res) => {
      const id = Number(req.params.loanId);
      const found = LOAN_PRODUCTS.find((p) => p.loan_id === id);
      if (!found) return res.status(404).json({ detail: { code: 'LOAN_NOT_FOUND', message: 'Loan not found.' } });
      res.json(found);
    });

    // Auth: Register
    app.post('/api/auth/register', async (req, res) => {
      const {
        full_name,
        email,
        mobile_number,
        password,
        confirm_password,
        preferred_language = 'kn',
        consent_accepted,
      } = req.body || {};

      if (!full_name || String(full_name).trim().length < 2) {
        return res.status(422).json({ detail: { code: 'INVALID_NAME', message: 'Full name is required.' } });
      }
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(422).json({ detail: { code: 'INVALID_EMAIL', message: 'Valid email is required.' } });
      }
      const cleanMobile = normalizeMobile(String(mobile_number || ''));
      if (!cleanMobile) {
        return res.status(422).json({ detail: { code: 'INVALID_MOBILE', message: 'Valid 10-digit mobile number is required.' } });
      }
      if (!password || String(password).length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return res.status(422).json({ detail: { code: 'WEAK_PASSWORD', message: 'Password must be 8+ chars with letters and numbers.' } });
      }
      if (password !== confirm_password) {
        return res.status(422).json({ detail: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match.' } });
      }
      if (!consent_accepted) {
        return res.status(422).json({ detail: { code: 'CONSENT_REQUIRED', message: 'Consent must be accepted.' } });
      }
      if (!LANGUAGE_NAME_MAP[preferred_language]) {
        return res.status(422).json({ detail: { code: 'UNSUPPORTED_LANGUAGE', message: 'Unsupported language.' } });
      }

      for (const u of memUsers.values()) {
        if (u.email === cleanEmail) {
          return res.status(409).json({ detail: { code: 'DUPLICATE_EMAIL', message: 'Email already registered.' } });
        }
        if (u.mobile_number === cleanMobile) {
          return res.status(409).json({ detail: { code: 'DUPLICATE_MOBILE', message: 'Mobile number already registered.' } });
        }
      }

      const now = new Date().toISOString();
      const newUser: StoredUser = {
        user_id: nextUserId++,
        full_name: String(full_name).trim(),
        email: cleanEmail,
        mobile_number: cleanMobile,
        password_hash: hashPasswordScrypt(password),
        preferred_language,
        is_verified: false,
        created_at: now,
        updated_at: now,
        profile: {
          age: null,
          occupation: null,
          monthly_income: null,
          employment_type: 'salaried',
          location: 'Karnataka',
          user_category: 'general',
        },
      };
      memUsers.set(newUser.user_id, newUser);

      const otp = String(crypto.randomInt(100000, 999999));
      memOtps.set(newUser.user_id, {
        otp_hash: digestToken(otp),
        expires_at: Date.now() + 15 * 60 * 1000,
      });

      const { accessToken, refreshToken } = await signTokens(newUser);
      setRefreshCookie(res, refreshToken, true);

      res.status(201).json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        user: sanitizeUser(newUser),
        verification_notice: `Verification OTP: ${otp}`,
      });
    });

    // Auth: Verify OTP
    app.post('/api/auth/verify-otp', (req, res) => {
      const ident = String(req.body?.identifier || '').trim().toLowerCase();
      const otpCode = String(req.body?.otp_code || '').trim();
      const cleanMobile = normalizeMobile(ident);

      let found: StoredUser | null = null;
      for (const u of memUsers.values()) {
        if (u.email === ident || (cleanMobile && u.mobile_number === cleanMobile)) {
          found = u;
          break;
        }
      }
      if (!found) {
        return res.status(404).json({ detail: { code: 'USER_NOT_FOUND', message: 'Account not found.' } });
      }
      const entry = memOtps.get(found.user_id);
      if (!entry || entry.expires_at < Date.now() || entry.otp_hash !== digestToken(otpCode)) {
        return res.status(400).json({ detail: { code: 'INVALID_OTP', message: 'Invalid or expired OTP.' } });
      }
      memOtps.delete(found.user_id);
      found.is_verified = true;
      found.updated_at = new Date().toISOString();
      res.json({ verified: true, user: sanitizeUser(found) });
    });

    // Auth: Login
    app.post('/api/auth/login', async (req, res) => {
      const ident = String(req.body?.identifier || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const rememberMe = Boolean(req.body?.remember_me);
      const cleanMobile = normalizeMobile(ident);

      let found: StoredUser | null = null;
      for (const u of memUsers.values()) {
        if (u.email === ident || (cleanMobile && u.mobile_number === cleanMobile)) {
          found = u;
          break;
        }
      }
      if (!found || !verifyPasswordScrypt(password, found.password_hash)) {
        return res.status(401).json({ detail: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/mobile or password.' } });
      }

      const { accessToken, refreshToken } = await signTokens(found);
      setRefreshCookie(res, refreshToken, rememberMe);

      res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        user: sanitizeUser(found),
      });
    });

    // Auth: Refresh
    app.post('/api/auth/refresh', async (req, res) => {
      const cookies = parseCookies(req);
      const rawToken = req.body?.refresh_token || cookies.credvani_refresh;
      if (!rawToken) {
        return res.status(401).json({ detail: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token required.' } });
      }
      try {
        const { payload } = await jwtVerify(rawToken, RUNTIME_REFRESH_SECRET);
        const rec = memRefreshTokens.get(digestToken(rawToken));
        if (!rec || rec.revoked || rec.expires_at < Date.now()) {
          return res.status(401).json({ detail: { code: 'REVOKED_REFRESH_TOKEN', message: 'Session expired.' } });
        }
        const user = memUsers.get(Number(payload.sub));
        if (!user) {
          return res.status(401).json({ detail: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
        }
        rec.revoked = true;
        const { accessToken, refreshToken } = await signTokens(user);
        setRefreshCookie(res, refreshToken, true);
        res.json({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'bearer',
          user: sanitizeUser(user),
        });
      } catch {
        return res.status(401).json({ detail: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token.' } });
      }
    });

    // Auth: Logout
    app.post('/api/auth/logout', (req, res) => {
      const cookies = parseCookies(req);
      const rawToken = req.body?.refresh_token || cookies.credvani_refresh;
      if (rawToken) {
        const rec = memRefreshTokens.get(digestToken(rawToken));
        if (rec) rec.revoked = true;
      }
      clearRefreshCookie(res);
      res.json({ logged_out: true });
    });

    // Auth: Forgot & Reset Password
    app.post('/api/auth/forgot-password', (req, res) => {
      const ident = String(req.body?.identifier || '').trim().toLowerCase();
      const cleanMobile = normalizeMobile(ident);
      let found: StoredUser | null = null;
      for (const u of memUsers.values()) {
        if (u.email === ident || (cleanMobile && u.mobile_number === cleanMobile)) {
          found = u;
          break;
        }
      }
      if (!found) {
        return res.json({ message: 'If an account exists, password reset instructions have been issued.' });
      }
      const rawReset = crypto.randomBytes(18).toString('base64url');
      memResets.set(digestToken(rawReset), {
        user_id: found.user_id,
        expires_at: Date.now() + 30 * 60 * 1000,
        used: false,
      });
      res.json({
        message: 'Password reset token generated.',
        reset_token_preview: rawReset,
      });
    });

    app.post('/api/auth/reset-password', (req, res) => {
      const { token, new_password, confirm_password } = req.body || {};
      if (!new_password || new_password !== confirm_password || String(new_password).length < 8) {
        return res.status(422).json({ detail: { code: 'PASSWORD_MISMATCH', message: 'Passwords must match and be at least 8 characters.' } });
      }
      const rec = memResets.get(digestToken(String(token || '').trim()));
      if (!rec || rec.used || rec.expires_at < Date.now()) {
        return res.status(400).json({ detail: { code: 'INVALID_RESET_TOKEN', message: 'Invalid or expired reset token.' } });
      }
      const user = memUsers.get(rec.user_id);
      if (!user) return res.status(404).json({ detail: { code: 'USER_NOT_FOUND', message: 'User not found.' } });

      user.password_hash = hashPasswordScrypt(new_password);
      user.updated_at = new Date().toISOString();
      rec.used = true;
      for (const rt of memRefreshTokens.values()) {
        if (rt.user_id === user.user_id) rt.revoked = true;
      }
      res.json({ reset: true });
    });

    // Users
    app.get('/api/users/me', async (req, res) => {
      const user = await getAuthUser(req);
      if (!user) return res.status(401).json({ detail: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      res.json(sanitizeUser(user));
    });

    app.put('/api/users/me', async (req, res) => {
      const user = await getAuthUser(req);
      if (!user) return res.status(401).json({ detail: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });

      const { full_name, age, occupation, monthly_income, employment_type, location, user_category } = req.body || {};
      if (full_name && String(full_name).trim().length >= 2) user.full_name = String(full_name).trim();
      if (age !== undefined) user.profile.age = age === null ? null : Number(age);
      if (occupation !== undefined) user.profile.occupation = occupation;
      if (monthly_income !== undefined) user.profile.monthly_income = monthly_income === null ? null : Number(monthly_income);
      if (employment_type !== undefined) user.profile.employment_type = employment_type;
      if (location !== undefined) user.profile.location = location;
      if (user_category !== undefined) user.profile.user_category = user_category;
      user.updated_at = new Date().toISOString();
      res.json(sanitizeUser(user));
    });

    app.put('/api/users/me/language', async (req, res) => {
      const user = await getAuthUser(req);
      if (!user) return res.status(401).json({ detail: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      const lang = String(req.body?.preferred_language || '');
      if (!LANGUAGE_NAME_MAP[lang]) {
        return res.status(400).json({ detail: { code: 'UNSUPPORTED_LANGUAGE', message: 'Unsupported language.' } });
      }
      user.preferred_language = lang;
      user.updated_at = new Date().toISOString();
      res.json(sanitizeUser(user));
    });

    app.get('/api/users/me/preferences', async (req, res) => {
      const user = await getAuthUser(req);
      if (!user) return res.status(401).json({ detail: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      res.json(memPreferences.get(user.user_id) || []);
    });

    app.post('/api/users/me/preferences', async (req, res) => {
      const user = await getAuthUser(req);
      if (!user) return res.status(401).json({ detail: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      const { loan_category, requested_amount, loan_purpose, preferred_tenure } = req.body || {};
      if (!loan_category || !requested_amount || !preferred_tenure) {
        return res.status(422).json({ detail: { code: 'INVALID_PREFERENCE', message: 'Missing preference fields.' } });
      }
      const list = memPreferences.get(user.user_id) || [];
      const item = {
        preference_id: list.length + 1,
        loan_category,
        requested_amount: Number(requested_amount),
        loan_purpose: loan_purpose || '',
        preferred_tenure: Number(preferred_tenure),
        created_at: new Date().toISOString(),
      };
      list.unshift(item);
      memPreferences.set(user.user_id, list);
      res.status(201).json(item);
    });

    // Multilingual AI Chatbot (Gemini 4 Hydrogen server-side)
    app.post('/api/chat/message', async (req, res) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          detail: { code: 'GEMINI_API_KEY_MISSING', message: 'GEMINI_API_KEY is not configured in Secrets.' },
        });
      }

      const user = await getAuthUser(req);
      const message = String(req.body?.message || '').trim();
      const language = String(req.body?.language || 'kn');
      const convIdInput = req.body?.conversation_id ? Number(req.body.conversation_id) : null;

      if (!message) {
        return res.status(422).json({ detail: { code: 'EMPTY_MESSAGE', message: 'Message cannot be empty.' } });
      }
      const targetLanguageName = LANGUAGE_NAME_MAP[language];
      if (!targetLanguageName) {
        return res.status(400).json({ detail: { code: 'UNSUPPORTED_LANGUAGE', message: 'Unsupported language.' } });
      }

      let conv = convIdInput ? memConversations.get(convIdInput) : undefined;
      if (conv && conv.user_id && (!user || conv.user_id !== user.user_id)) {
        return res.status(403).json({ detail: { code: 'FORBIDDEN', message: 'Access denied.' } });
      }
      if (!conv) {
        conv = {
          conversation_id: nextConvId++,
          user_id: user ? user.user_id : null,
          language,
          created_at: new Date().toISOString(),
          messages: [],
        };
        memConversations.set(conv.conversation_id, conv);
      }

      conv.messages.push({
        message_id: nextMsgId++,
        sender: 'user',
        message,
        language,
        timestamp: new Date().toISOString(),
      });

      const systemInstruction = [
        `You are CredVani AI, an Indian financial and loan advisory assistant.`,
        `Respond STRICTLY and ENTIRELY in ${targetLanguageName} using natural, everyday regional phrasing.`,
        `NEVER mix unnecessary English sentences or include English translations below your answer.`,
        `Only keep unavoidable official bank names (SBI, HDFC, ICICI, Axis, Bank of Baroda, NABARD, NHFDC), official URLs, and standard identifiers (EMI, CIBIL, KCC, MSME, FOIR, APR, RBI, UDID).`,
        `Cover interest rates, eligibility criteria, processing fees, repayment tenure, and Indian government schemes (PMAY, MUDRA, CGTMSE, Stand-Up India, KCC, NHFDC Divyangjan) clearly and concisely in 4-6 bullet points or short sentences.`,
      ].join(' ');

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: message,
            config: { systemInstruction },
          });
        } catch (primaryErr: any) {
          const msgStr = String(primaryErr?.message || '');
          if (msgStr.includes('503') || msgStr.includes('UNAVAILABLE')) {
            response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: message,
              config: { systemInstruction },
            });
          } else {
            throw primaryErr;
          }
        }
        const reply = (response.text || '').trim();
        if (!reply) {
          return res.status(502).json({ detail: { code: 'EMPTY_AI_RESPONSE', message: 'Model returned empty text.' } });
        }
        const ts = new Date().toISOString();
        conv.messages.push({
          message_id: nextMsgId++,
          sender: 'ai',
          message: reply,
          language,
          timestamp: ts,
        });
        return res.json({
          conversation_id: conv.conversation_id,
          language,
          reply,
          timestamp: ts,
        });
      } catch (err: any) {
        return res.status(502).json({
          detail: { code: 'AI_UPSTREAM_ERROR', message: err?.message || 'Gemini service error.' },
        });
      }
    });

    app.get('/api/chat/conversations', async (req, res) => {
      const user = await getAuthUser(req);
      if (!user) return res.status(401).json({ detail: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      const rows = Array.from(memConversations.values()).filter((c) => c.user_id === user.user_id);
      res.json(rows);
    });
  }

  // Mount Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CredVaniAI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
