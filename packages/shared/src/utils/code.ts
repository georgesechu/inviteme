/**
 * Code normalization utilities
 */

/**
 * Normalize code to 5-digit string with leading zeros
 */
export function normalizeCode(code: string | number | null | undefined): string | null {
  if (code === null || code === undefined) {
    return null;
  }
  
  const codeStr = String(code).trim();
  // Remove any trailing .0 from float conversion
  const cleaned = codeStr.replace(/\.0+$/, '');
  
  // If it's all digits, pad to 5 digits
  if (/^\d+$/.test(cleaned)) {
    return cleaned.padStart(5, '0');
  }
  
  return cleaned;
}

/**
 * Generate a unique 5-digit code
 */
export function generateCode(): string {
  // Generate random 5-digit code
  const code = Math.floor(10000 + Math.random() * 90000);
  return String(code);
}

