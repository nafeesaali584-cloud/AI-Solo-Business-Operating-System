# Production Deployment Guide: Hostinger Node.js Web App

This guide walks you through deploying **ClientPulse** to Hostinger's Node.js Web Application platform (which runs Next.js as a persistent, long-running Node server).

---

## 1. Prerequisites Checklist

Before creating the application in Hostinger:
* [ ] You have pushed your latest code to your **GitHub** account.
* [ ] You have your **PostgreSQL Database** ready (Supabase or Neon).
* [ ] You have your **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

---

## 2. Hostinger hPanel Configuration

In your **Hostinger hPanel** ([hpanel.hostinger.com](https://hpanel.hostinger.com)):

1. Navigate to **Websites** $\rightarrow$ **Create or Migrate a Website** $\rightarrow$ **Web Application** (or **Deploy from Git / JavaScript Frameworks**).
2. Choose **Next.js** from the framework dropdown.
3. Connect your **GitHub** account and select your `clientpulse` repository.
4. Set the following build and runtime settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework** | `Next.js` | Full-stack Next.js 14 App Router |
| **Node.js Version** | **`20.x`** | Select Node 20.x in Hostinger's dropdown (matches `"engines": { "node": ">=20.0.0" }`) |
| **Root Directory** | `./` | Root folder |
| **Build Command** | `npm run build` | Runs `next build` (Prisma client generated via `postinstall`) |
| **Start Command** | `npm run start` | Starts persistent Next.js server on designated port |

---

## 3. Environment Variables to Set in Hostinger

In Hostinger's **Environment Variables** panel, add the following variables before your first deploy:

```ini
# 1. Database Connection (Transaction Pooler - port 6543)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 2. Direct Database Connection (Direct - port 5432)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 3. Google Gemini AI API Key
GEMINI_API_KEY="AIzaSy..."

# 4. Optional Model Override (Default is gemini-3.5-flash-lite)
GEMINI_MODEL="gemini-3.5-flash-lite"

# 5. Security & Session Secret (32+ random characters)
SESSION_SECRET="c9a2e7f84b1d6e3c0a5b8f2e4d7a9c1b3f6e8d0a2c4e7b9f1a3d5c7e9b0d2f4a"

# 6. Canonical Production App URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# 7. Production Node Environment
NODE_ENV="production"
```

---

## 4. Database Schema Migration (Safety First)

### Why Manual Migration?
Running schema migrations automatically on every production build is risky because automated CI runners can race or lock tables during concurrent deploys. 

### How to apply your schema to production:
Run this **once** from your local terminal connected to your production `DATABASE_URL` (in your local `.env.local` or inline):

```bash
# Push Prisma schema to production PostgreSQL:
npx prisma db push
```

* This creates all necessary tables (`Lead`, `Client`, `Contact`, `Interaction`, `Proposal`, `Invoice`, `Deal`, `Task`, `Settings`, etc.).
* It verifies table integrity and warns you if any breaking changes exist before executing.
* Once pushed, all future Hostinger deployments simply connect to the existing schema safely.

---

## 5. Post-Deployment Verification Checklist

Once Hostinger shows "Active / Running", test these critical flows:

1. **Visit Production Domain**:
   * Open `https://yourdomain.com` $\rightarrow$ should immediately load the **Executive Dashboard (S1)**.
   * Verify the circular profile avatar loads in the top navigation.
2. **Theme Switching**:
   * Click the Sun/Moon toggle in the header $\rightarrow$ verify dark (`#0a0a0a`) and light (`#ffffff`) themes toggle and persist on refresh.
3. **Lead Engine & Deep Research**:
   * Go to `/leads` $\rightarrow$ verify the pre-seeded lead loads.
   * Click **`+ Add Single Lead`** $\rightarrow$ create a test lead.
   * Click into the lead card $\rightarrow$ click **`Search this business online (Deep Research)`**.
   * Confirm the **Competitor Pricing Snapshot** loads live web data with links.
4. **WhatsApp Direct Link**:
   * On any lead card, click **`Contact (Gate 1)`**.
   * Verify the generated draft loads, click **`Push to WhatsApp`**, and confirm WhatsApp Web/Desktop opens with the pre-filled unsent draft.
5. **Invoice Builder**:
   * Navigate to `/invoices/builder`.
   * Scroll down to **Payment Method & Settlement Route** $\rightarrow$ verify SadaPay (0% fee link `https://sadabiz.me/pay/nafeesaali`) is selected by default.
6. **Danger Zone & System Reset**:
   * Navigate to `/settings` $\rightarrow$ verify the Danger Zone requires typing `RESET` in all caps before buttons unlock.

---

## 6. Troubleshooting & Build Diagnostics

If Hostinger reports a build failure:

1. **Where to find logs in Hostinger**:
   * Go to **hPanel** $\rightarrow$ **Websites** $\rightarrow$ your site $\rightarrow$ **Deployments** (or **Build Logs** / **Runtime Logs**).
2. **Common issues and quick fixes**:
   * **Missing Environment Variables**: Ensure `DATABASE_URL`, `GEMINI_API_KEY`, and `NODE_ENV="production"` are saved in Hostinger's environment panel.
   * **Node Version Mismatch**: Ensure `20.x` is selected in Hostinger's Node dropdown.
   * **Database Connection Timeout**: Verify your Supabase/Neon project is not paused. Use port `6543` for connection pooling with `pgbouncer=true`.
3. **What information to share**:
   * Copy the exact error snippet from Hostinger's **Build Log** or **Runtime Log** (typically the last 15–20 lines showing the red error trace).
