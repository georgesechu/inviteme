/**
 * Authentication service
 */
import { prisma } from '../config/database';
import { sendLoginCode } from './twilioClient';
import { formatTanzanianPhone } from '@inviteme/shared';
import { generateToken, verifyToken as verifyJWT } from './jwt';
// eslint-disable-next-line import/named, import/no-unresolved
import type { User } from '.prisma/client';

/**
 * Generate a random 6-digit code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Request login code via WhatsApp
 */
export async function requestLoginCode(
  phoneNumber: string
): Promise<{ success: boolean; message: string }> {
  const formattedPhone = formatTanzanianPhone(phoneNumber);
  if (!formattedPhone) {
    return { success: false, message: 'Invalid phone number' };
  }

  // Generate code
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert user with new code
  await prisma.user.upsert({
    where: { phoneNumber: formattedPhone },
    update: {
      whatsappCode: code,
      whatsappCodeExpiresAt: expiresAt,
    },
    create: {
      phoneNumber: formattedPhone,
      whatsappCode: code,
      whatsappCodeExpiresAt: expiresAt,
    },
  });

  // Send code via WhatsApp using template
  const sent = await sendLoginCode(formattedPhone, code);
  if (!sent.success) {
    return { success: false, message: sent.error || 'Failed to send WhatsApp code' };
  }

  return { success: true, message: 'Code sent successfully' };
}

/**
 * Verify login code
 */
export async function verifyLoginCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; user?: User; token?: string }> {
  const formattedPhone = formatTanzanianPhone(phoneNumber);
  if (!formattedPhone) {
    return { success: false };
  }

  const user = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
  });
  if (!user) {
    return { success: false };
  }

  // Check if code matches and hasn't expired
  if (
    user.whatsappCode !== code ||
    !user.whatsappCodeExpiresAt ||
    user.whatsappCodeExpiresAt < new Date()
  ) {
    return { success: false };
  }

  // Clear the code after successful verification
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      whatsappCode: null,
      whatsappCodeExpiresAt: null,
    },
  });

  // Generate JWT token
  const token = generateToken({
    userId: updatedUser.id,
    phoneNumber: updatedUser.phoneNumber,
  });

  return { success: true, user: updatedUser, token };
}

/**
 * Async token verification (used by middleware)
 */
export async function verifyTokenAsync(token: string): Promise<User | null> {
  try {
    const payload = verifyJWT(token);
    if (!payload) {
      return null;
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    return user || null;
  } catch {
    return null;
  }
}

