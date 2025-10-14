# Frontend Deployment Guide - GitHub Pages

## Overview

Deploy the React frontend to GitHub Pages at `obs-media-control.piogino.ch`

**Requirements:**
- GitHub repository: `piosteiner/obs-remote-media-controller`
- Custom domain: `obs-media-control.piogino.ch` configured in DNS
- Backend API: Running on Infomaniak VPS (83.228.207.199)

---

## Prerequisites

### 1. Configure DNS

Add CNAME record in your DNS settings:

```
CNAME  obs-media-control  piosteiner.github.io.
```

Or if using apex/root domain:

```
A      obs-media-control  185.199.108.153
A      obs-media-control  185.199.109.153
A      obs-media-control  185.199.110.153
A      obs-media-control  185.199.111.153
```

### 2. Configure Backend URL

Create `frontend/.env.production`:

```env
# Option A: If using api.piogino.ch subdomain
VITE_API_BASE_URL=https://api.piogino.ch
VITE_WS_URL=https://api.piogino.ch

# Option B: If using direct IP with port
# VITE_API_BASE_URL=https://83.228.207.199:3001
# VITE_WS_URL=https://83.228.207.199:3001
```

---

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Build
      run: |
        cd frontend
        npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        VITE_WS_URL: ${{ secrets.VITE_WS_URL }}
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
      
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: 'frontend/dist'
        
    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4
```

#### Setup GitHub Secrets

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `VITE_API_BASE_URL`: `https://api.piogino.ch` (or your IP)
   - `VITE_WS_URL`: `https://api.piogino.ch`

#### Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Custom domain: `obs-media-control.piogino.ch`
4. ✅ Enforce HTTPS

#### Deploy

```powershell
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

GitHub Actions will automatically build and deploy!

---

### Method 2: Manual Deployment with gh-pages

#### Install gh-pages

```powershell
cd frontend
npm install -D gh-pages
```

#### Add Deploy Scripts

Edit `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### Deploy

```powershell
cd frontend
npm run deploy
```

#### Configure Custom Domain

1. Create `frontend/public/CNAME` file:
   ```
   obs-media-control.piogino.ch
   ```

2. Redeploy:
   ```powershell
   npm run deploy
   ```

---

### Method 3: Manual Upload

#### Build Locally

```powershell
cd frontend
npm install
npm run build
```

#### Upload to GitHub

The `dist` folder contains your built site. Push it to `gh-pages` branch:

```powershell
cd dist
git init
git checkout -b gh-pages
git add .
git commit -m "Deploy to GitHub Pages"
git remote add origin https://github.com/piosteiner/obs-remote-media-controller.git
git push -f origin gh-pages
```

---

## Verification

### 1. Check Deployment

Visit: `https://obs-media-control.piogino.ch`

You should see the app loading.

### 2. Check Backend Connection

Open browser console (F12) and look for:

```
✅ WebSocket connected: abc123
```

If you see "Disconnected", check:
- Backend is running: `pm2 status` on VPS
- CORS allows your domain
- Firewall allows connections

### 3. Test Full Workflow

1. **Control Panel**: `https://obs-media-control.piogino.ch/control`
2. **Upload image** or paste URL
3. **Check Display page**: `https://obs-media-control.piogino.ch/display?slot=1`
4. Image should appear with fade transition

---

## OBS Browser Source Configuration

### Setup in OBS

1. **Add Browser Source**
2. **Configure:**
   - URL: `https://obs-media-control.piogino.ch/display?slot=1`
   - Width: `1920` (your resolution)
   - Height: `1080` (your resolution)
   - Custom CSS:
     ```css
     body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
     ```
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

### Multiple Slots

Create separate sources:
- Slot 1: `https://obs-media-control.piogino.ch/display?slot=1`
- Slot 2: `https://obs-media-control.piogino.ch/display?slot=2`
- Slot 3: `https://obs-media-control.piogino.ch/display?slot=3`

---

## Local Development

For local development, frontend still proxies to your VPS:

```powershell
cd frontend
npm run dev
```

Access at: `http://localhost:5173`

The `vite.config.js` proxy sends API requests to your VPS during development.

---

## Updating the Site

### Using GitHub Actions

```powershell
# Make changes
git add .
git commit -m "Update feature X"
git push origin main
```

Auto-deploys in ~2 minutes!

### Using gh-pages

```powershell
cd frontend
npm run deploy
```

### Force Rebuild

Sometimes GitHub Pages caches. To force rebuild:

1. Go to **Actions** tab
2. Click latest workflow
3. **Re-run jobs**

---

## Troubleshooting

### Site shows 404

- Check DNS propagation: `nslookup obs-media-control.piogino.ch`
- Verify CNAME file exists in built site
- Check GitHub Pages settings

### Backend connection fails

**CORS Error:**
- Backend `.env`: `ALLOWED_ORIGINS=https://obs-media-control.piogino.ch`
- Restart backend: `pm2 restart obs-media-controller`

**WebSocket fails:**
- Check Nginx WebSocket config
- Verify SSL certificate valid
- Test WebSocket: `wscat -c wss://api.piogino.ch`

### Images don't load

- Check browser console for errors
- Verify backend uploads directory: `ls ~/obs-remote-media-controller/backend/uploads`
- Check Nginx serves `/uploads` path

### SSL Certificate issues

```bash
# Renew Let's Encrypt
sudo certbot renew

# Check expiry
sudo certbot certificates
```

---

## Performance Optimization

### Enable Caching

Add to `frontend/public/_headers`:

```
/*
  Cache-Control: public, max-age=3600
  
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Compress Assets

GitHub Pages automatically serves gzip.

### Monitor Performance

Use Chrome DevTools:
- Lighthouse audit
- Network tab
- Performance profiling

---

## Security Checklist

- ✅ HTTPS enforced (GitHub Pages + custom domain)
- ✅ CORS restricted to your domain
- ✅ API on separate domain/IP
- ✅ No secrets in frontend code
- ✅ WebSocket uses WSS (secure)
- ✅ File upload size limited (10MB)
- ✅ Environment variables in `.env.production`

---

## Backup & Rollback

### View Previous Deployments

GitHub Actions keeps artifacts for 90 days.

### Rollback

```powershell
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout old version
git checkout <commit-hash>
git push -f origin main
```

---

## Custom Domain Setup Summary

1. **DNS**: CNAME `obs-media-control` → `piosteiner.github.io`
2. **GitHub**: Add custom domain in Settings → Pages
3. **Frontend**: Create `public/CNAME` file
4. **SSL**: Auto-generated by GitHub (takes ~1 hour)
5. **Verify**: Visit `https://obs-media-control.piogino.ch`

---

## Cost

**GitHub Pages:** FREE ✅
- 100GB bandwidth/month
- 1GB storage
- Unlimited builds

Perfect for this use case!

---

## Support

- **Build logs**: GitHub Actions tab
- **Pages status**: Settings → Pages
- **DNS check**: `dig obs-media-control.piogino.ch`
- **SSL check**: `openssl s_client -connect obs-media-control.piogino.ch:443`

---

**Your frontend will be live at `https://obs-media-control.piogino.ch`! 🚀**
