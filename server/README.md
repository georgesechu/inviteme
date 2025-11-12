# Wedding Invitation Verification Service

A simple web service to verify wedding invitation cards by scanning QR codes or entering 5-digit codes manually.

## Features

- QR code verification (scans redirect to `/c/{code}`)
- Manual code entry
- Beautiful UI matching the invitation card color theme
- Nginx basic authentication
- Easy database sync from local spreadsheet

## Structure

```
server/
├── app.py              # Flask application
├── templates/          # HTML templates
│   ├── base.html
│   ├── index.html
│   └── verify.html
├── static/css/        # Stylesheets
│   └── style.css
├── nginx.conf         # Nginx configuration
├── deploy.sh          # Deployment script
├── sync_db.sh         # Database sync script
└── requirements.txt   # Python dependencies
```

## Deployment

### Initial Setup

1. Make sure you have SSH access to the server (SSH key configured)
2. Run the deployment script:

```bash
cd server
./deploy.sh
```

This will:
- Copy all files to `/opt/wedding/server` on the server
- Install Python dependencies
- Set up nginx with basic auth (username: `george`, password: `wedding123go`)
- Create and start a systemd service
- Configure nginx to proxy to the Flask app

### Updating the Database

When the spreadsheet is updated, sync it to the server:

```bash
cd server
./sync_db.sh
```

This will:
- Copy `wedding_invites.ods` to the server
- Restart the service to load the new data

## Access

- URL: http://46.62.209.58
- Username: `george`
- Password: `wedding123go`

## Routes

- `/` - Main page with manual code entry
- `/c/<code>` - Verify by code (used by QR codes)
- `/verify` - POST endpoint for manual verification
- `/api/verify/<code>` - JSON API endpoint

## Color Theme

The UI uses the same color palette as the invitation cards:
- Background: Warm cream/beige (#f5f1e8, #faf8f3)
- Text: Dark brown (#654321, #3d2817)
- Accents: Gold (#d4af37), Nude (#e3d5c8)

## Server Requirements

- Python 3
- Flask
- pandas & odfpy (for reading ODS files)
- nginx
- systemd (for service management)

## Manual Service Management

On the server:

```bash
# Check service status
systemctl status wedding-verification

# Restart service
systemctl restart wedding-verification

# View logs
journalctl -u wedding-verification -f
```

