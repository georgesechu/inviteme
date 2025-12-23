/**
 * WhatsApp service for sending messages
 */
import twilio from 'twilio';
import { formatTanzanianPhone } from '@inviteme/shared';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send WhatsApp message with code
 */
export async function sendWhatsAppCode(phoneNumber: string, code: string): Promise<boolean> {
  if (!twilioClient || !fromNumber) {
    console.warn('Twilio not configured, skipping WhatsApp send');
    return false;
  }

  try {
    const formattedPhone = formatTanzanianPhone(phoneNumber);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    const message = await twilioClient.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${formattedPhone}`,
      body: `Your InviteMe verification code is: ${code}\n\nThis code will expire in 10 minutes.`,
    });

    console.log(`WhatsApp code sent to ${formattedPhone}, SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp code:', error);
    return false;
  }
}

/**
 * Send invitation card via WhatsApp
 */
export async function sendInvitationCard(
  phoneNumber: string,
  cardUrl: string,
  guestName: string,
  code: string
): Promise<boolean> {
  if (!twilioClient || !fromNumber) {
    console.warn('Twilio not configured, skipping WhatsApp send');
    return false;
  }

  try {
    const formattedPhone = formatTanzanianPhone(phoneNumber);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    const templateId = process.env.TWILIO_TEMPLATE_ID;
    
    if (templateId) {
      // Use template if available
      const message = await twilioClient.messages.create({
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${formattedPhone}`,
        contentSid: templateId,
        contentVariables: JSON.stringify({
          '1': code,
          '2': code,
        }),
      });
      console.log(`WhatsApp invitation sent to ${formattedPhone}, SID: ${message.sid}`);
    } else {
      // Fallback to plain message
      const message = await twilioClient.messages.create({
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${formattedPhone}`,
        body: `Wedding Invitation for ${guestName}\n\nCard: ${cardUrl}\nCode: ${code}`,
      });
      console.log(`WhatsApp invitation sent to ${formattedPhone}, SID: ${message.sid}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending invitation card:', error);
    return false;
  }
}

