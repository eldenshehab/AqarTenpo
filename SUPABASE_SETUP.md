# AqarTenpo Production Setup

The live app reads the Supabase project URL and **publishable anon key** from Vite variables. Never put a
Supabase service-role key or Google OAuth client secret in this project or in a `VITE_` variable.

## 1. Apply database migrations in order

In Supabase Dashboard → SQL Editor, run these files **one at a time and in order**:

1. `supabase/migrations/001_aqartenpo_complete.sql`
2. `supabase/migrations/002_analytics.sql`
3. `supabase/migrations/003_security_hardening.sql`
4. `supabase/migrations/004_admin_and_storage.sql`

Migration 004 is particularly important if image uploads currently fail: it ensures the `property-media`
bucket exists, sets the 12 MB bucket limit, recreates the authenticated-user folder upload policy, and promotes
`mohamedsjeha0@gmail.com` to admin. It is idempotent and may safely be run again if unsure whether it completed.

## 2. Vercel environment variables

Vercel → project `aqar-tenpo` → Settings → Environment Variables. Set Production, Preview and Development:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL, e.g. `https://your-ref.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `VITE_SITE_URL` | `https://aqar-tenpo.vercel.app` |
| `VITE_ADMIN_EMAIL` | `mohamedsjeha0@gmail.com` |
| `VITE_PLATFORM_PHONE` | AqarTenpo managed-listing phone, digits with country code |

Change `VITE_ADMIN_EMAIL` to the requested Gmail and **redeploy**. Vite inlines `VITE_` values at build time.
The existing client side also defaults the admin email to `mohamedsjeha0@gmail.com`, but explicitly setting the
Vercel variable avoids an old deployment value taking precedence.

## 3. Make the Google Gmail account admin

1. Sign in once with Google using `mohamedsjeha0@gmail.com` so Supabase has the Auth user.
2. Run `004_admin_and_storage.sql` in the Supabase SQL Editor. It promotes that existing profile and updates the
   auth trigger and the restricted admin-claim function for future sign-ins.
3. Sign out and back in. `/admin` should show the admin dashboard.

To explicitly inspect the profile from the SQL Editor:

```sql
select email, role from public.profiles where lower(email) = 'mohamedsjeha0@gmail.com';
```

Expected: `role = admin`. The app does **not** grant cloud admin based on the email in the browser; the database
profile role is authoritative. The password for this Gmail remains the password managed by Google.

## 4. Google OAuth settings

Supabase → Authentication → URL Configuration:

- Site URL: `https://aqar-tenpo.vercel.app`
- Redirect URL: `https://aqar-tenpo.vercel.app/**`

Supabase → Authentication → Providers → Google:

- Enable Google.
- Add the Google Web Client ID and Client Secret **in Supabase only**.
- Copy the Supabase callback URL shown on that page; it looks like
  `https://your-ref.supabase.co/auth/v1/callback`.

Google Cloud Console → Credentials → your OAuth Web Client:

- Authorized JavaScript origin: `https://aqar-tenpo.vercel.app`
- Authorized redirect URI: the Supabase callback URL above. Do **not** put `/api/auth/callback/google` here.

If the Google consent screen is in Testing, add the sign-in account under Test Users or publish the consent screen.
The site status page `/#/status` displays the exact callback URL and checks whether the Google provider is enabled.

## 5. If image upload fails

First make sure `004_admin_and_storage.sql` has been run. The browser uploader compresses images to JPEG and
uploads to `property-media/{auth-user-id}/{folder}/{random-id}.jpg`; the bucket limit is 12 MB and the client
refuses compressed images over 10 MB. The upload error shown in the form includes Supabase's actual error code.

After running/fixing the Storage policy, sign out and back in to refresh the Auth session, then retry. The status
page `/#/status` also checks that the `property-media` bucket is reachable.

## 6. Managed phone-number rules

- Regular direct listings: the owner phone is available to visitors.
- AqarTenpo brokerage and contract-assignment listings: visitors get the AqarTenpo contact only. The seller
  phone remains in `listing_contacts` and is visible to the listing owner and admin only.
- These rules are enforced by Supabase RLS, not only by hiding UI elements.