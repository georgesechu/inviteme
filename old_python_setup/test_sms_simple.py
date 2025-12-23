#!/usr/bin/env python3
"""
Simple SMS test without senderid
"""
import urllib.request
import urllib.parse

# SMS API credentials
SMS_USERNAME = "mitikazinc"
SMS_PASSWORD = "kpy3!q6j"
SMS_API_URL = "https://www.sms.co.tz/api.php"

def format_phone_for_sms(phone):
    """Format phone number for SMS API (255 without +)"""
    phone_str = str(phone).strip()
    phone_clean = ''.join(c for c in phone_str if c.isdigit() or c == '+')
    
    if phone_clean.startswith('0'):
        phone_clean = '255' + phone_clean[1:]
    elif phone_clean.startswith('+255'):
        phone_clean = phone_clean[1:]
    elif phone_clean.startswith('255'):
        pass
    else:
        phone_clean = '255' + phone_clean
    
    return phone_clean

def send_sms_test(phone, message):
    """Test SMS with different senderid configurations"""
    msisdn = format_phone_for_sms(phone)
    
    tests = [
        ("No senderid parameter", {}),
        ("Empty senderid string", {'senderid': ''}),
        ("Senderid=0", {'senderid': '0'}),
    ]
    
    for test_name, senderid_param in tests:
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
        print(f"Test: {test_name}")
        print(f"{'='*80}")
        print(f"Phone: {phone} -> {msisdn}")
        print(f"Message: {message}")
        print(f"URL: {url}")
        print("\nSending...")
        
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                result = response.read().decode('utf-8')
                print(f"\nResponse: {result}")
                
                if result.startswith('OK') or result.startswith('SUCCESS'):
                    print("\n✓ SUCCESS!")
                    return True
                else:
                    print(f"\n✗ Error: {result}")
        except Exception as e:
            print(f"\n✗ Exception: {e}")
    
    return False

if __name__ == '__main__':
    test_phone = "0769480177"
    test_message = "Test message from wedding invitation system"
    
    print("="*80)
    print("TESTING SMS API WITHOUT SENDERID")
    print("="*80)
    
    send_sms_test(test_phone, test_message)

