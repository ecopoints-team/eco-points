# Deployment Guide - Nginx + Gunicorn

This guide explains how to deploy the eco-points application using Nginx and Gunicorn.

## Architecture

```
Internet → Nginx (Port 80/443) → Gunicorn (Port 8000) → Flask App
                                → Next.js Frontend (Port 3000)
```

## Prerequisites

- Ubuntu/Debian Linux server
- Python 3.8+
- Node.js 18+
- MySQL database

## Installation Steps

### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install -y nginx python3-pip python3-venv mysql-server
```

### 2. Set Up the Project

```bash
# Clone or upload your project
cd /var/www
sudo git clone <your-repo> eco-points
cd eco-points

# Set proper permissions
sudo chown -R $USER:$USER /var/www/eco-points
```

### 3. Set Up Python Environment

```bash
cd /var/www/eco-points/server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following:
```env
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/eco_points
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://ecopoints.org
FLASK_ENV=production
```

### 5. Initialize Database

```bash
# Make sure you're in the venv
source venv/bin/activate

# Run migrations
flask db upgrade
```

### 6. Test Gunicorn

```bash
# Test if gunicorn works
gunicorn --config gunicorn.conf.py run:app

# Visit http://your-server-ip:8000/api/ to test
# Press Ctrl+C to stop
```

### 7. Set Up Systemd Service

```bash
# Update paths in eco-points.service file
sudo nano eco-points.service

# Update these lines:
# WorkingDirectory=/var/www/eco-points/server
# Environment="PATH=/var/www/eco-points/server/venv/bin"
# ExecStart=/var/www/eco-points/server/venv/bin/gunicorn --config gunicorn.conf.py run:app

# Copy service file
sudo cp eco-points.service /etc/systemd/system/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable eco-points
sudo systemctl start eco-points

# Check status
sudo systemctl status eco-points
```

### 8. Configure Nginx

```bash
# Update paths in nginx.conf
sudo nano nginx.conf

# Update the server_name and static file paths
# Update Next.js proxy_pass port if different

# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/eco-points

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/eco-points /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, restart nginx
sudo systemctl restart nginx
```

### 9. Set Up Next.js Frontend

```bash
cd /var/www/eco-points/client

# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2 (process manager)
sudo npm install -g pm2
pm2 start npm --name "eco-points-frontend" -- start
pm2 save
pm2 startup
```

### 10. Set Up SSL with Let's Encrypt (Production)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d ecopoints.org -d www.ecopoints.org

# Certificate will auto-renew via cron
```

## Management Commands

### Check Service Status
```bash
sudo systemctl status eco-points
sudo systemctl status nginx
pm2 status
```

### View Logs
```bash
# Gunicorn logs
sudo journalctl -u eco-points -f

# Nginx logs
sudo tail -f /var/log/nginx/eco-points-access.log
sudo tail -f /var/log/nginx/eco-points-error.log

# Next.js logs
pm2 logs eco-points-frontend
```

### Restart Services
```bash
# Restart Flask backend
sudo systemctl restart eco-points

# Restart Nginx
sudo systemctl restart nginx

# Restart Next.js
pm2 restart eco-points-frontend
```

### Update Application
```bash
# Pull latest code
cd /var/www/eco-points
git pull

# Update backend
cd server
source venv/bin/activate
pip install -r requirements.txt
flask db upgrade
sudo systemctl restart eco-points

# Update frontend
cd ../client
npm install
npm run build
pm2 restart eco-points-frontend
```

## Testing

### Test Backend API
```bash
curl http://localhost:8000/api/
curl http://your-domain.com/api/
```

### Test Frontend
```bash
curl http://localhost:3000
curl http://your-domain.com/
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
sudo journalctl -u eco-points -n 50

# Test manually
cd /var/www/eco-points/server
source venv/bin/activate
gunicorn --config gunicorn.conf.py run:app
```

### Nginx errors
```bash
# Check configuration
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u username -p eco_points
```

### Permission issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/eco-points/server
sudo chmod -R 755 /var/www/eco-points/server
```

## Security Recommendations

1. **Firewall**: Configure UFW
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Database**: Use strong passwords and restrict access
3. **Environment Variables**: Never commit .env files
4. **SSL**: Always use HTTPS in production
5. **Updates**: Keep system and packages updated

## Performance Optimization

1. **Gunicorn Workers**: Adjust in `gunicorn.conf.py` based on CPU cores
2. **Nginx Caching**: Enable for static files
3. **Database**: Add indexes for frequently queried fields
4. **CDN**: Consider using Cloudflare for static assets

## Monitoring

Consider adding:
- **Prometheus + Grafana**: For metrics
- **Sentry**: For error tracking
- **New Relic/DataDog**: For APM

## Windows Development Note

The current setup is for Linux/Unix production servers. On Windows for development:
- Use `python run.py` directly instead of gunicorn
- Nginx on Windows is not recommended; use the dev servers
- Consider using WSL2 for a Linux environment on Windows


## Scheduled jobs

Run the unresolved-maintenance sweep on a timer (e.g. hourly):

    flask check-maintenance

- Linux cron:  `0 * * * * cd /srv/ecopoints/server && flask check-maintenance`
- Windows Task Scheduler: action `flask check-maintenance` in the server dir, trigger hourly.
