#!/usr/bin/env python3
"""
Send wedding invitation cards via Twilio WhatsApp
"""
import sys
import os
import json
from datetime import datetime

# Try to import Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("Warning: twilio not available.")
    print("Install with: pip install twilio")

# Twilio configuration
TWILIO_TEMPLATE_ID = "HXf513586e349b38c570d406565e5bbb93"
CARD_BASE_URL = "http://46.62.209.58/png"

# Log file
LOG_FILE = "twilio_send_log.jsonl"

def format_tanzanian_phone(phone):
    """Format Tanzanian phone number: replace leading 0 with +255"""
    if not phone or str(phone) == 'nan':
        return None
    
    phone_str = str(phone).strip()
    
    # Remove any non-digit characters except +
    phone_clean = ''.join(c for c in phone_str if c.isdigit() or c == '+')
    
    # If starts with 0, replace with +255
    if phone_clean.startswith('0'):
        phone_clean = '+255' + phone_clean[1:]
    elif not phone_clean.startswith('+'):
        # If no + and doesn't start with 0, assume it needs +255
        if phone_clean.startswith('255'):
            phone_clean = '+' + phone_clean
        else:
            phone_clean = '+255' + phone_clean
    
    return phone_clean

def log_message(action, name, phone, code, status="pending", error=None):
    """Log message details"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "name": name,
        "phone": phone,
        "code": code,
        "status": status,
        "error": error,
        "card_url": f"{CARD_BASE_URL}/{code}.png",
        "template_id": TWILIO_TEMPLATE_ID
    }
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry) + '\n')
    
    return log_entry

def read_spreadsheet():
    """Read guest data from spreadsheet"""
    guests = []
    
    try:
        import pandas as pd
        df = pd.read_excel('wedding_invites.ods', engine='odf')
        
        for _, row in df.iterrows():
            name = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
            single_double = str(row.iloc[1]) if pd.notna(row.iloc[1]) else "Single"
            phone_raw = row.iloc[2] if len(row) > 2 else None
            code_raw = row.iloc[3] if len(row) > 3 else None
            
            # Handle code (preserve leading zeros)
            if pd.notna(code_raw) and code_raw != 'nan':
                if isinstance(code_raw, (int, float)):
                    code = str(int(code_raw)).zfill(5)
                else:
                    code = str(code_raw).rstrip('.0').zfill(5)
            else:
                code = None
            
            # Format phone number
            phone = format_tanzanian_phone(phone_raw) if pd.notna(phone_raw) else None
            
            if name and name != 'nan' and code and code != 'nan':
                guests.append({
                    'name': name,
                    'type': single_double,
                    'phone': phone,
                    'code': code
                })
    
    except ImportError:
        # Fallback to XML parsing
        try:
            import xml.etree.ElementTree as ET
            import zipfile
            
            with zipfile.ZipFile('wedding_invites.ods', 'r') as z:
                content = z.read('content.xml')
            root = ET.fromstring(content)
            ns = {'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
                  'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
            
            rows = root.findall('.//table:table-row', ns)
            for row in rows:
                cells = row.findall('.//table:table-cell', ns)
                if len(cells) >= 4:
                    name_elem = cells[0].find('.//text:p', ns)
                    type_elem = cells[1].find('.//text:p', ns)
                    phone_elem = cells[2].find('.//text:p', ns) if len(cells) > 2 else None
                    code_elem = cells[3].find('.//text:p', ns)
                    
                    if name_elem is not None and name_elem.text and code_elem is not None and code_elem.text:
                        name = name_elem.text.replace('&amp;', '&')
                        single_double = type_elem.text if type_elem is not None and type_elem.text else "Single"
                        phone_raw = phone_elem.text if phone_elem is not None and phone_elem.text else None
                        code = code_elem.text
                        
                        # Format phone
                        phone = format_tanzanian_phone(phone_raw)
                        
                        # Pad code to 5 digits
                        if code.isdigit():
                            code = code.zfill(5)
                        
                        guests.append({
                            'name': name,
                            'type': single_double,
                            'phone': phone,
                            'code': code
                        })
        except Exception as e:
            print(f"Error reading spreadsheet: {e}")
            sys.exit(1)
    
    return guests

def preview_messages(guests, twilio_account_sid=None, twilio_auth_token=None, from_number=None):
    """Preview what will be sent without actually sending"""
    print("\n" + "="*80)
    print("PREVIEW: Messages that will be sent")
    print("="*80)
    print(f"{'Name':<30} {'Phone':<20} {'Code':<10} {'Has Phone':<10}")
    print("-"*80)
    
    with_phone = 0
    without_phone = 0
    
    for guest in guests:
        has_phone = "Yes" if guest['phone'] else "No"
        if guest['phone']:
            with_phone += 1
        else:
            without_phone += 1
        
        print(f"{guest['name']:<30} {guest['phone'] or 'N/A':<20} {guest['code']:<10} {has_phone:<10}")
    
    print("-"*80)
    print(f"Total guests: {len(guests)}")
    print(f"With phone numbers: {with_phone}")
    print(f"Without phone numbers: {without_phone}")
    print("="*80)
    
    if not TWILIO_AVAILABLE:
        print("\n⚠️  Twilio library not installed. Install with: pip install twilio")
        return False
    
    if not twilio_account_sid or not twilio_auth_token or not from_number:
        print("\n⚠️  Twilio credentials not provided.")
        print("Set environment variables:")
        print("  - TWILIO_ACCOUNT_SID")
        print("  - TWILIO_AUTH_TOKEN")
        print("  - TWILIO_FROM_NUMBER (WhatsApp number, e.g., whatsapp:+14155238886)")
        return False
    
    print(f"\n✓ Twilio configured")
    print(f"  Account SID: {twilio_account_sid[:10]}...")
    print(f"  From: {from_number}")
    print(f"  Template ID: {TWILIO_TEMPLATE_ID}")
    print(f"  Variables: {{1}} = code, {{2}} = code")
    
    return True

def send_messages(guests, twilio_account_sid, twilio_auth_token, from_number, dry_run=False):
    """Send messages via Twilio by calling the single card script"""
    import subprocess
    
    sent_count = 0
    error_count = 0
    skipped_count = 0
    
    print("\n" + "="*80)
    print("SENDING MESSAGES" if not dry_run else "DRY RUN - Would send messages")
    print("="*80)
    
    # Build base command
    base_cmd = [
        sys.executable,
        'send_single_card_twilio.py',
        '--account-sid', twilio_account_sid,
        '--auth-token', twilio_auth_token,
        '--from-number', from_number
    ]
    
    if dry_run:
        base_cmd.append('--dry-run')
    
    for guest in guests:
        name = guest['name']
        phone = guest['phone']
        code = guest['code']
        
        if not phone:
            log_message("skip", name, None, code, "skipped", "No phone number")
            skipped_count += 1
            print(f"⏭️  SKIP: {name} - No phone number")
            continue
        
        # Log before sending
        log_entry = log_message("send", name, phone, code, "pending")
        print(f"\n📤 Sending to: {name}")
        print(f"   Phone: {phone}")
        print(f"   Code: {code}")
        print(f"   Card URL: {CARD_BASE_URL}/{code}.png")
        
        # Call single card script
        cmd = base_cmd + [phone, code]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)
            
            if result.returncode == 0:
                if dry_run:
                    log_message("send", name, phone, code, "dry_run")
                    sent_count += 1
                else:
                    log_message("send", name, phone, code, "sent", None)
                    sent_count += 1
                    print(f"   ✓ SENT")
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                log_message("send", name, phone, code, "error", error_msg)
                error_count += 1
                print(f"   ✗ ERROR: {error_msg}")
                
        except Exception as e:
            error_msg = str(e)
            log_message("send", name, phone, code, "error", error_msg)
            error_count += 1
            print(f"   ✗ ERROR: {error_msg}")
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Sent: {sent_count}")
    print(f"Errors: {error_count}")
    print(f"Skipped (no phone): {skipped_count}")
    print(f"Total: {len(guests)}")
    print(f"\nLog file: {LOG_FILE}")
    print("="*80)

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Send wedding invitation cards via Twilio')
    parser.add_argument('--dry-run', action='store_true', help='Preview without sending')
    parser.add_argument('--account-sid', help='Twilio Account SID (or set TWILIO_ACCOUNT_SID env var)')
    parser.add_argument('--auth-token', help='Twilio Auth Token (or set TWILIO_AUTH_TOKEN env var)')
    parser.add_argument('--from-number', help='Twilio WhatsApp number (or set TWILIO_FROM_NUMBER env var)')
    
    args = parser.parse_args()
    
    # Get Twilio credentials
    twilio_account_sid = args.account_sid or os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_auth_token = args.auth_token or os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = args.from_number or os.environ.get('TWILIO_FROM_NUMBER')
    
    # Read spreadsheet
    print("Reading spreadsheet...")
    guests = read_spreadsheet()
    print(f"Loaded {len(guests)} guests")
    
    # Preview
    can_send = preview_messages(guests, twilio_account_sid, twilio_auth_token, from_number)
    
    if args.dry_run:
        print("\n🔍 DRY RUN MODE - No messages will be sent")
        send_messages(guests, twilio_account_sid or "dry_run", twilio_auth_token or "dry_run", 
                     from_number or "dry_run", dry_run=True)
    elif can_send:
        # Ask for confirmation
        print("\n⚠️  Ready to send messages. This will send WhatsApp messages to all guests with phone numbers.")
        response = input("Type 'SEND' to confirm: ")
        
        if response == 'SEND':
            send_messages(guests, twilio_account_sid, twilio_auth_token, from_number, dry_run=False)
        else:
            print("Cancelled. Use --dry-run to preview without sending.")
    else:
        print("\nCannot send messages. Please check configuration.")

if __name__ == '__main__':
    main()

