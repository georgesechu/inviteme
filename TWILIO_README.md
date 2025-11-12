# Twilio Card Sending Script

Script to send wedding invitation cards via Twilio WhatsApp.

## Setup

1. Install Twilio library:
```bash
pip install twilio
```

2. Set environment variables (or use command-line arguments):
```bash
export TWILIO_ACCOUNT_SID="your_account_sid"
export TWILIO_AUTH_TOKEN="your_auth_token"
export TWILIO_FROM_NUMBER="whatsapp:+14155238886"  # Your Twilio WhatsApp number
```

## Usage

### Preview (Dry Run)
Preview what will be sent without actually sending:
```bash
python3 send_cards_twilio.py --dry-run
```

### Send Messages
Send messages to all guests with phone numbers:
```bash
python3 send_cards_twilio.py
```

You'll be prompted to type 'SEND' to confirm.

### Command-line Options
```bash
python3 send_cards_twilio.py \
  --account-sid YOUR_SID \
  --auth-token YOUR_TOKEN \
  --from-number "whatsapp:+14155238886" \
  --dry-run  # Optional: preview without sending
```

## Phone Number Formatting

- Tanzanian numbers are automatically formatted
- Leading `0` is replaced with `+255`
- Example: `0712412132` → `+255712412132`

## Twilio Template

- **Template ID**: `HXf513586e349b38c570d406565e5bbb93`
- **Variables**:
  - `{{1}}` = invitation code
  - `{{2}}` = invitation code (same as {{1}})

## Logging

All send attempts are logged to `twilio_send_log.jsonl` with:
- Timestamp
- Guest name
- Phone number
- Code
- Status (sent/error/skipped)
- Card URL
- Error messages (if any)

## Card URLs

Cards are hosted at: `http://46.62.209.58/png/{code}.png`

Example: `http://46.62.209.58/png/77073.png`

## Notes

- Guests without phone numbers are automatically skipped
- The script logs all actions before sending
- Use `--dry-run` to preview without sending
- Check `twilio_send_log.jsonl` for detailed logs

