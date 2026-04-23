# Dromiss Platform - VPS Deployment Guide

Production stack: **Nginx** (static site + reverse proxy) · **Docker Compose** (Odoo 18 + PostgreSQL 17) · **Python FastAPI + Gunicorn** (form proxy, managed by systemd)

Target: Ubuntu 22.04 LTS on a Hostinger KVM VPS.

---

## 1. VPS Initial Setup

```bash
# Update all packages
apt update && apt upgrade -y

# Install essentials
apt install -y curl git ufw

# Configure firewall - allow only SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# Create a non-root sudo user (replace "deploy" with your preferred username)
adduser deploy
usermod -aG sudo deploy

# Disable root SSH login
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# From this point, use the "deploy" user via SSH
```

---

## 2. Install Docker

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com | sh

# Install docker compose plugin
apt install -y docker-compose-plugin

# Add your user to the docker group (log out and back in after this)
usermod -aG docker deploy

# Verify
docker --version
docker compose version
```

---

## 3. Install Nginx + Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx

# Enable Nginx to start on boot
systemctl enable nginx
systemctl start nginx
```

---

## 4. Install Python + Create Virtualenv

```bash
# Python 3.11 (may already be present as Odoo's dependency)
apt install -y python3.11 python3.11-venv python3-pip

# Verify
python3.11 --version
```

---

## 5. Clone the Repository

```bash
# Clone to the web root
git clone https://github.com/jaouad4/dromiss-platform.git /var/www/dromiss

# Hand ownership to the web server user
chown -R www-data:www-data /var/www/dromiss
```

---

## 6. Set Up FastAPI Proxy

```bash
cd /var/www/dromiss/api

# Create and populate the virtualenv
python3.11 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# Create the secrets directory
mkdir -p /etc/dromiss

# Copy the example env file and fill in real values
cp api/.env.example /etc/dromiss/api.env
nano /etc/dromiss/api.env
# Set ODOO_URL, ODOO_API_KEY, ODOO_DB to real values

# Restrict read access to root only
chmod 600 /etc/dromiss/api.env

# Create the Gunicorn log directory
mkdir -p /var/log/gunicorn
chown www-data:www-data /var/log/gunicorn
```

---

## 7. Start Odoo with Docker Compose

```bash
cd /var/www/dromiss

# Create .env from the example and set a strong Postgres password (min 20 chars)
cp .env.example .env
nano .env
# Edit POSTGRES_PASSWORD - use a long random string

# Start containers in the background
docker compose up -d

# Verify both containers are running and db is healthy
docker compose ps
```

---

## 8. Configure Nginx

### 8a. Create the Odoo Admin Password File

The Odoo subdomain (`odoo.dromiss.com`) is protected by HTTP Basic Auth. You must
create the password file **before** reloading Nginx - otherwise Nginx will fail to start.

```bash
# Install htpasswd utility
apt install -y apache2-utils

# Create the password file and add an admin user
# You will be prompted to enter and confirm a password
htpasswd -c /etc/nginx/odoo.htpasswd admin

# Restrict read access to root and www-data
chmod 640 /etc/nginx/odoo.htpasswd
chown root:www-data /etc/nginx/odoo.htpasswd
```

> **Keep this password separate from your Odoo login password.**
> The Basic Auth gate is a first layer that stops automated scanners;
> your Odoo user password is the second layer.

### 8b. Install Site Configs

```bash
# Copy site configs
cp /var/www/dromiss/infra/nginx/dromiss.conf /etc/nginx/sites-available/dromiss
cp /var/www/dromiss/infra/nginx/odoo.conf    /etc/nginx/sites-available/odoo

# Enable the sites
ln -s /etc/nginx/sites-available/dromiss /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/odoo    /etc/nginx/sites-enabled/

# Remove the default placeholder site
rm /etc/nginx/sites-enabled/default

# Test config and reload
nginx -t && systemctl reload nginx
```

---

## 9. Point DNS to the VPS

In **Hostinger hPanel → Domains → dromiss.com → DNS Zone**, add:

| Type | Name   | Value        | TTL  |
|------|--------|--------------|------|
| A    | @      | \<VPS IP\>   | 3600 |
| A    | www    | \<VPS IP\>   | 3600 |
| A    | odoo   | \<VPS IP\>   | 3600 |

Wait for DNS propagation (typically under 1 hour, up to 24 hours).

---

## 10. Install SSL Certificates

```bash
# Issue certificates - Certbot will auto-update the Nginx config for HTTPS
certbot --nginx -d dromiss.com -d www.dromiss.com
certbot --nginx -d odoo.dromiss.com

# Test automatic renewal
certbot renew --dry-run

# Add a daily renewal cron job
echo "0 3 * * * certbot renew --quiet" | crontab -
```

---

## 11. Install and Start the FastAPI Systemd Service

```bash
# Install the service unit
cp /var/www/dromiss/infra/dromiss-api.service /etc/systemd/system/

# Reload systemd, enable, and start
systemctl daemon-reload
systemctl enable dromiss-api
systemctl start dromiss-api

# Verify it is active and running
systemctl status dromiss-api
```

---

## 12. Set Up Odoo

1. Navigate to **https://odoo.dromiss.com** in your browser.
2. Create the database - use the same name as `ODOO_DB` in your `.env` (default: `odoo`).
3. Install the **CRM** module: Apps → search "CRM" → Install.
4. Generate an API key: **Settings → Technical → API Keys → New**.
5. Copy the key into `/etc/dromiss/api.env` as `ODOO_API_KEY`.
6. Restart the proxy to pick up the new key:

```bash
systemctl restart dromiss-api
```

---

## 13. End-to-End Test

```bash
# Test the health endpoint
curl https://dromiss.com/api/health
# Expected: {"status":"ok"}

# Watch FastAPI logs in real time
journalctl -u dromiss-api -f
```

Then:
1. Open **https://dromiss.com/contact.html** in a browser.
2. Fill in and submit the contact form.
3. Verify the lead appears in **Odoo CRM → Pipeline**.

---

## 14. Ongoing Maintenance

```bash
# Deploy code updates
cd /var/www/dromiss
git pull
systemctl restart dromiss-api

# View Odoo container logs
docker compose logs -f odoo

# View Nginx error log
tail -f /var/log/nginx/error.log

# View FastAPI logs
journalctl -u dromiss-api -n 100

# Backup Odoo database
docker compose exec db pg_dump -U odoo odoo > backup_$(date +%Y%m%d).sql
```
