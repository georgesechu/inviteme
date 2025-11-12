#!/bin/bash
# Script to sync the wedding_invites.ods file to the server

SERVER="root@46.62.209.58"
REMOTE_PATH="/opt/wedding/server/wedding_invites.ods"
LOCAL_PATH="../wedding_invites.ods"

if [ ! -f "$LOCAL_PATH" ]; then
    echo "Error: $LOCAL_PATH not found!"
    exit 1
fi

echo "Syncing spreadsheet to server..."
rsync -avz "$LOCAL_PATH" "$SERVER:$REMOTE_PATH"

if [ $? -eq 0 ]; then
    echo "✓ Spreadsheet synced successfully!"
    echo "Restarting service on server..."
    ssh "$SERVER" "systemctl restart wedding-verification || supervisorctl restart wedding-verification || pkill -f 'python.*app.py'"
    echo "✓ Service restarted"
else
    echo "✗ Error syncing spreadsheet"
    exit 1
fi

