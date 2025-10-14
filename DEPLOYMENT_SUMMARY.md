# Deployment Summary

## ✅ What's Ready

Both frontend and backend are **100% complete** and ready for deployment!

---

## 🏗️ Infrastructure

### Frontend (GitHub Pages)
- **URL**: `https://obs-media-control.piogino.ch`
- **Hosting**: GitHub Pages (FREE)
- **Deployment**: Automated via GitHub Actions
- **Files**: `.github/workflows/deploy.yml` ✅

### Backend (Infomaniak VPS)
- **Server**: 83.228.207.199
- **URL**: `https://api.piogino.ch` (or direct IP)
- **Stack**: Node.js + Express + Socket.io
- **Process Manager**: PM2

---

## 🚀 Deployment Steps

### 1. Deploy Backend First (15 minutes)

SSH into your Infomaniak VPS:

```bash
ssh user@83.228.207.199

# Clone repo
git clone https://github.com/piosteiner/obs-remote-media-controller.git
cd obs-remote-media-controller/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
```

Set in `.env`:
```env
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

```bash
# Create directories
mkdir -p uploads logs

# Install PM2
sudo npm install -g pm2

# Start backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Configure Nginx (see `backend/DEPLOY.md` for full config), then:

```bash
# Setup SSL
sudo certbot --nginx -d api.piogino.ch

# Test
curl https://api.piogino.ch/api/health
```

---

### 2. Deploy Frontend to GitHub Pages (5 minutes)

#### a. Configure GitHub Repository

Go to: https://github.com/piosteiner/obs-remote-media-controller/settings/pages

- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `root`
- **Custom domain**: `obs-media-control.piogino.ch`
- **Enforce HTTPS**: ✅

#### b. Add GitHub Secrets

Go to: https://github.com/piosteiner/obs-remote-media-controller/settings/secrets/actions

Add two secrets:

1. **VITE_API_BASE_URL**
   - Value: `https://api.piogino.ch`

2. **VITE_WS_URL**
   - Value: `https://api.piogino.ch`

#### c. Configure DNS

Add CNAME record in your DNS (Infomaniak):

```
Type: CNAME
Name: obs-media-control
Target: piosteiner.github.io.
TTL: 3600
```

#### d. Push to Deploy

```powershell
# Add all files
git add .

# Commit
git commit -m "Setup deployment with GitHub Actions"

# Push (triggers auto-deploy)
git push origin main
```

Watch deployment: https://github.com/piosteiner/obs-remote-media-controller/actions

---

### 3. Configure OBS (2 minutes)

In OBS Studio:

1. **Add Browser Source**
2. **Settings:**
   - Name: "Image Slot 1"
   - URL: `https://obs-media-control.piogino.ch/display?slot=1`
   - Width: 1920
   - Height: 1080
   - Custom CSS:
     ```css
     body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
     ```
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

3. **Create more slots** (optional):
   - Slot 2: `...display?slot=2`
   - Slot 3: `...display?slot=3`

---

## 🧪 Testing

### 1. Test Backend

```bash
# From VPS
curl https://api.piogino.ch/api/health

# Expected:
{"status":"ok","timestamp":"..."}
```

### 2. Test Frontend

Visit in browser:
- `https://obs-media-control.piogino.ch`
- Should see the app load

### 3. Test Control Panel

1. Go to: `https://obs-media-control.piogino.ch/control`
2. Check top-right: Should show "✅ Connected"
3. Upload an image or paste URL
4. Check display page: `https://obs-media-control.piogino.ch/display?slot=1`
5. Image should appear instantly!

### 4. Test OBS

1. Open OBS with Browser Source configured
2. Update image from Control Panel
3. Watch OBS Browser Source update in real-time

---

## 🔍 Verification Checklist

### Backend
- [ ] PM2 shows "online": `pm2 status`
- [ ] Health endpoint works: `curl https://api.piogino.ch/api/health`
- [ ] Nginx config correct
- [ ] SSL certificate valid
- [ ] Firewall allows port 80, 443
- [ ] CORS allows GitHub Pages domain

### Frontend
- [ ] GitHub Actions workflow succeeded
- [ ] `gh-pages` branch exists
- [ ] Custom domain configured in GitHub Pages settings
- [ ] DNS CNAME record added
- [ ] Site loads: `https://obs-media-control.piogino.ch`
- [ ] WebSocket connects (check browser console)

### Integration
- [ ] Control panel shows "Connected"
- [ ] Image upload works
- [ ] Display page receives updates
- [ ] OBS Browser Source updates
- [ ] No CORS errors in console

---

## 🐛 Troubleshooting

### "WebSocket Disconnected"

**Backend not running:**
```bash
pm2 status
pm2 restart obs-media-controller
pm2 logs obs-media-controller
```

**CORS issue:**
```bash
# Check backend .env
cat ~/obs-remote-media-controller/backend/.env

# Should have:
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch

# Restart after changing
pm2 restart obs-media-controller
```

### GitHub Pages 404

- Wait 10 minutes for initial deployment
- Check DNS propagation: `nslookup obs-media-control.piogino.ch`
- Verify `gh-pages` branch exists
- Check CNAME file in `gh-pages` branch

### Images don't upload

```bash
# Check uploads directory exists
ls -la ~/obs-remote-media-controller/backend/uploads

# Check permissions
chmod 755 ~/obs-remote-media-controller/backend/uploads

# Check backend logs
pm2 logs obs-media-controller --err
```

---

## 📱 Usage

### From iPad/Phone

1. Open Safari/Chrome
2. Go to: `https://obs-media-control.piogino.ch/control`
3. Upload images or paste URLs
4. Tap slots to update
5. OBS updates automatically!

### From Laptop

Same URL works on any device: `https://obs-media-control.piogino.ch/control`

---

## 🔄 Updates

### Update Backend

```bash
ssh user@83.228.207.199
cd ~/obs-remote-media-controller/backend
git pull origin main
npm install
pm2 restart obs-media-controller
```

### Update Frontend

Just push to GitHub:

```powershell
git add .
git commit -m "Update frontend"
git push origin main
```

Auto-deploys in ~2 minutes!

---

## 📊 Monitoring

### Backend Health

```bash
# PM2 dashboard
pm2 monit

# View logs
pm2 logs obs-media-controller

# Check status
pm2 status

# Resource usage
pm2 show obs-media-controller
```

### Frontend Status

- **Actions**: https://github.com/piosteiner/obs-remote-media-controller/actions
- **Pages**: https://github.com/piosteiner/obs-remote-media-controller/settings/pages

---

## 💰 Cost

- **Frontend (GitHub Pages)**: FREE ✅
- **Backend (Infomaniak VPS)**: Your existing server
- **Domain**: Your existing domain
- **SSL**: FREE (Let's Encrypt)

**Total additional cost: $0** 🎉

---

## 📚 Documentation

- **[GitHub Pages Setup](GITHUB_PAGES_SETUP.md)** - Frontend deployment details
- **[Backend Deployment](backend/DEPLOY.md)** - Backend deployment details
- **[Frontend Guide](frontend/DEPLOY.md)** - Additional frontend options
- **[Architecture](docs/ARCHITECTURE.md)** - Technical details
- **[API Reference](docs/API.md)** - API documentation

---

## ✅ Next Steps

1. **Now:** Deploy backend to Infomaniak VPS
2. **Now:** Push code to GitHub (triggers frontend deployment)
3. **Wait:** 10 minutes for DNS + deployment
4. **Test:** Visit control panel and test image upload
5. **Configure:** OBS Browser Sources
6. **Use:** Start controlling OBS from your iPad!

---

## 🎉 Ready to Deploy!

Everything is prepared:
- ✅ Frontend code complete
- ✅ Backend code complete
- ✅ GitHub Actions workflow ready
- ✅ PM2 config ready
- ✅ Documentation complete
- ✅ Environment configs ready

**Just follow the steps above and you're live!** 🚀

---

## 🆘 Need Help?

Check logs:
```bash
# Backend
pm2 logs obs-media-controller

# Nginx
sudo tail -f /var/log/nginx/error.log
```

Test endpoints:
```bash
# Backend health
curl https://api.piogino.ch/api/health

# Frontend
curl https://obs-media-control.piogino.ch
```

Review the detailed deployment guides for troubleshooting steps!
