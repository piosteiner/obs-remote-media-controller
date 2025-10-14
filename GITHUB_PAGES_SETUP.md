# GitHub Pages Deployment - Quick Setup

## What This Does

The GitHub Actions workflow will:
1. Build your frontend from the `frontend/` folder
2. Extract the built files from `frontend/dist/`
3. Deploy them to `gh-pages` branch with `index.html` at root
4. Serve at `https://obs-media-control.piogino.ch`

---

## Setup Steps

### 1. Configure GitHub Repository Settings

Go to: `https://github.com/piosteiner/obs-remote-media-controller/settings/pages`

**Settings:**
- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `root`
- **Custom domain**: `obs-media-control.piogino.ch`
- **Enforce HTTPS**: ✅ (checked)

### 2. Add GitHub Secrets

Go to: `https://github.com/piosteiner/obs-remote-media-controller/settings/secrets/actions`

Click **New repository secret** and add:

**Secret 1:**
- Name: `VITE_API_BASE_URL`
- Value: `https://api.piogino.ch` (or `https://83.228.207.199:3001` if no subdomain)

**Secret 2:**
- Name: `VITE_WS_URL`
- Value: `https://api.piogino.ch` (same as API URL)

### 3. Configure DNS

In your domain provider (Infomaniak?), add CNAME record:

**Type**: CNAME  
**Name**: `obs-media-control`  
**Target**: `piosteiner.github.io.`  
**TTL**: 3600

Or use A records if CNAME not available:
```
A  obs-media-control  185.199.108.153
A  obs-media-control  185.199.109.153
A  obs-media-control  185.199.110.153
A  obs-media-control  185.199.111.153
```

### 4. Deploy

```powershell
# Add all new files
git add .

# Commit
git commit -m "Setup GitHub Pages deployment with Actions"

# Push to trigger deployment
git push origin main
```

### 5. Monitor Deployment

Go to: `https://github.com/piosteiner/obs-remote-media-controller/actions`

You'll see the workflow running. Takes ~2-3 minutes.

### 6. Verify

Once deployed, visit:
- **Frontend**: `https://obs-media-control.piogino.ch`
- **Control Panel**: `https://obs-media-control.piogino.ch/control`
- **Display**: `https://obs-media-control.piogino.ch/display?slot=1`

---

## How It Works

```
┌─────────────────────────────────────────┐
│  You Push to main branch                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  GitHub Actions Workflow Triggers       │
│  - Checkout code                        │
│  - Install Node.js 18                   │
│  - npm ci in frontend/                  │
│  - npm run build in frontend/           │
│  - Uses VITE_API_BASE_URL secret        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  frontend/dist/ folder created          │
│  Contains:                              │
│  - index.html (at root)                 │
│  - assets/ (JS, CSS)                    │
│  - CNAME file                           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Deploy to gh-pages branch              │
│  (Only dist/ contents, flat structure)  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  GitHub Pages serves from gh-pages      │
│  at obs-media-control.piogino.ch        │
└─────────────────────────────────────────┘
```

---

## File Structure

**Before (Repository):**
```
obs-remote-media-controller/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← NEW
├── frontend/
│   ├── public/
│   │   └── CNAME               ← NEW
│   ├── src/
│   ├── index.html
│   └── package.json
└── backend/
```

**After Deploy (gh-pages branch):**
```
/ (root of gh-pages branch)
├── index.html                   ← At root!
├── assets/
│   ├── index-abc123.js
│   └── index-def456.css
└── CNAME
```

---

## Troubleshooting

### Workflow Fails

Check Actions tab for errors:
- **npm ci fails**: Delete `package-lock.json`, run `npm install`, commit
- **Build fails**: Check build locally: `cd frontend && npm run build`
- **Secrets missing**: Ensure secrets are added in repository settings

### 404 Error

- Wait 5-10 minutes for DNS propagation
- Check CNAME file in `gh-pages` branch
- Verify custom domain in GitHub Pages settings

### No gh-pages Branch

After first successful workflow run, the branch will be created automatically.

### CORS Errors

Backend `.env` must have:
```env
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch
```

Then restart backend:
```bash
pm2 restart obs-media-controller
```

---

## Manual Trigger

You can also trigger deployment manually:

1. Go to Actions tab
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Click green "Run workflow" button

---

## Update Workflow

Every time you push to `main`, it auto-deploys:

```powershell
# Make changes to frontend
cd frontend
# ... edit files ...

# Commit and push
git add .
git commit -m "Update feature"
git push origin main

# Auto-deploys in ~2 minutes!
```

---

## Local Testing

Test before deploying:

```powershell
cd frontend

# Install dependencies
npm install

# Run dev server (uses proxy to VPS)
npm run dev

# Build for production (test build works)
npm run build

# Preview production build locally
npm run preview
```

---

## Next Steps

1. ✅ Push code with workflow: `git push origin main`
2. ⏳ Wait for Actions to complete (~2 min)
3. ✅ Configure GitHub Pages settings
4. ✅ Add DNS CNAME record
5. ⏳ Wait for DNS propagation (up to 1 hour)
6. ✅ Visit `https://obs-media-control.piogino.ch`
7. 🎉 Done!

---

## Useful Links

- **Repository Settings**: https://github.com/piosteiner/obs-remote-media-controller/settings
- **GitHub Pages**: https://github.com/piosteiner/obs-remote-media-controller/settings/pages
- **Secrets**: https://github.com/piosteiner/obs-remote-media-controller/settings/secrets/actions
- **Actions**: https://github.com/piosteiner/obs-remote-media-controller/actions
- **Your Site**: https://obs-media-control.piogino.ch

---

**Everything is ready! Just push and it deploys automatically!** 🚀
