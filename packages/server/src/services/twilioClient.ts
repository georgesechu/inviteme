/**
 * Twilio WhatsApp utility
 */
import twilio, { Twilio } from 'twilio';
import { formatTanzanianPhone } from '@inviteme/shared';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER; // e.g. 'whatsapp:+14155238886'
const loginTemplateId = process.env.TWILIO_LOGIN_TEMPLATE_ID; // e.g. HX31d1ee974ba95ecd06124f615c9669fc

let client: Twilio | null = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export async function sendTemplateMessage(
  toPhone: string,
  templateSid: string,
  variables: Record<string, string>
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!client || !fromNumber) {
    return { success: false, error: 'Twilio not configured' };
  }
  const formattedPhone = formatTanzanianPhone(toPhone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }
  try {
    const message = await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${formattedPhone}`,
      contentSid: templateSid,
      contentVariables: JSON.stringify(variables),
    });
    return { success: true, sid: message.sid };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send template message' };
  }
}

export async function sendLoginCode(
  toPhone: string,
  code: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!loginTemplateId) {
    return { success: false, error: 'TWILIO_LOGIN_TEMPLATE_ID not set' };
  }
  // Most templates expect variable "1" to be the code
  return sendTemplateMessage(toPhone, loginTemplateId, { '1': code });
}

export async function sendWhatsAppText(
  toPhone: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!client || !fromNumber) {
    return { success: false, error: 'Twilio not configured' };
  }
  const formattedPhone = formatTanzanianPhone(toPhone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }
  try {
    const message = await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${formattedPhone}`,
      body,
    });
    return { success: true, sid: message.sid };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send message' };
  }
}

