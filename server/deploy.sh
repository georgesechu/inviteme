#!/bin/bash
# Deployment script for wedding verification service

set -e

SERVER="root@46.62.209.58"
REMOTE_DIR="/opt/wedding"
SERVICE_USER="www-data"

echo "=== Deploying Wedding Verification Service ==="

# Create directory structure on server
echo "Creating directory structure..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/server/{templates,static/css}"

# Copy application files
echo "Copying application files..."
rsync -avz --exclude='__pycache__' --exclude='*.pyc' \
    app.py "$SERVER:$REMOTE_DIR/server/"
rsync -avz templates/ "$SERVER:$REMOTE_DIR/server/templates/"
rsync -avz static/ "$SERVER:$REMOTE_DIR/server/static/"

# Copy database file
echo "Copying database file..."
rsync -avz ../wedding_invites.ods "$SERVER:$REMOTE_DIR/server/"

# Install dependencies on server
echo "Installing Python dependencies..."
ssh "$SERVER" << 'ENDSSH'
    cd /opt/wedding/server
    python3 -m pip install --break-system-packages flask pandas odfpy 2>/dev/null || \
    apt-get update && apt-get install -y python3-flask python3-pandas python3-odfpy || \
    python3 -m pip install flask pandas odfpy --user
ENDSSH

# Create nginx password file
echo "Setting up nginx basic auth..."
ssh "$SERVER" << 'ENDSSH'
    # Create .htpasswd file with george:wedding123go
    # Using htpasswd or openssl
    if command -v htpasswd &> /dev/null; then
        htpasswd -bc /etc/nginx/.htpasswd george wedding123go 2>/dev/null
    else
        # Fallback: create manually with openssl
        PASSWORD_HASH=$(openssl passwd -apr1 wedding123go)
        echo "george:$PASSWORD_HASH" > /etc/nginx/.htpasswd
    fi
    chmod 644 /etc/nginx/.htpasswd
ENDSSH

# Copy nginx configuration
echo "Setting up nginx..."
ssh "$SERVER" << 'ENDSSH'
    # Backup existing config if it exists
    if [ -f /etc/nginx/sites-available/wedding ]; then
        cp /etc/nginx/sites-available/wedding /etc/nginx/sites-available/wedding.backup
    fi
ENDSSH

# Copy nginx config
scp nginx.conf "$SERVER:/etc/nginx/sites-available/wedding"

# Enable site and test nginx
ssh "$SERVER" << 'ENDSSH'
    # Remove default site if it exists
    rm -f /etc/nginx/sites-enabled/default
    
    # Enable wedding site
    ln -sf /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/wedding
    
    # Test nginx config
    nginx -t
    
    # Reload nginx
    systemctl reload nginx || service nginx reload
ENDSSH

# Create systemd service
echo "Creating systemd service..."
ssh "$SERVER" << 'ENDSSH'
cat > /etc/systemd/system/wedding-verification.service << 'EOFSERVICE'
[Unit]
Description=Wedding Invitation Verification Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/wedding/server
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 /opt/wedding/server/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOFSERVICE

    systemctl daemon-reload
    systemctl enable wedding-verification
    systemctl restart wedding-verification
ENDSSH

echo ""
echo "=== Deployment Complete ==="
echo "Service should be running at http://46.62.209.58"
echo "Username: george"
echo "Password: wedding123go"
echo ""
echo "To sync database updates, run: ./sync_db.sh"

