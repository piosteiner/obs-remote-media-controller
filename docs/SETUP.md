# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- OBS Studio 28+ installed
- Git installed
- Your domain: obs-media-control.piogino.ch configured

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/piosteiner/obs-remote-media-controller.git
cd obs-remote-media-controller
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Edit `vite.config.js` to set API URL:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
})
```

Start frontend:
```bash
npm run dev
```

### 4. OBS Configuration

1. Open OBS Studio
2. Add a new **Browser Source**:
   - **Name:** "Image Slot 1"
   - **URL:** `http://localhost:5173/display?slot=1`
   - **Width:** 1920
   - **Height:** 1080
   - **FPS:** 30
   - ✅ Check "Shutdown source when not visible"
   - ✅ Check "Refresh browser when scene becomes active" (optional)

3. Position the browser source in your scene
4. Repeat for additional slots (slot=2, slot=3, etc.)

### 5. Access Control Panel

Open in your browser:
```
http://localhost:5173/control
```

---

## Production Deployment

### Backend Deployment (Cloud Server)

1. **SSH to your server:**
```bash
ssh user@your-server.com
```

2. **Clone repository:**
```bash
cd /var/www
git clone https://github.com/piosteiner/obs-remote-media-controller.git
cd obs-remote-media-controller/backend
```

3. **Install dependencies:**
```bash
npm install --production
```

4. **Configure environment:**
```bash
cp .env.example .env
nano .env
```

Production `.env`:
```env
NODE_ENV=production
PORT=3000
UPLOAD_DIR=/var/www/obs-remote-media-controller/backend/uploads
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch
DATABASE_URL=postgresql://user:pass@localhost/obscontrol
```

5. **Install PM2:**
```bash
npm install -g pm2
```

6. **Start with PM2:**
```bash
pm2 start src/server.js --name obs-backend
pm2 save
pm2 startup
```

### Frontend Deployment

**Option A: Deploy to same server**

1. **Build frontend:**
```bash
cd /var/www/obs-remote-media-controller/frontend
npm install
npm run build
```

2. **Frontend will be served by Nginx** (see Nginx config below)

**Option B: Deploy to GitHub Pages**

1. **Update `vite.config.js`:**
```javascript
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist'
  }
})
```

2. **Add GitHub Actions workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install and Build
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Nginx Configuration

1. **Create Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/obs-media-control
```

2. **Add configuration:**
```nginx
server {
    server_name obs-media-control.piogino.ch;

    # Frontend (if hosted on same server)
    location / {
        root /var/www/obs-remote-media-controller/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploaded images
    location /uploads {
        alias /var/www/obs-remote-media-controller/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/obs-media-control.piogino.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obs-media-control.piogino.ch/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = obs-media-control.piogino.ch) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name obs-media-control.piogino.ch;
    return 404;
}
```

3. **Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/obs-media-control /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d obs-media-control.piogino.ch
```

### Firewall Configuration

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw enable
```

---

## OBS Production Setup

1. **Add Browser Source:**
   - **URL:** `https://obs-media-control.piogino.ch/display?slot=1`
   - **Width:** 1920
   - **Height:** 1080
   - **FPS:** 30
   - ✅ Shutdown source when not visible

2. **Test connection:**
   - Open control panel: `https://obs-media-control.piogino.ch/control`
   - Upload an image
   - Verify it appears in OBS

3. **Add multiple slots:**
   - Duplicate browser source
   - Change URL to `?slot=2`, `?slot=3`, etc.
   - Position each slot in your scene

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Check logs
pm2 logs obs-backend

# Restart
pm2 restart obs-backend
```

### Images not showing in OBS
1. Check browser console in OBS (right-click source → Interact)
2. Verify WebSocket connection
3. Check CORS settings in backend `.env`
4. Ensure HTTPS if using production domain

### WebSocket connection issues
1. Verify Nginx configuration for WebSocket
2. Check firewall allows WebSocket connections
3. Test WebSocket endpoint: `wss://obs-media-control.piogino.ch/socket.io`

### Upload fails
1. Check `uploads/` directory permissions: `chmod 755 uploads/`
2. Verify `MAX_FILE_SIZE` in `.env`
3. Check Nginx `client_max_body_size` (add to http block):
   ```nginx
   client_max_body_size 10M;
   ```

---

## Useful Commands

### Development
```bash
# Start both backend and frontend
npm run dev    # from root (if scripts added)

# Watch logs
pm2 logs obs-backend --lines 100

# Restart backend
pm2 restart obs-backend

# View process status
pm2 status
```

### Database
```bash
# Backup database
cp backend/database.sqlite backend/database.sqlite.backup

# Reset database (development)
rm backend/database.sqlite
npm run migrate
```

### Git
```bash
# Pull latest changes
git pull origin main

# Deploy updates
git pull && cd backend && npm install && pm2 restart obs-backend
cd ../frontend && npm install && npm run build
```

---

## Next Steps

1. ✅ Repository renamed
2. ✅ Domain connected
3. ⏳ Deploy backend to cloud server
4. ⏳ Deploy frontend
5. ⏳ Configure OBS
6. ⏳ Test end-to-end
7. ⏳ Start using in production!

---

For detailed information, see:
- [PROJECT_PLAN.md](../PROJECT_PLAN.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [API.md](API.md)
