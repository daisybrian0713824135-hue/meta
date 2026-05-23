# MetaPay — Deployment Guide

## Option 1: Push to GitHub (Recommended First Step)

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Name it `metapay` (or any name)
3. Make it **Private** (recommended for production)
4. Do NOT initialize with README — your project already has one
5. Click **Create repository**
6. Copy the HTTPS URL (e.g. `https://github.com/yourusername/metapay.git`)

### Step 2: Push from Your Local Machine
```bash
# Download the ZIP from this conversation and extract it
cd /path/to/metapay

# Add your GitHub repo as remote
git remote add origin https://github.com/yourusername/metapay.git

# Rename the local branch to main (if needed)
git branch -M main

# Push everything
git push -u origin main
```

---

## Option 2: Deploy to Vercel

### Prerequisites
- A GitHub repo with your code (see Option 1 above)
- A Vercel account (free at [vercel.com](https://vercel.com))

### Step 1: Connect GitHub to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **Import Git Repository**
3. Authorize Vercel to access your GitHub
4. Find and select your `metapay` repo
5. Click **Import**

### Step 2: Configure Project Settings
Vercel should auto-detect Vite. Confirm these settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables
In the Vercel dashboard → Project Settings → Environment Variables, add:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Dashboard → Project Settings → API → `anon public` |

> ⚠️ **Never** add `SUPABASE_SERVICE_ROLE_KEY` or `PAYNECTA_WEBHOOK_SECRET` here — those are server secrets and should only live in Supabase Edge Functions.

### Step 4: Deploy
Click **Deploy**. Vercel will build and deploy your site. You'll get a URL like:
```
https://metapay.vercel.app
```

### Step 5: Custom Domain (Optional)
1. Vercel Dashboard → Domains
2. Add your domain (e.g. `metapay.co.ke`)
3. Update DNS records as instructed by Vercel

---

## Option 3: Deploy to Netlify (Alternative)

1. Go to [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Select your GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add the same environment variables as above
6. Deploy

---

## Option 4: Deploy to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
2. **Create a project** → Connect to Git
3. Select your repo
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variables
6. Deploy

---

## Post-Deployment Checklist

After deploying, update these critical settings in your **Supabase Dashboard**:

### 1. Update Site URL (Auth Settings)
- Go to **Authentication → URL Configuration**
- Set **Site URL** to your deployed domain (e.g. `https://metapay.vercel.app`)
- Add your domain to **Redirect URLs**:
  - `https://metapay.vercel.app`
  - `https://metapay.vercel.app/login`
  - `https://metapay.vercel.app/dashboard`

### 2. Update CORS Origins (Edge Functions)
- Go to **Edge Functions**
- Update CORS headers in `verify-payment` and `paynecta-webhook` to allow your domain

### 3. Configure Payment Webhook
In your **Paynecta Dashboard**, set the webhook URL to:
```
https://your-project.supabase.co/functions/v1/paynecta-webhook
```

### 4. Verify Admin Account
- Log in with `admin@miaoda.com` / `MetaPay@Admin2026#Xq7!`
- Go to **Admin Dashboard** → verify everything works

---

## File Structure Recap

```
metapay/
├── src/                    # React + TypeScript frontend
│   ├── components/         # UI components (shadcn/ui)
│   ├── pages/              # Route pages
│   ├── contexts/           # Auth context
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── db/                 # Supabase client
├── supabase/
│   ├── migrations/         # 4 SQL migrations (run in order)
│   └── functions/          # Edge Functions (verify-payment, paynecta-webhook)
├── vercel.json             # Vercel deployment config ✅
├── .env.example            # Environment variables template ✅
├── vite.config.ts
├── tailwind.config.ts
├── package.json
└── index.html
```

---

## Quick Reference: Commands

```bash
# Local development
npm install
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

---

## Need Help?

If deployment fails:
1. Check `npm run build` works locally first
2. Verify environment variables are set correctly in Vercel
3. Check Vercel build logs for errors
4. Ensure Supabase project is active and migrations are applied
