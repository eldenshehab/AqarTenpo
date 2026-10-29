import { useEffect, useState } from 'react';

export function readBox<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}
export function writeBox<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Could not persist data:', error);
  }
  window.dispatchEvent(new Event('at-box'));
}
export function useBox<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readBox(key, fallback));
  useEffect(() => {
    const sync = () => setValue(readBox(key, fallback));
    window.addEventListener('at-box', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('at-box', sync);
      window.removeEventListener('storage', sync);
    };
  }, [key]);
  return [value, (next: T) => { writeBox(key, next); setValue(next); }] as const;
}

export interface SavedSearch { id: string; userId: string; label: string; createdAt: number; locations: string[]; category: string; subtype: string; maxPrice: number; minArea: number; deal: string; status: string }
export interface ListingReport { id: string; propertyId: string; reason: string; note: string; at: number }
export interface Lead { id: string; propertyId: string; ownerId?: string; brokerId?: string; name: string; phone: string; kind: 'tour' | 'phone' | 'inquiry'; note: string; at: number }
export interface CollabPost { id: string; brokerId: string; brokerName: string; title: string; city: string; budget: number; currency: string; commission: string; note: string; at: number; responses: { name: string; note: string; at: number }[] }

export const addLead = (lead: Omit<Lead, 'id' | 'at'>) => {
  const all = readBox<Lead[]>('at_leads', []);
  writeBox('at_leads', [{ ...lead, id: 'ld' + Date.now(), at: Date.now() }, ...all]);
};
