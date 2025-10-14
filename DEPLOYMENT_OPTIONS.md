# Deployment Options - Choose One

## ❌ Why You Can't Just Move index.html

The `frontend/index.html` references source files (`/src/main.jsx`) that need to be:
- Compiled (JSX → JS)
- Bundled (all modules combined)
- Optimized (minified, tree-shaken)

Moving `index.html` alone won't work - you need the **built** files.

---

## ✅ Option 1: Manual Deploy with gh-pages (SIMPLEST)

I've already added this to your `package.json`!

### Setup Once:

```powershell
# Install dependencies
cd frontend
npm install

# Configure production backend URL
# Edit frontend/.env.production (already done)
```

### Deploy Anytime:

```powershell
cd frontend
npm run deploy
```

That's it! This command:
1. Builds your frontend (`npm run build`)
2. Pushes `dist/` contents to `gh-pages` branch
3. `index.html` is at root in that branch ✅

### After First Deploy:

Configure GitHub Pages:
1. Go to: https://github.com/piosteiner/obs-remote-media-controller/settings/pages
2. Source: **gh-pages** branch
3. Custom domain: `obs-media-control.piogino.ch`

---

## ✅ Option 2: GitHub Actions (AUTOMATIC)

Already configured in `.github/workflows/deploy.yml`

### Setup Once:

1. Add GitHub Secrets (see GITHUB_PAGES_SETUP.md)
2. Configure GitHub Pages settings

### Deploy Anytime:

```powershell
git push origin main
```

Auto-deploys in 2 minutes! No manual build needed.

---

## Comparison

| Method | Command | Pros | Cons |
|--------|---------|------|------|
| **gh-pages** | `npm run deploy` | ✅ Simple<br>✅ One command<br>✅ Local control | ⚠️ Manual each time |
| **GitHub Actions** | `git push` | ✅ Fully automatic<br>✅ No build locally<br>✅ CI/CD | ⚠️ Secrets setup needed |

---

## Recommended: Use gh-pages

For you, I recommend **Option 1 (gh-pages)** because:
- ✅ No secrets to configure
- ✅ One command: `npm run deploy`
- ✅ Works immediately
- ✅ Already added to your package.json

---

## Quick Start with gh-pages:

```powershell
# 1. Install dependencies (if not done)
cd frontend
npm install

# 2. Deploy!
npm run deploy

# 3. Configure GitHub Pages (one time)
# Go to repo settings → Pages → Select gh-pages branch

# 4. Add DNS CNAME record
# obs-media-control → piosteiner.github.io
```

---

## Why Not Move index.html to Root?

```
❌ Moving index.html alone:
/
├── index.html           ← Points to /src/main.jsx
└── src/
    └── main.jsx         ← Source code, browser can't run this

✅ After build (what gets deployed):
/
├── index.html           ← Points to /assets/index-abc123.js
└── assets/
    └── index-abc123.js  ← Compiled, bundled, optimized code ✅
```

You MUST build first - that's what `npm run deploy` does automatically!

---

## Next Steps:

1. Run `cd frontend && npm install` (installs gh-pages)
2. Run `npm run deploy` (builds and deploys)
3. Configure GitHub Pages settings
4. Add DNS record
5. Done! 🎉

Much simpler than moving files manually!
