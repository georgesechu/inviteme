#!/usr/bin/env python3
"""
Test SMS API
"""
import urllib.request
import urllib.parse

# SMS API credentials
SMS_USERNAME = "mitikazinc"
SMS_PASSWORD = "kpy3!q6j"
SMS_API_URL = "https://www.sms.co.tz/api.php"

def format_phone_for_sms(phone):
    """Format phone number for SMS API (255 without +)"""
    if not phone:
        return None
    
    phone_str = str(phone).strip()
    
    # Remove any non-digit characters except +
    phone_clean = ''.join(c for c in phone_str if c.isdigit() or c == '+')
    
    # If starts with 0, replace with 255
    if phone_clean.startswith('0'):
        phone_clean = '255' + phone_clean[1:]
    elif phone_clean.startswith('+255'):
        phone_clean = phone_clean[1:]  # Remove +
    elif phone_clean.startswith('255'):
        pass  # Already correct
    else:
        phone_clean = '255' + phone_clean
    
    return phone_clean

def send_sms(phone, message):
    """Send SMS via the API"""
    msisdn = format_phone_for_sms(phone)
    
    if not msisdn:
        print(f"Error: Invalid phone number: {phone}")
        return False
    
    # Try different variations
    variations = [
        {'senderid': 'SMS.co.tz'},
        {'senderid': 'SMS'},
        {'senderid': 'Wedding'},
        {'senderid': '255712412132'},  # Try numeric (phone number format)
        {'senderid': 'MITIKAZINC'},  # Try username
        {'senderid': 'mitikazinc'},  # Try lowercase username
    ]
    
    # First, try to check account status
    print("\nChecking account status...")
    try:
        check_url = f"{SMS_API_URL}?do=balance&username={SMS_USERNAME}&password={SMS_PASSWORD}"
        with urllib.request.urlopen(check_url, timeout=10) as response:
            balance_result = response.read().decode('utf-8')
            print(f"Account balance/status: {balance_result}")
    except Exception as e:
        print(f"Could not check account: {e}")
    
    # Try to get senderids list
    print("\nChecking available senderids...")
    try:
        senderid_url = f"{SMS_API_URL}?do=senderids&username={SMS_USERNAME}&password={SMS_PASSWORD}"
        with urllib.request.urlopen(senderid_url, timeout=10) as response:
            senderid_result = response.read().decode('utf-8')
            print(f"Available senderids: {senderid_result}")
    except Exception as e:
        print(f"Could not check senderids: {e}")
    
    print("\n" + "="*80)
    
    for i, senderid_param in enumerate(variations):
        params = {
            'do': 'sms',
            'username': SMS_USERNAME,
            'password': SMS_PASSWORD,
            'dest': msisdn,
            'msg': message
        }
        params.update(senderid_param)
        
        url = f"{SMS_API_URL}?{urllib.parse.urlencode(params)}"
        
        print(f"\n{'='*80}")
        print(f"Attempt {i+1}: {'With senderid=' + senderid_param.get('senderid', 'None') if senderid_param else 'No senderid'}")
        print(f"{'='*80}")
        print(f"URL: {url}")
        print("Sending request...")
        
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                result = response.read().decode('utf-8')
                print(f"Response: {result}")
                
                # If successful, stop trying
                if not result.startswith('ERR'):
                    print(f"\n✓ SUCCESS with variation {i+1}!")
                    return True
                else:
                    print(f"✗ Error: {result}")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    return False

if __name__ == '__main__':
    test_phone = "0769480177"
    test_message = "Test message from wedding invitation system"
    
    print("="*80)
    print("TESTING SMS API")
    print("="*80)
    
    send_sms(test_phone, test_message)

