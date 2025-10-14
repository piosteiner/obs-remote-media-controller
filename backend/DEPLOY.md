# Backend Deployment Guide

## Infrastructure Overview

- **Backend Server**: Infomaniak VPS (83.228.207.199)
- **Frontend**: GitHub Pages (obs-media-control.piogino.ch)
- **Domain**: piogino.ch with subdomain for API (optional: api.piogino.ch)

## Prerequisites on Infomaniak VPS

- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt)
- Firewall configured

---

## Initial Server Setup

### 1. SSH into Infomaniak VPS

```bash
ssh user@83.228.207.199
# Or if you have a domain pointing to it:
ssh user@piogino.ch
```

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Clone Repository

```bash
cd ~
git clone https://github.com/piosteiner/obs-remote-media-controller.git
cd obs-remote-media-controller/backend
```

### 4. Install Backend Dependencies

```bash
npm install
```

### 5. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Edit `.env` file:**

```env
NODE_ENV=production
PORT=3000

# CORS - GitHub Pages frontend
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch

# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Optional: Database path (uses in-memory by default)
# DATABASE_PATH=./data.db
```

### 6. Create Required Directories

```bash
mkdir -p uploads logs
chmod 755 uploads
```

### 7. Configure Domain (Optional but Recommended)

**Option A: Use subdomain for API**

Add DNS A record:
- `api.piogino.ch` → `83.228.207.199`

**Option B: Use direct IP**

No DNS needed, use IP directly in frontend `.env.production`

---

## Nginx Configuration

### Setup Nginx Reverse Proxy

**Option A: With subdomain (api.piogino.ch)**

Create `/etc/nginx/sites-available/obs-api`:

```nginx
server {
    listen 80;
    server_name api.piogino.ch;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.piogino.ch;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.piogino.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.piogino.ch/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if backend doesn't handle)
        add_header 'Access-Control-Allow-Origin' 'https://obs-media-control.piogino.ch' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size
    client_max_body_size 10M;
}
```

**Option B: Direct IP with port**

Create `/etc/nginx/sites-available/obs-api`:

```nginx
server {
    listen 80;
    server_name 83.228.207.199;
    
    return 301 https://$server_name:3001$request_uri;
}

server {
    listen 3001 ssl http2;
    server_name 83.228.207.199;

    # SSL certificate (self-signed or Let's Encrypt)
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

### Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/obs-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Setup SSL Certificate

**For subdomain (api.piogino.ch):**

```bash
sudo certbot --nginx -d api.piogino.ch
```

**For IP address (self-signed):**

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

---

## Start Backend with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command output instructions (copy-paste the command it shows)
```

### Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Test local connection
curl http://localhost:3000/api/health

# Test via domain (if using subdomain)
curl https://api.piogino.ch/api/health

# Test via IP (if using IP)
curl https://83.228.207.199:3001/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-15T..."}
```

---

## Firewall Configuration

```bash
# View status
pm2 status

# View logs
pm2 logs obs-media-controller

# Restart
pm2 restart obs-media-controller

# Stop
pm2 stop obs-media-controller

# Monitor
pm2 monit
```

### 7. Nginx Configuration

Create `/etc/nginx/sites-available/obs-media-control`:

```nginx
server {
    listen 80;
    server_name obs-media-control.piogino.ch;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name obs-media-control.piogino.ch;

    # SSL certificates (adjust paths as needed)
    ssl_certificate /etc/letsencrypt/live/obs-media-control.piogino.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obs-media-control.piogino.ch/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # WebSocket support
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/obs-media-control /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL Certificate (if not already set up)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d obs-media-control.piogino.ch
```

### 9. Firewall Configuration

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Only if accessing directly
sudo ufw enable
```

### 10. Update Deployment

```bash
# Navigate to backend directory
cd ~/obs-remote-media-controller/backend

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart with PM2
pm2 restart obs-media-controller

# Or use the restart script
pm2 restart ecosystem.config.js
```

### 11. Monitoring

```bash
# View real-time logs
pm2 logs obs-media-controller --lines 100

# Check application status
pm2 status

# Monitor CPU/Memory
pm2 monit
```

### 12. Backup Strategy

Create a backup script `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./uploads

# Backup .env
cp .env $BACKUP_DIR/.env_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name ".env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable and add to crontab:

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * cd ~/obs-remote-media-controller/backend && ./backup.sh
```

## Quick Start Script

For easy server start, use:

```bash
chmod +x start-server.sh
./start-server.sh
```

## Troubleshooting

### Check if server is running
```bash
curl http://localhost:3000/api/health
```

### Check PM2 logs
```bash
pm2 logs obs-media-controller --err
```

### Check Nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart everything
```bash
pm2 restart obs-media-controller
sudo systemctl restart nginx
```

### Check port availability
```bash
sudo netstat -tulpn | grep :3000
```

## Security Recommendations

1. **Firewall**: Only expose ports 80 and 443
2. **SSL**: Always use HTTPS in production
3. **Environment Variables**: Never commit `.env` to git
4. **File Uploads**: Validate and sanitize uploaded files
5. **Regular Updates**: Keep Node.js, npm, and dependencies updated
6. **Monitoring**: Set up alerts for server downtime
7. **Backups**: Regular backups of uploads directory

## Performance Optimization

1. **Node.js**: Use production mode (`NODE_ENV=production`)
2. **PM2**: Configure cluster mode if needed (currently single instance)
3. **Nginx**: Enable gzip compression
4. **Images**: Consider adding image optimization middleware
5. **Caching**: Add caching headers for static assets

## Support

For issues or questions:
- Check logs: `pm2 logs obs-media-controller`
- Review Nginx logs: `/var/log/nginx/`
- Check API health: `https://obs-media-control.piogino.ch/api/health`
