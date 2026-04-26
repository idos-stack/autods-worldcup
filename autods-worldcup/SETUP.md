# AutoDS WorldCup 2026 — Setup Guide

Follow these steps once and the platform runs itself.

---

## What you need (all free)

| Service | Why | Sign-up link |
|---------|-----|-------------|
| **Supabase** | Database + Google login | https://supabase.com |
| **Vercel** | Hosting + auto-deploys | https://vercel.com |
| **GitHub** | Code storage | https://github.com |
| **football-data.org** | Official FIFA data feed (see note below) | https://www.football-data.org |
| **Google Cloud Console** | OAuth for Google login | https://console.cloud.google.com |

---

## A note on the data source

FIFA.com does not offer a public API. The platform uses **football-data.org**, which is an officially licensed data aggregator that sources match results, scores, and statistics directly from FIFA's official data feeds — the same data that appears on fifa.com. This is the standard approach used by ESPN, BBC Sport, and other major sports platforms. The data is accurate and matches fifa.com in real time.

---

## Step 1 — Get the code on GitHub

1. Create a new **private** GitHub repository named `autods-worldcup`.
2. Upload the project folder (this folder) to that repository.
   - Or run: `git init && git add . && git commit -m "init" && git remote add origin YOUR_REPO_URL && git push -u origin main`

---

## Step 2 — Set up Supabase

1. Go to https://supabase.com → **New project**.
2. Name it `autods-worldcup`, choose a strong password, pick the **EU West** region.
3. Once created, click **SQL Editor** → paste the entire contents of `supabase/schema.sql` → click **Run**.
4. Go to **Authentication → Providers → Google** and enable it (you'll need a Client ID and Secret from Step 3).
5. Set the **Site URL** to your Vercel URL (you can update this after Step 4 too).
6. Add `https://YOUR_VERCEL_URL/auth/callback` to the **Redirect URLs** list.

---

## Step 3 — Set up Google OAuth

1. Go to https://console.cloud.google.com → create or select a project.
2. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Application type: **Web application**.
4. Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as an Authorised redirect URI.
5. Copy the **Client ID** and **Client Secret** — paste them into Supabase (Step 2 → Authentication → Google provider).

---

## Step 4 — Deploy on Vercel

1. Go to https://vercel.com → **Add New Project** → import your GitHub repo.
2. Framework: **Next.js** (auto-detected).
3. In **Environment Variables**, add all of the following:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `FOOTBALL_DATA_API_KEY` | football-data.org → My Account → API token |
| `ADMIN_EMAILS` | Your AutoDS email, e.g. `ido@autods.com` |
| `CRON_SECRET` | Any long random string, e.g. `wX9kZ2...` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://autods-worldcup.vercel.app` |

4. Click **Deploy**. Your platform is live! 🚀

---

## Step 5 — Make yourself an admin

1. Sign in to the platform with your AutoDS Google account.
2. In Supabase → **Table Editor → profiles** → find your row → set `is_admin = true`.
3. Refresh the app — the Admin tab appears in the bottom navigation.

---

## Step 6 — Set the Sync Cron (automatic)

The cron job is already configured in `vercel.json` to run every 15 minutes. Vercel picks this up automatically on deploy. No extra setup needed.

To test the sync manually, call:
```
POST https://YOUR_APP/api/sync
Authorization: Bearer YOUR_CRON_SECRET
```

---

## Step 7 — UCL Test Version

To deploy the Champions League test version:
1. Create a second Vercel project from the same GitHub repo.
2. In `app/api/sync/route.ts`, change `WC_2026_ID` to the UCL competition ID (e.g. `2001` for Champions League on football-data.org).
3. Deploy as a separate Vercel project with its own environment variables.

---

## Day-to-day

| Task | How |
|------|-----|
| View standings | The platform updates automatically every 15 min |
| Add an admin | Supabase → profiles → set `is_admin = true` |
| Remove a contestant | Admin dashboard → Contestants tab → Remove |
| Adjust a score | Admin dashboard → Contestants tab → Score |
| Check sync status | Supabase → Table Editor → sync_log |

---

## Questions?

The platform is fully automatic. If something looks wrong, check **Supabase → sync_log** for error messages.
