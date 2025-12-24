import { Router, Response } from 'express';
import { ApiResponse } from '@inviteme/shared';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendTemplateMessage, sendWhatsAppMedia } from '../services/twilioClient';
import { generateGuestCard, cardExists } from '../services/cardGenerator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/invitations/send
 * Send invitations to selected guests
 */
router.post('/send', async (req: AuthRequest, res: Response) => {
  try {
    const { guestIds, eventId } = req.body;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Guest IDs are required',
      } as ApiResponse<null>);
    }

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required',
      } as ApiResponse<null>);
    }

    // Verify event belongs to user
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse<null>);
    }

    // Get guests and verify they belong to the user and event
    const guests = await prisma.guest.findMany({
      where: {
        id: { in: guestIds },
        userId: req.user!.id,
        eventId: eventId,
      },
    });

    if (guests.length !== guestIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some guests were not found or do not belong to you',
      } as ApiResponse<null>);
    }

    // Check user has enough message credits
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { messageCredits: true },
    });

    if (!user || user.messageCredits < guests.length) {
      return res.status(400).json({
        success: false,
        error: `Insufficient message credits. You have ${user.messageCredits} but need ${guests.length}`,
      } as ApiResponse<null>);
    }

    // Get event to build card URL
    const baseUrl = process.env.BASE_URL || 'http://46.62.209.58';
    const invitationTemplateId = process.env.TWILIO_INVITATION_TEMPLATE_ID;
    const results = [];

    if (!invitationTemplateId) {
      return res.status(400).json({
        success: false,
        error: 'TWILIO_INVITATION_TEMPLATE_ID not configured',
      } as ApiResponse<null>);
    }

    // Send invitations to each guest
    for (const guest of guests) {
      try {
        // Generate card image if it doesn't exist
        let cardUrl: string;
        if (!cardExists(guest.code)) {
          const generatedPath = await generateGuestCard(guest.id);
          if (!generatedPath) {
            throw new Error('Failed to generate card image');
          }
          cardUrl = `${baseUrl}${generatedPath}`;
        } else {
          cardUrl = `${baseUrl}/cards/${guest.code}.png`;
        }

        // Build status callback URL for this guest
        const statusCallbackUrl = `${baseUrl}/api/webhooks/twilio/status`;

        // Send WhatsApp message with template and media
        // First send the image
        const mediaResult = await sendWhatsAppMedia(guest.mobile, cardUrl, '', statusCallbackUrl);
        
        if (!mediaResult.success) {
          throw new Error(mediaResult.error || 'Failed to send image');
        }

        // Then send template message (if template supports variables)
        // Note: Template message is optional - we primarily send the image
        await sendTemplateMessage(guest.mobile, invitationTemplateId, {
          '1': guest.name,
          '2': event.name || '',
        }).catch(err => {
          // Log but don't fail if template send fails
          console.warn(`Template message failed for guest ${guest.id}:`, err);
        });

        // Consider it successful if media was sent (template is optional)
        if (mediaResult.success) {
          // Update guest status with message SID for tracking
          await prisma.guest.update({
            where: { id: guest.id },
            data: {
              sendStatus: 'sent',
              messageSid: mediaResult.sid || null,
              lastSentAt: new Date(),
            },
          });

          // Deduct message credit
          await prisma.user.update({
            where: { id: req.user!.id },
            data: {
              messageCredits: {
                decrement: 1,
              },
            },
          });

          results.push({
            guestId: guest.id,
            success: true,
            messageId: mediaResult.sid,
          });
        } else {
          // Update guest status to failed
          await prisma.guest.update({
            where: { id: guest.id },
            data: {
              sendStatus: 'failed',
              lastSentAt: new Date(),
            },
          });

          results.push({
            guestId: guest.id,
            success: false,
            error: mediaResult.error,
          });
        }
      } catch (error) {
        console.error(`Error sending to guest ${guest.id}:`, error);
        await prisma.guest.update({
          where: { id: guest.id },
          data: {
            sendStatus: 'failed',
            lastSentAt: new Date(),
          },
        });

        results.push({
          guestId: guest.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      data: {
        results,
        summary: {
          total: guests.length,
          successful: successCount,
          failed: failCount,
        },
      },
    } as ApiResponse<{
      results: Array<{
        guestId: string;
        success: boolean;
        messageId?: string;
        error?: string;
      }>;
      summary: {
        total: number;
        successful: number;
        failed: number;
      };
    }>);
  } catch (error) {
    console.error('Error sending invitations:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

export default router;
