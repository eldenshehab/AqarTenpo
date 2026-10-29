import type { Property } from './data';

/* The number buyers call for listings that AqarTenpo manages (assignments and brokerage).
   Set VITE_PLATFORM_PHONE in Vercel with the real company number. */
export const PLATFORM_PHONE = String(import.meta.env.VITE_PLATFORM_PHONE || '201000000000').replace(/\D/g, '');
export const PLATFORM_PHONE_DISPLAY = `+${PLATFORM_PHONE}`;

/* Managed listings: AqarTenpo publishes them and talks to buyers. The owner's number stays
   private and only the admin can read it. Every other listing shows its owner's number. */
export const isManaged = (p: Pick<Property, 'assignment' | 'mode'>) => Boolean(p.assignment) || p.mode === 'brokerage';

/* True only when a user is logged in AND the listing has an owner AND they match.
   (Plain `p.ownerId === user?.id` is true when both are undefined, which would leak private data.) */
export const isOwnerOf = (p: Pick<Property, 'ownerId'>, user: { id: string } | null | undefined) =>
  Boolean(user && p.ownerId && p.ownerId === user.id);
