# MetaPay — Netlify Deployment Guide

## Quick Overview

This package contains two ZIP files:

| File | Purpose |
|------|---------|
| `project_source.zip` | Full editable source code for development |
| `project_deploy.zip` | Pre-built production files — ready to upload to Netlify instantly |

---

## Method 1: Drag & Drop Deploy (FASTEST — 30 seconds)

No account signup, no command line, no GitHub required.

### Step 1: Go to Netlify Drop
Open [app.netlify.com/drop](https://app.netlify.com/drop) in your browser.

### Step 2: Upload
Drag and drop the **`project_deploy.zip`** file onto the page (or click to browse).

### Step 3: Done
Netlify instantly unpacks, deploys, and gives you a live URL like:
```
https://vocal-croissant-12345.netlify.app
```

The site is live immediately. Share the URL or add a custom domain later.

---

## Method 2: Deploy from Source (Git-based)

Use this if you want continuous deployment (auto-deploy on every code push).

### Step 1: Extract Source
```bash
unzip project_source.zip -d metapay
cd metapay
```

### Step 2: Create `.env` File
Create a `.env` file in the project root:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Get these from your Supabase Dashboard → Project Settings → API.

### Step 3: Install & Build
```bash
npm install
npm run build
```

### Step 4: Create a Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

### Step 5: Push to GitHub (or GitLab/Bitbucket)
```bash
git remote add origin https://github.com/YOURNAME/metapay.git
git push -u origin main
```

### Step 6: Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Select your Git provider and repository
4. Netlify auto-detects the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy site**

---

## Development Guide (project_source.zip)

### Prerequisites
- Node.js 18+ and npm

### Setup
```bash
# Extract and enter project
unzip project_source.zip -d metapay
cd metapay

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The dev server runs at `http://localhost:5173` by default.

### Build for Production
```bash
npm run build
```

Output goes to `dist/` — this is exactly what `project_deploy.zip` contains.

### Preview Production Build Locally
```bash
npm run preview
```

---

## Post-Deployment Checklist

After deploying, update these in your **Supabase Dashboard**:

1. **Site URL** (Authentication → URL Configuration)
   - Set to your Netlify domain: `https://your-site.netlify.app`
   - Add redirect URLs:
     - `https://your-site.netlify.app`
     - `https://your-site.netlify.app/login`
     - `https://your-site.netlify.app/dashboard`

2. **Edge Functions CORS**
   - In Supabase Edge Functions, update CORS origins to include your Netlify domain.

3. **Payment Webhook**
   - In your Paynecta Dashboard, set webhook URL to:
     ```
     https://your-project.supabase.co/functions/v1/paynecta-webhook
     ```

4. **Admin Login**
   - Email: `admin@miaoda.com`
   - Password: `MetaPay@Admin2026#Xq7!`

---

## What Was Fixed for Deployment

| Issue | Fix |
|-------|-----|
| `package.json` build/dev scripts were dummy echo commands | Replaced with real `vite build` and `vite dev` commands |
| `vite.config.ts` included `miaodaDevPlugin()` (dev-only) | Removed dev-only plugin, added production build config |
| No SPA redirect handling | Added `_redirects` file and `netlify.toml` with `/* → /index.html` |
| No Netlify config | Created `netlify.toml` with build settings and security headers |

---

## File Structure

```
project_source/
├── src/                    # React + TypeScript frontend
│   ├── components/         # shadcn/ui components
│   ├── pages/              # Route pages
│   ├── contexts/           # Auth context
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── db/                 # Supabase client
├── public/                 # Static assets
├── supabase/
│   ├── migrations/         # SQL schema migrations
│   └── functions/          # Edge Functions
├── package.json
├── vite.config.ts          # Production Vite config
├── vite.config.dev.ts      # Development Vite config
├── tailwind.config.js
├── tsconfig.json
├── netlify.toml            # Netlify deployment config
├── _redirects              # SPA routing fallback
└── DEPLOYMENT_GUIDE.md
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page after deploy | Check browser console for 404s on JS/CSS. Ensure `_redirects` is in `public/` |
| "Cannot GET /dashboard" | SPA routing not configured — `_redirects` handles this |
| Build fails with `miaodaDevPlugin` error | Use the updated `vite.config.ts` (dev plugin removed) |
| Supabase auth not working | Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly |

---

## Tech Stack

- React 18 + TypeScript
- Vite (production build tool)
- React Router v7
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions)
- Recharts (charts)
- Framer Motion (animations)
- Lucide React (icons)
