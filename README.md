# GameVault Marketplace Deployment Guide (Hostinger VPS)

This guide provides everything you need to deploy your marketplace on a **Hostinger VPS (KVM 1 or KVM 2)** with **Ubuntu 22.04**.

---

## 1. Initial VPS Setup
Once you have your VPS, log in via SSH (using Terminal or PuTTY):
```bash
ssh root@your_vps_ip
```

### Install Node.js & PM2
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

---

## 2. Deploy the Code
1. **Export your code to GitHub** using the "Export to GitHub" button in AI Studio.
2. **Clone the repository on your VPS:**
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
```

---

## 3. Configure Environment Variables
Create a `.env` file to store your secret keys:
```bash
nano .env
```
Paste the following and replace with your real keys:
```env
# Ziina Payment Key
ZIINA_API_KEY=your_ziina_secret_key

# Firebase Configuration (Required for Backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_FIRESTORE_DATABASE_ID=(default)
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_APP_ID=your-app-id

# Server Settings
PORT=3000
NODE_ENV=production
```
*Press `CTRL + O`, `Enter`, then `CTRL + X` to save.*

### Firebase Config File (Optional but Recommended)
If you prefer using the JSON file, create it:
```bash
nano firebase-applet-config.json
```
*Paste the contents of your `firebase-applet-config.json` and save.*

---

## 4. Build & Start the App
```bash
# Build the production frontend
npm run build

# Start the app with PM2
pm2 start ecosystem.config.cjs --env production

# Ensure app starts on VPS reboot
pm2 save
pm2 startup
```

---

## 5. Domain & Nginx (Custom Domain Setup)
### Install Nginx
```bash
sudo apt install nginx -y
```

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/gamevault
```
Paste this (replace `yourdomain.com` with your domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/gamevault /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Install SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 6. Final Steps
1. **Firebase Console:** Add `yourdomain.com` to **Authentication** -> **Settings** -> **Authorized Domains**.
2. **Ziina Dashboard:** Update your webhook URL to `https://yourdomain.com/api/webhooks/ziina`.

**Your marketplace is now live!**
