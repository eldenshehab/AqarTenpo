import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { PROPERTIES, type Property } from './data';
import { EXTRA_LISTINGS, findDuplicate, present } from './catalog';
import { ADMIN_EMAIL, OAUTH_RETURN_KEY, isSupabaseConfigured, oauthReturnError, siteUrl, supabase } from './lib/supabase';
import { isManaged } from './config';
import { trackVisit } from './lib/analytics';

export type Lang = 'ar' | 'en';
export type AccountType = 'individual' | 'company' | 'broker';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  provider: 'google' | 'email';
  accountType: AccountType;
  companyName?: string;
  commercialRegistration?: string;
  office?: string;
  license?: string;
  bio?: string;
  role: UserRole;
  isAdmin: boolean;
}

export interface AuthInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  accountType?: AccountType;
  companyName?: string;
  commercialRegistration?: string;
  office?: string;
  license?: string;
  bio?: string;
}

export interface Inquiry {
  id: string;
  listingId: string;
  kind: 'inquiry' | 'tour';
  name: string;
  phone: string;
  note?: string;
  date?: string;
  time?: string;
  createdAt: string;
}

export const LISTING_MONTHS = 3;
export const LISTING_DAYS = 90;
const LISTING_LIFETIME = LISTING_DAYS * 24 * 60 * 60 * 1000;
const USER_KEY = 'at_user';
const LISTINGS_KEY = 'at_listings';
const ACCOUNTS_KEY = 'at_accounts';
// A local-only preview credential; change it before sharing a dev build.
export const LOCAL_ADMIN_PASSWORD = 'AdminPassword2026!';

const ls = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Storage unavailable:', error);
  }
};
const delay = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 80));

interface LocalAccount extends User {
  password?: string;
}

interface ListingRow {
  id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, unknown>;
  views: number;
  phone_views: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const userId = (user: User) => user.id;

function normalizeUser(value: Partial<User> | null): User | null {
  if (!value?.email) return null;
  const role: UserRole = value.role === 'admin' || value.isAdmin ? 'admin' : 'user';
  return {
    id: value.id || value.email.toLowerCase(),
    name: value.name || value.email.split('@')[0],
    email: value.email.toLowerCase(),
    phone: value.phone,
    provider: value.provider || 'email',
    accountType: value.accountType || 'individual',
    companyName: value.companyName,
    commercialRegistration: value.commercialRegistration,
    office: value.office,
    license: value.license,
    bio: value.bio,
    role,
    isAdmin: role === 'admin',
  };
}

function profileToUser(profile: Record<string, unknown> | null, authUser: SupabaseAuthUser): User {
  const meta = authUser.user_metadata || {};
  const email = (authUser.email || String(profile?.email || '')).toLowerCase().trim();
  // In cloud mode, trust the protected database role; never grant admin in the browser by email alone.
  const role: UserRole = profile?.role === 'admin' ? 'admin' : 'user';
  return {
    id: authUser.id,
    email,
    name: String(profile?.name || meta.name || meta.full_name || email.split('@')[0] || 'User'),
    phone: String(profile?.phone || meta.phone || '') || undefined,
    provider: authUser.app_metadata?.provider === 'google' ? 'google' : 'email',
    accountType: (profile?.account_type || meta.account_type || 'individual') as AccountType,
    companyName: String(profile?.company_name || meta.company_name || '') || undefined,
    commercialRegistration: String(profile?.commercial_registration || meta.commercial_registration || '') || undefined,
    office: String(profile?.office || meta.office || '') || undefined,
    license: String(profile?.license || meta.license || '') || undefined,
    bio: String(profile?.bio || meta.bio || '') || undefined,
    role,
    isAdmin: role === 'admin',
  };
}

async function cloudUser(authUser: SupabaseAuthUser): Promise<User> {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  try {
    if (authUser.email?.toLowerCase().trim() === ADMIN_EMAIL) {
      try {
        await supabase.rpc('claim_initial_admin');
      } catch {
        /* ignore claim error */
      }
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) console.warn('Profile fetch note:', error.message);
    return profileToUser(data as Record<string, unknown> | null, authUser);
  } catch (error) {
    console.warn('Profile sync:', error);
    return profileToUser(null, authUser);
  }
}

/* بعد عودة المستخدم من تسجيل الدخول بـ Google، إعادة التوجيه للصفحة التي كان يتصفحها */
function restoreAfterOAuth() {
  let back: string | null = null;
  try {
    back = sessionStorage.getItem(OAUTH_RETURN_KEY);
    sessionStorage.removeItem(OAUTH_RETURN_KEY);
  } catch {
    /* storage unavailable */
  }
  if (back && back.startsWith('#/') && location.hash !== back) {
    location.hash = back;
  }
}

function listingFromRow(row: ListingRow, phone = ''): Property {
  return present({
    ...(row.data as unknown as Property),
    id: row.id,
    ownerId: row.owner_id,
    phone,
    reviewStatus: row.status,
    views: row.views,
    phoneViews: row.phone_views,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
  });
}

function publicListingData(p: Property) {
  const data = { ...p } as Record<string, unknown>;
  for (const key of ['id', 'ownerId', 'phone', 'reviewStatus', 'views', 'phoneViews', 'createdAt', 'updatedAt', 'expiresAt']) {
    delete data[key];
  }
  return data;
}

function localListings() {
  const now = Date.now();
  const active = ls<Property[]>(LISTINGS_KEY, []).filter(p => !p.expiresAt || p.expiresAt > now);
  save(LISTINGS_KEY, active);
  return active;
}

async function getCloudListings(): Promise<Property[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data || []) as ListingRow[];
  const contacts = new Map<string, string>();
  if (rows.length) {
    const { data: privateRows } = await supabase
      .from('listing_contacts')
      .select('listing_id,phone')
      .in('listing_id', rows.map(r => r.id));
    (privateRows || []).forEach(row => contacts.set(String(row.listing_id), String(row.phone)));
  }
  return rows.map(row => listingFromRow(row, contacts.get(row.id) || ''));
}

export const api = {
  listings: async () => {
    const mine = isSupabaseConfigured ? await getCloudListings() : localListings().map(present);
    return [...mine, ...PROPERTIES, ...EXTRA_LISTINGS].map(present);
  },

  findDuplicate: async (candidate: { title: string; phone: string; price: number; location?: string }) => {
    const all = isSupabaseConfigured ? await getCloudListings() : localListings();
    return findDuplicate(candidate, [...all, ...PROPERTIES, ...EXTRA_LISTINGS].map(present));
  },

  addListing: async (p: Property, user: User) => {
    if (isSupabaseConfigured && supabase) {
      const count = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .gt('expires_at', new Date().toISOString());
      if (user.accountType === 'company' && (count.count || 0) >= 50) {
        throw new Error('COMPANY_LISTING_LIMIT');
      }
      const { data, error } = await supabase
        .from('listings')
        .insert({
          owner_id: user.id,
          status: user.isAdmin ? 'approved' : isManaged(p) ? 'pending' : 'approved',
          data: publicListingData(p),
          expires_at: new Date(Date.now() + LISTING_LIFETIME).toISOString(),
        })
        .select('*')
        .single();
      if (error) throw error;
      const row = data as ListingRow;
      if (p.phone) {
        const contact = await supabase.from('listing_contacts').insert({
          listing_id: row.id,
          owner_id: user.id,
          phone: p.phone,
        });
        if (contact.error) console.warn('Contact insert note:', contact.error.message);
      }
      return listingFromRow(row, p.phone);
    }
    const active = localListings();
    if (user.accountType === 'company' && active.filter(x => x.ownerId === user.id).length >= 50) {
      throw new Error('COMPANY_LISTING_LIMIT');
    }
    const now = Date.now();
    const item: Property = {
      ...p,
      id: `u${now}`,
      ownerId: user.id,
      reviewStatus: user.isAdmin || !isManaged(p) ? 'approved' : 'pending',
      createdAt: now,
      updatedAt: now,
      expiresAt: now + LISTING_LIFETIME,
      views: 0,
      phoneViews: 0,
    };
    save(LISTINGS_KEY, [item, ...active]);
    return delay(item);
  },

  updateListing: async (p: Property, owner: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('listings')
        .update({ data: publicListingData(p) })
        .eq('id', p.id)
        .select('*')
        .single();
      if (error) throw error;
      if (p.phone) {
        await supabase.from('listing_contacts').upsert({ listing_id: p.id, owner_id: owner, phone: p.phone });
      }
      return listingFromRow(data as ListingRow, p.phone);
    }
    const all = localListings();
    const i = all.findIndex(x => x.id === p.id && x.ownerId === owner);
    if (i < 0) throw new Error('LISTING_NOT_OWNED');
    all[i] = { ...all[i], ...p, updatedAt: Date.now() };
    save(LISTINGS_KEY, all);
    return delay(all[i]);
  },

  deleteListing: async (id: string, owner: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = normalizeUser(ls<User | null>(USER_KEY, null));
    save(LISTINGS_KEY, localListings().filter(x => x.id !== id || (!current?.isAdmin && x.ownerId !== owner)));
    return delay(true);
  },

  reviewListing: async (id: string, status: 'approved' | 'rejected') => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('listings').update({ status }).eq('id', id);
      if (error) throw error;
      return true;
    }
    save(LISTINGS_KEY, localListings().map(p => (p.id === id ? { ...p, reviewStatus: status } : p)));
    return delay(true);
  },

  recordView: async (id: string) => {
    if (sessionStorage.getItem(`viewed:${id}`)) return true;
    sessionStorage.setItem(`viewed:${id}`, '1');
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('increment_listing_view', { listing_uuid: id });
      } catch {
        /* ignore */
      }
    } else {
      save(LISTINGS_KEY, localListings().map(p => (p.id === id ? { ...p, views: (p.views || 0) + 1 } : p)));
    }
    return true;
  },

  recordPhoneView: async (id: string) => {
    if (sessionStorage.getItem(`phone:${id}`)) return true;
    sessionStorage.setItem(`phone:${id}`, '1');
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('increment_phone_view', { listing_uuid: id });
      } catch {
        /* ignore */
      }
    } else {
      save(LISTINGS_KEY, localListings().map(p => (p.id === id ? { ...p, phoneViews: (p.phoneViews || 0) + 1 } : p)));
    }
    return true;
  },

  bookTour: async (booking: { id: string; name: string; phone: string; date?: string; time?: string; note?: string }) => {
    const isCloudId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(booking.id);
    if (isSupabaseConfigured && supabase && isCloudId) {
      const { data: listing, error: listingError } = await supabase.from('listings').select('owner_id').eq('id', booking.id).single();
      if (listingError) throw listingError;
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('inquiries').insert({
        listing_id: booking.id,
        owner_id: listing.owner_id,
        sender_id: auth.user?.id || null,
        kind: 'tour',
        name: booking.name,
        phone: booking.phone,
        requested_date: booking.date || null,
        requested_time: booking.time || null,
        note: booking.note || null,
      });
      if (error) throw error;
      return true;
    }
    save('at_tours', [...ls<object[]>('at_tours', []), booking]);
    return delay(true);
  },

  inquiries: async (): Promise<Inquiry[]> => {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      listingId: r.listing_id,
      kind: r.kind,
      name: r.name,
      phone: r.phone,
      note: r.note,
      date: r.requested_date,
      time: r.requested_time,
      createdAt: r.created_at,
    }));
  },

  reportListing: async (listingId: string, reason: string, note: string) => {
    const isCloudId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId);
    if (isSupabaseConfigured && supabase && isCloudId) {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('listing_reports').insert({
        listing_id: listingId,
        reporter_id: auth.user?.id || null,
        reason,
        note: note || null,
      });
      if (error) throw error;
      return true;
    }
    const reports = ls<object[]>('at_reports', []);
    save('at_reports', [{ id: `rp${Date.now()}`, propertyId: listingId, reason, note, at: Date.now() }, ...reports]);
    return true;
  },

  uploadMedia: async (file: Blob, user: User, folder = 'properties') => {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error(`UPLOAD_AUTH_REQUIRED${sessionError?.message ? `: ${sessionError.message}` : ''}`);
    }
    if (sessionData.session.user.id !== user.id) {
      throw new Error('UPLOAD_SESSION_MISMATCH');
    }
    if (!file.size) throw new Error('UPLOAD_EMPTY_FILE');
    if (file.size > 10 * 1024 * 1024) throw new Error('UPLOAD_TOO_LARGE');

    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '-').slice(0, 60) || 'properties';
    const path = `${user.id}/${safeFolder}/${crypto.randomUUID()}.jpg`;
    try {
      const result = await supabase.storage.from('property-media').upload(path, file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });
      if (result.error) {
        const detail = `${result.error.name || 'StorageError'}: ${result.error.message}`;
        console.error('Supabase Storage upload failed:', {
          detail,
          status: 'status' in result.error ? result.error.status : undefined,
          path,
          userId: user.id,
        });
        throw new Error(`STORAGE_UPLOAD_FAILED:${detail}`);
      }
      const publicUrl = supabase.storage.from('property-media').getPublicUrl(result.data.path).data.publicUrl;
      if (!publicUrl) throw new Error('STORAGE_PUBLIC_URL_MISSING');
      return publicUrl;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('STORAGE_UPLOAD_FAILED:')) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      console.error('Supabase Storage request failed:', { detail, path, userId: user.id });
      throw new Error(`STORAGE_UPLOAD_FAILED:${detail}`);
    }
  },

  signUp: async (input: AuthInput) => {
    const email = input.email.toLowerCase().trim();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          emailRedirectTo: siteUrl(),
          data: {
            name: input.name || '',
            phone: input.phone || '',
            account_type: input.accountType || 'individual',
            company_name: input.companyName || '',
            commercial_registration: input.commercialRegistration || '',
            office: input.office || '',
            license: input.license || '',
            bio: input.bio || '',
          },
        },
      });
      if (error) throw error;
      return {
        user: data.user && data.session ? await cloudUser(data.user) : null,
        confirmationRequired: Boolean(data.user && !data.session),
      };
    }
    const accounts = ls<Record<string, LocalAccount>>(ACCOUNTS_KEY, {});
    if (accounts[email]) throw new Error('EMAIL_EXISTS');
    const isAdmin = email === ADMIN_EMAIL;
    const user = normalizeUser({
      id: email,
      email,
      name: input.name || email.split('@')[0],
      phone: input.phone,
      provider: 'email',
      accountType: input.accountType,
      companyName: input.companyName,
      commercialRegistration: input.commercialRegistration,
      office: input.office,
      license: input.license,
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
    })!;
    accounts[email] = { ...user, password: input.password };
    save(ACCOUNTS_KEY, accounts);
    return { user, confirmationRequired: false };
  },

  signIn: async (emailRaw: string, password: string) => {
    const email = emailRaw.toLowerCase().trim();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return cloudUser(data.user);
    }
    // تسجيل دخول الأدمن المعتمد
    if (email === ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD) {
      return normalizeUser({
        id: email,
        email,
        name: 'AqarTenpo Admin',
        provider: 'email',
        accountType: 'company',
        role: 'admin',
        isAdmin: true,
      })!;
    }
    const account = ls<Record<string, LocalAccount>>(ACCOUNTS_KEY, {})[email];
    if (!account || account.password !== password) throw new Error('INVALID_CREDENTIALS');
    return normalizeUser(account)!;
  },

  signInGoogle: async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('GOOGLE_REQUIRES_SUPABASE');
    }
    const here = location.hash.startsWith('#/') ? location.hash : '#/';
    try {
      sessionStorage.setItem(OAUTH_RETURN_KEY, here);
    } catch {
      /* storage unavailable */
    }

    // استدعاء مباشر لـ signInWithOAuth بدون أي تحققات هشة تعطل التوجيه
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      try {
        sessionStorage.removeItem(OAUTH_RETURN_KEY);
      } catch {
        /* ignore */
      }
      console.error('Error logging in with Google:', error.message);
      throw error;
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => null);
    }
    localStorage.removeItem(USER_KEY);
  },
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ar: string, en: string) => string;
  user: User | null;
  authReady: boolean;
  cloudEnabled: boolean;
  setUser: (u: User | null) => void;
  signUp: (input: AuthInput) => Promise<{ confirmationRequired: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authNotice: string;
  clearAuthNotice: () => void;
  favs: string[];
  toggleFav: (id: string) => void;
  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  authOpen: false | 'login' | 'signup';
  setAuthOpen: (v: false | 'login' | 'signup') => void;
  listings: Property[];
  refresh: () => void;
  publishListing: (p: Property) => Promise<Property>;
  editListing: (p: Property) => Promise<Property>;
  removeListing: (id: string) => Promise<boolean>;
  reviewListing: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  uploadMedia: (file: Blob, folder?: string) => Promise<string>;
  recordView: (id: string) => void;
  recordPhoneView: (id: string) => void;
  route: string;
  go: (r: string) => void;
}

const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(ls('at_lang', 'ar'));
  const [user, setUserS] = useState<User | null>(() => (isSupabaseConfigured ? null : normalizeUser(ls<User | null>(USER_KEY, null))));
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authNotice, setAuthNotice] = useState(oauthReturnError);
  const [favs, setFavs] = useState<string[]>(ls('at_favs', []));
  const [compare, setCompare] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState<false | 'login' | 'signup'>(false);
  const [listings, setListings] = useState<Property[]>([...PROPERTIES, ...EXTRA_LISTINGS].map(present));
  const [route, setRoute] = useState(location.hash.slice(1) || '/');

  const refresh = () => {
    api.listings()
      .then(setListings)
      .catch(error => console.error('Listings refresh note:', error));
  };

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (active) {
          setUserS(data.session?.user ? await cloudUser(data.session.user) : null);
        }
        if (data.session) restoreAfterOAuth();
        setAuthReady(true);
        refresh();
      })
      .catch(err => {
        console.warn('Session init:', err);
        setAuthReady(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(async () => {
        if (!active) return;
        setUserS(session?.user ? await cloudUser(session.user) : null);
        if (event === 'SIGNED_IN' && session) restoreAfterOAuth();
        setAuthReady(true);
        refresh();
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    refresh();
    const hash = () => {
      setRoute(location.hash.slice(1) || '/');
      scrollTo({ top: 0 });
    };
    // أقل تكرارًا + لا نطلب تحديثًا والصفحة في الخلفية (يخفف الحمل مع كثرة المستخدمين)
    const timer = window.setInterval(() => { if (!document.hidden) refresh(); }, 180_000);
    addEventListener('hashchange', hash);
    return () => {
      removeEventListener('hashchange', hash);
      clearInterval(timer);
    };
  }, []);

  // تسجيل زيارة الموقع للتقارير اليومية (لا يعطّل الواجهة)
  useEffect(() => {
    if (!authReady) return;
    const id = window.setTimeout(() => { trackVisit(route.split('?')[0] || '/'); }, 600);
    return () => window.clearTimeout(id);
  }, [route, authReady]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    save('at_lang', lang);
  }, [lang]);

  const value: Ctx = {
    lang,
    setLang,
    t: (ar, en) => (lang === 'ar' ? ar : en),
    user,
    authReady,
    cloudEnabled: isSupabaseConfigured,
    setUser: u => {
      const next = normalizeUser(u);
      setUserS(next);
      if (!isSupabaseConfigured) save(USER_KEY, next);
    },
    signUp: async input => {
      const result = await api.signUp(input);
      if (result.user) {
        setUserS(result.user);
        if (!isSupabaseConfigured) save(USER_KEY, result.user);
      }
      setListings(await api.listings());
      return { confirmationRequired: result.confirmationRequired };
    },
    signIn: async (email, password) => {
      const next = await api.signIn(email, password);
      setUserS(next);
      if (!isSupabaseConfigured) save(USER_KEY, next);
      setListings(await api.listings());
    },
    signInGoogle: api.signInGoogle,
    signOut: async () => {
      await api.signOut();
      setUserS(null);
      setListings(await api.listings());
    },
    favs,
    toggleFav: id =>
      setFavs(current => {
        const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
        save('at_favs', next);
        return next;
      }),
    compare,
    toggleCompare: id =>
      setCompare(current => (current.includes(id) ? current.filter(x => x !== id) : current.length >= 3 ? current : [...current, id])),
    clearCompare: () => setCompare([]),
    authOpen,
    setAuthOpen,
    listings,
    refresh,
    publishListing: async p => {
      if (!user) throw new Error('LOGIN_REQUIRED');
      const item = await api.addListing(p, user);
      setListings(await api.listings());
      return item;
    },
    editListing: async p => {
      if (!user) throw new Error('LOGIN_REQUIRED');
      const item = await api.updateListing(p, user.id);
      setListings(await api.listings());
      return item;
    },
    removeListing: async id => {
      if (!user) throw new Error('LOGIN_REQUIRED');
      await api.deleteListing(id, user.id);
      setListings(await api.listings());
      return true;
    },
    reviewListing: async (id, status) => {
      if (!user?.isAdmin) throw new Error('ADMIN_REQUIRED');
      await api.reviewListing(id, status);
      setListings(await api.listings());
    },
    uploadMedia: async (file, folder = 'properties') => {
      if (!user) throw new Error('LOGIN_REQUIRED');
      const url = await api.uploadMedia(file, user, folder);
      if (!url) throw new Error('CLOUD_STORAGE_NOT_CONFIGURED');
      return url;
    },
    recordView: id => {
      api.recordView(id).then(refresh);
    },
    recordPhoneView: id => {
      api.recordPhoneView(id).then(refresh);
    },
    authNotice,
    clearAuthNotice: () => setAuthNotice(''),
    route,
    go: r => {
      location.hash = r;
    },
  };

  return <C.Provider value={value}>{children}</C.Provider>;
}
