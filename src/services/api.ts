import { AuthUser, Language, LanguageOption } from '../types';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function mapErrorCodeToI18nKey(code: string): string {
  switch (code) {
    case 'DUPLICATE_EMAIL':
      return 'errDuplicateEmail';
    case 'DUPLICATE_MOBILE':
      return 'errDuplicateMobile';
    case 'INVALID_CREDENTIALS':
      return 'errInvalidCredentials';
    case 'PASSWORD_MISMATCH':
      return 'errPasswordMismatch';
    case 'WEAK_PASSWORD':
      return 'errWeakPassword';
    case 'INVALID_EMAIL':
      return 'errInvalidEmail';
    case 'INVALID_MOBILE':
      return 'errInvalidMobile';
    case 'CONSENT_REQUIRED':
      return 'errConsentRequired';
    case 'INVALID_OTP':
      return 'errInvalidOtp';
    case 'INVALID_RESET_TOKEN':
      return 'errInvalidResetToken';
    default:
      return 'errNetwork';
  }
}

// Keep JWT access token strictly in JS memory — never in localStorage
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function hasAccessToken(): boolean {
  return Boolean(inMemoryAccessToken);
}

interface AuthResponsePayload {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: AuthUser;
  verification_notice?: string;
}

export interface LoanCategoryApiItem {
  category_id: number;
  category_slug: string;
  category_name: string;
  description: string;
  icon: string;
  status: string;
}

export interface LoanProductApiItem {
  loan_id: number;
  category_id: number;
  category_slug: string;
  lender_name: string;
  loan_name: string;
  interest_rate: number;
  minimum_amount: number;
  maximum_amount: number;
  maximum_tenure: number;
  eligibility_criteria: string;
  processing_fee: string;
  official_source_url: string;
  last_verified_at: string;
}

export interface LoanPreferenceItem {
  preference_id: number;
  loan_category: string;
  requested_amount: number;
  loan_purpose: string;
  preferred_tenure: number;
  created_at: string;
}

export interface ChatConversationItem {
  conversation_id: number;
  user_id: number | null;
  language: Language;
  created_at: string;
  messages: {
    message_id: number;
    sender: 'user' | 'ai';
    message: string;
    language: Language;
    timestamp: string;
  }[];
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const data = await res.json();
    if (data?.detail && typeof data.detail === 'object') {
      return new ApiError(
        res.status,
        data.detail.code || 'API_ERROR',
        data.detail.message || `Request failed (${res.status})`
      );
    }
    if (typeof data?.detail === 'string') {
      return new ApiError(res.status, 'API_ERROR', data.detail);
    }
  } catch {
    // ignore JSON parse failure
  }
  return new ApiError(res.status, 'NETWORK_ERROR', `Request failed (${res.status})`);
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  allowRefresh = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (inMemoryAccessToken) {
    headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && allowRefresh && url !== '/api/auth/refresh' && url !== '/api/auth/login') {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(url, options, false);
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json() as Promise<T>;
}

export async function fetchLanguages(): Promise<LanguageOption[]> {
  const rows = await apiRequest<
    {
      language_id: number;
      language_code: Language;
      language_name: string;
      native_name: string;
      is_enabled: boolean;
      is_rtl: boolean;
    }[]
  >('/api/languages', { method: 'GET' }, false);

  return rows
    .filter((r) => r.is_enabled)
    .map((r) => ({
      code: r.language_code,
      name: r.language_name,
      nativeName: r.native_name,
      flag: '🇮🇳',
      isRtl: r.is_rtl,
      priorityBadge: r.language_code === 'kn' ? 'Karnataka Priority' : undefined,
    }));
}

export async function fetchLoanCategories(): Promise<LoanCategoryApiItem[]> {
  return apiRequest<LoanCategoryApiItem[]>('/api/loans/categories', { method: 'GET' }, false);
}

export async function fetchLoans(category?: string): Promise<LoanProductApiItem[]> {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiRequest<LoanProductApiItem[]>(`/api/loans${q}`, { method: 'GET' }, false);
}

export async function registerUser(payload: {
  full_name: string;
  email: string;
  mobile_number: string;
  password: string;
  confirm_password: string;
  preferred_language: Language;
  consent_accepted: boolean;
}): Promise<AuthResponsePayload> {
  const data = await apiRequest<AuthResponsePayload>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false
  );
  setAccessToken(data.access_token);
  return data;
}

export async function loginUser(payload: {
  identifier: string;
  password: string;
  remember_me: boolean;
}): Promise<AuthResponsePayload> {
  const data = await apiRequest<AuthResponsePayload>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false
  );
  setAccessToken(data.access_token);
  return data;
}

export async function refreshSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      setAccessToken(null);
      return null;
    }
    const data = (await res.json()) as AuthResponsePayload;
    setAccessToken(data.access_token);
    return data.user;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } finally {
    setAccessToken(null);
  }
}

export async function verifyOtp(payload: {
  identifier: string;
  otp_code: string;
}): Promise<{ verified: boolean; user: AuthUser }> {
  return apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(identifier: string): Promise<{
  message: string;
  reset_token_preview?: string;
}> {
  return apiRequest(
    '/api/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    },
    false
  );
}

export async function resetPassword(payload: {
  token: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ reset: boolean }> {
  return apiRequest(
    '/api/auth/reset-password',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false
  );
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/users/me', { method: 'GET' });
}

export async function updateMe(payload: {
  full_name?: string;
  age?: number | null;
  occupation?: string | null;
  monthly_income?: number | null;
  employment_type?: string | null;
  location?: string | null;
  user_category?: string | null;
}): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateUserLanguage(preferred_language: Language): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/users/me/language', {
    method: 'PUT',
    body: JSON.stringify({ preferred_language }),
  });
}

export async function getLoanPreferences(): Promise<LoanPreferenceItem[]> {
  return apiRequest<LoanPreferenceItem[]>('/api/users/me/preferences', { method: 'GET' });
}

export async function saveLoanPreference(payload: {
  loan_category: string;
  requested_amount: number;
  loan_purpose: string;
  preferred_tenure: number;
}): Promise<LoanPreferenceItem> {
  return apiRequest<LoanPreferenceItem>('/api/users/me/preferences', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendChatMessage(payload: {
  message: string;
  language: Language;
  conversation_id?: number | null;
}): Promise<{
  conversation_id: number;
  language: Language;
  reply: string;
  timestamp: string;
}> {
  return apiRequest('/api/chat/message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getChatConversations(): Promise<ChatConversationItem[]> {
  return apiRequest<ChatConversationItem[]>('/api/chat/conversations', { method: 'GET' });
}
