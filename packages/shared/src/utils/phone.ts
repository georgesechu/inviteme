/**
 * Phone number utilities
 */

/**
 * Format Tanzanian phone number to international format
 * Converts 0XXXXXXXXX to +255XXXXXXXXX
 */
export function formatTanzanianPhone(phone: string | number | null | undefined): string | null {
  if (!phone) {
    return null;
  }
  
  let phoneStr = String(phone).trim();
  
  // Remove all non-digit characters except +
  phoneStr = phoneStr.replace(/[^\d+]/g, '');
  
  // Handle Tanzanian numbers
  if (phoneStr.startsWith('0')) {
    phoneStr = '+255' + phoneStr.substring(1);
  } else if (phoneStr.startsWith('255')) {
    phoneStr = '+' + phoneStr;
  } else if (!phoneStr.startsWith('+')) {
    phoneStr = '+255' + phoneStr;
  }
  
  return phoneStr;
}

/**
 * Format phone for WhatsApp (remove +)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/^\+/, '');
}

