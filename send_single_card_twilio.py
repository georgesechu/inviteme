#!/usr/bin/env python3
"""
Send a single wedding invitation card via Twilio WhatsApp
Usage: python3 send_single_card_twilio.py <phone_number> <code>
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

# Twilio configuration
TWILIO_TEMPLATE_ID = "HXf513586e349b38c570d406565e5bbb93"
CARD_BASE_URL = "http://46.62.209.58/png"

# Log file
LOG_FILE = "twilio_send_log.jsonl"

def format_tanzanian_phone(phone):
    """Format Tanzanian phone number: replace leading 0 with +255"""
    if not phone:
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
        "name": name or "N/A",
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

def send_single_card(phone, code, twilio_account_sid, twilio_auth_token, from_number, dry_run=False):
    """Send a single card to a phone number"""
    
    # Format phone number
    formatted_phone = format_tanzanian_phone(phone)
    if not formatted_phone:
        print(f"Error: Invalid phone number: {phone}")
        return False
    
    # Ensure code is 5 digits with leading zeros
    code_str = str(code).strip()
    if code_str.isdigit():
        code = code_str.zfill(5)
    else:
        print(f"Error: Invalid code: {code}")
        return False
    
    # Log before sending
    print("\n" + "="*80)
    print("SENDING SINGLE CARD")
    print("="*80)
    print(f"Phone: {formatted_phone}")
    print(f"Code: {code}")
    print(f"Card URL: {CARD_BASE_URL}/{code}.png")
    print(f"Template ID: {TWILIO_TEMPLATE_ID}")
    print(f"Variables: {{1}}={code}, {{2}}={code}")
    print("="*80)
    
    log_message("send", "Single Send", formatted_phone, code, "pending")
    
    if dry_run:
        log_message("send", "Single Send", formatted_phone, code, "dry_run")
        print("\n✓ DRY RUN - Would send message")
        return True
    
    if not TWILIO_AVAILABLE:
        print("\n✗ ERROR: Twilio library not installed")
        print("Install with: pip install twilio")
        log_message("send", "Single Send", formatted_phone, code, "error", "Twilio library not installed")
        return False
    
    try:
        client = Client(twilio_account_sid, twilio_auth_token)
        
        # Send WhatsApp message with template
        message = client.messages.create(
            from_=from_number,
            to=f"whatsapp:{formatted_phone}",
            content_sid=TWILIO_TEMPLATE_ID,
            content_variables=json.dumps({
                "1": code,
                "2": code
            })
        )
        
        log_message("send", "Single Send", formatted_phone, code, "sent", None)
        print(f"\n✓ MESSAGE SENT SUCCESSFULLY")
        print(f"  Message SID: {message.sid}")
        print(f"  Status: {message.status}")
        return True
        
    except Exception as e:
        error_msg = str(e)
        log_message("send", "Single Send", formatted_phone, code, "error", error_msg)
        print(f"\n✗ ERROR SENDING MESSAGE")
        print(f"  Error: {error_msg}")
        return False

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Send a single wedding invitation card via Twilio',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run (test without sending):
  python3 send_single_card_twilio.py 0712412132 35659 --dry-run

  # Send to your number for testing:
  python3 send_single_card_twilio.py 0712412132 35659 \\
    --account-sid YOUR_SID \\
    --auth-token YOUR_TOKEN \\
    --from-number "whatsapp:+14155238886"

  # Using environment variables:
  export TWILIO_ACCOUNT_SID="your_sid"
  export TWILIO_AUTH_TOKEN="your_token"
  export TWILIO_FROM_NUMBER="whatsapp:+14155238886"
  python3 send_single_card_twilio.py 0712412132 35659
        """
    )
    parser.add_argument('phone', help='Phone number (Tanzanian format, will be converted to +255)')
    parser.add_argument('code', help='5-digit invitation code')
    parser.add_argument('--dry-run', action='store_true', help='Preview without sending')
    parser.add_argument('--account-sid', help='Twilio Account SID (or set TWILIO_ACCOUNT_SID env var)')
    parser.add_argument('--auth-token', help='Twilio Auth Token (or set TWILIO_AUTH_TOKEN env var)')
    parser.add_argument('--from-number', help='Twilio WhatsApp number (or set TWILIO_FROM_NUMBER env var)')
    
    args = parser.parse_args()
    
    # Get Twilio credentials
    twilio_account_sid = args.account_sid or os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_auth_token = args.auth_token or os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = args.from_number or os.environ.get('TWILIO_FROM_NUMBER')
    
    if not args.dry_run:
        if not twilio_account_sid or not twilio_auth_token or not from_number:
            print("Error: Twilio credentials not provided.")
            print("Set environment variables or use command-line arguments:")
            print("  - TWILIO_ACCOUNT_SID")
            print("  - TWILIO_AUTH_TOKEN")
            print("  - TWILIO_FROM_NUMBER (e.g., whatsapp:+14155238886)")
            print("\nUse --dry-run to test without credentials")
            sys.exit(1)
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No message will be sent")
        # For dry run, we can use dummy credentials
        twilio_account_sid = twilio_account_sid or "dry_run"
        twilio_auth_token = twilio_auth_token or "dry_run"
        from_number = from_number or "dry_run"
    
    success = send_single_card(
        args.phone,
        args.code,
        twilio_account_sid,
        twilio_auth_token,
        from_number,
        dry_run=args.dry_run
    )
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

