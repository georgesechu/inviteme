/**
 * Authentication service
 */
import { prisma } from '../config/database';
import { sendWhatsAppCode } from './whatsapp';
import { formatTanzanianPhone } from '@inviteme/shared';
import type { User as PrismaUser } from '@prisma/client';

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

  // Send code via WhatsApp
  const sent = await sendWhatsAppCode(formattedPhone, code);
  if (!sent) {
    return { success: false, message: 'Failed to send WhatsApp code' };
  }

  return { success: true, message: 'Code sent successfully' };
}

/**
 * Verify login code
 */
export async function verifyLoginCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; user?: PrismaUser; token?: string }> {
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
export async function verifyTokenAsync(token: string): Promise<PrismaUser | null> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user || null;
  } catch {
    return null;
  }
}

