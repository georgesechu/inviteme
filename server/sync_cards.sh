#!/bin/bash
# Script to sync wedding invitation cards to the server
# Cards will be accessible at http://46.62.209.58/png/{code}.png

SERVER="root@46.62.209.58"
REMOTE_DIR="/opt/wedding/cards"
LOCAL_CARDS_DIR="../cards"

if [ ! -d "$LOCAL_CARDS_DIR" ]; then
    echo "Error: $LOCAL_CARDS_DIR not found!"
    exit 1
fi

echo "Syncing cards to server..."
echo "This will copy all PNG files from subfolders to the server"

# Create temporary directory for flattened cards
TEMP_DIR=$(mktemp -d)
echo "Creating flattened card structure in $TEMP_DIR..."

# Find all PNG files in subfolders and copy them with their code as filename
find "$LOCAL_CARDS_DIR" -name "*.png" -type f | while read png_file; do
    # Extract the code from filename (e.g., 77073.png -> 77073.png)
    filename=$(basename "$png_file")
    code="${filename%.png}"
    
    # Copy to temp directory with code as filename
    cp "$png_file" "$TEMP_DIR/${code}.png"
done

echo "Found $(ls -1 "$TEMP_DIR"/*.png 2>/dev/null | wc -l) cards to sync"

# Sync to server
echo "Syncing to server..."
rsync -avz --delete "$TEMP_DIR/" "$SERVER:$REMOTE_DIR/"

if [ $? -eq 0 ]; then
    echo "✓ Cards synced successfully!"
    
    # Set correct permissions on server
    echo "Setting permissions..."
    ssh "$SERVER" "chown -R www-data:www-data $REMOTE_DIR && chmod -R 755 $REMOTE_DIR"
    
    echo "Cards are available at: http://46.62.209.58/png/{code}.png"
    
    # Clean up temp directory
    rm -rf "$TEMP_DIR"
    
    # Reload nginx on server to ensure new files are served
    ssh "$SERVER" "systemctl reload nginx" 2>/dev/null || true
    echo "✓ Nginx reloaded"
else
    echo "✗ Error syncing cards"
    rm -rf "$TEMP_DIR"
    exit 1
fi

