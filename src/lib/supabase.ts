import { createClient } from '@supabase/supabase-js';

// جلب متغيرات البيئة ببادئة VITE_ المباشرة للتعرف عليها في Vite
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const normalizedUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl;
const supabaseUrl = normalizedUrl.replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'mohamedsjeha0@gmail.com').toLowerCase().trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const OAUTH_RETURN_KEY = 'at_oauth_return';

/*
 * التقاط أخطاء المصادقة عند العودة من Google/Supabase وتوجيه المستخدم بشكل صحيح
 */
function captureOAuthError(): string {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash.replace(/^#/, '');
  const search = window.location.search.replace(/^\?/, '');
  const isErr = (raw: string) => /(^|&)error(_code|_description)?=/.test(raw);
  const pick = (raw: string) => {
    const p = new URLSearchParams(raw);
    return p.get('error_description') || p.get('error') || p.get('error_code') || '';
  };
  const fromHash = !hash.startsWith('/') && !/(^|&)access_token=/.test(hash) && isErr(hash) ? pick(hash) : '';
  const fromSearch = isErr(search) ? pick(search) : '';
  const message = fromHash || fromSearch;
  if (!message) return '';

  let back = '#/';
  try {
    back = sessionStorage.getItem(OAUTH_RETURN_KEY) || '#/';
    sessionStorage.removeItem(OAUTH_RETURN_KEY);
  } catch {
    /* storage unavailable */
  }
  window.history.replaceState(null, '', window.location.pathname + back);
  return message;
}

export const oauthReturnError = captureOAuthError();

// تهيئة عميل Supabase الرسمي
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const siteUrl = () => {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return window.location.origin;
};

export const supabaseCallbackUrl = supabaseUrl ? `${supabaseUrl}/auth/v1/callback` : '';
