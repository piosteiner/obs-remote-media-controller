# Frontend Deployment - Simple Guide

## ✅ Recommended Method: Manual Deploy with gh-pages

This is the **simplest and most reliable** method.

---

## One-Time Setup

### 1. Install Node.js Dependencies

Only needs to be done once on your Windows PC:

```powershell
cd frontend
npm install
```

### 2. Configure GitHub Pages

Go to: https://github.com/piosteiner/obs-remote-media-controller/settings/pages

Settings:
- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `root`
- **Custom domain**: `obs-media-control.piogino.ch`
- **Enforce HTTPS**: ✅

### 3. Configure DNS

Add CNAME record in your DNS provider:

```
Type: CNAME
Name: obs-media-control
Target: piosteiner.github.io.
TTL: 3600
```

---

## Deploy Frontend (Anytime You Make Changes)

From your Windows PC command prompt:

```cmd
cd C:\Users\piogi\OneDrive\Coding\Git\obs-webplugin\frontend
npm run deploy
```

That's it! This command:
1. Builds your frontend (compiles React code)
2. Pushes to `gh-pages` branch
3. GitHub Pages automatically serves the new version

**Wait 1-2 minutes**, then visit: `https://obs-media-control.piogino.ch`

---

## How It Works

```
Your Windows PC                    GitHub                       Users
──────────────                     ──────                       ─────

1. Edit code in VSCode
2. cd frontend
   npm run deploy        ──────>   Pushes to gh-pages    ────> Site updates at
                                    branch automatically         obs-media-control
                                                                .piogino.ch
```

---

## Workflow

### Making Changes

```powershell
# 1. Edit frontend files in VSCode
# ... make your changes ...

# 2. Test locally (optional)
cd frontend
npm run dev
# Visit http://localhost:5173

# 3. Deploy to production
npm run deploy

# Done! Changes are live in 1-2 minutes
```

### First Deployment Checklist

- ✅ Node.js installed
- ✅ `npm install` run in frontend folder
- ✅ GitHub Pages settings configured
- ✅ DNS CNAME record added
- ✅ Run `npm run deploy`
- ⏳ Wait 5-10 minutes for DNS propagation
- ✅ Visit site!

---

## Advantages of This Method

✅ **Simple**: One command to deploy  
✅ **Reliable**: No complex CI/CD setup  
✅ **No Secrets**: No need to configure GitHub secrets  
✅ **Fast**: Deploys in 30 seconds  
✅ **Works**: Already tested and working  

---

## Troubleshooting

### DNS not resolving

Check DNS propagation:
```powershell
nslookup obs-media-control.piogino.ch
```

Should return: `piosteiner.github.io`

### Site shows 404

- Wait 10 minutes after first deploy
- Check `gh-pages` branch exists: https://github.com/piosteiner/obs-remote-media-controller/tree/gh-pages
- Verify GitHub Pages settings are correct

### Changes not appearing

- Hard refresh browser: `Ctrl + Shift + R`
- Clear browser cache
- Wait 2-3 minutes for GitHub Pages to update

### `npm run deploy` fails

```powershell
cd frontend
npm install  # Reinstall dependencies
npm run deploy
```

---

## Backend Configuration

The frontend is configured to connect to your backend at:
```
https://api.piogino.ch/obs
```

This is set in `frontend/.env.production` and is baked into the build.

If you need to change the backend URL:
1. Edit `frontend/.env.production`
2. Run `npm run deploy` again

---

## Summary

**To deploy frontend updates:**
```cmd
cd frontend
npm run deploy
```

**To update backend URL:**
1. Edit `frontend/.env.production`
2. Run `npm run deploy`

**That's it!** Simple, reliable, and it works. 🚀

---

## Why Not GitHub Actions?

GitHub Actions (automated CI/CD) is more complex and requires:
- Configuring secrets
- Setting up proper permissions
- Debugging workflow files
- Managing artifacts

The `gh-pages` method is simpler and perfect for this project!
