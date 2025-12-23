/**
 * Validation utilities
 */

export function isValidPhoneNumber(phone: string): boolean {
  // Basic phone validation - should start with + and have digits
  const phoneRegex = /^\+?\d{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCode(code: string): boolean {
  // Code should be 5 digits
  return /^\d{5}$/.test(code);
}

