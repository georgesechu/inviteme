/**
 * Webhook routes for external services (Twilio, etc.)
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

/**
 * POST /api/webhooks/twilio/status
 * Twilio status callback webhook
 * Receives status updates for sent messages
 */
router.post('/twilio/status', async (req: Request, res: Response) => {
  try {
    // Twilio sends status updates as form-encoded data
    const {
      MessageSid,
      MessageStatus,
      To,
    } = req.body;

    if (!MessageSid || !MessageStatus) {
      console.warn('Twilio webhook missing required fields:', req.body);
      res.status(400).send('Missing required fields');
      return;
    }

    console.log('Twilio status update:', {
      MessageSid,
      MessageStatus,
      To,
    });

    // Find guest by message SID
    const guest = await prisma.guest.findFirst({
      where: { messageSid: MessageSid },
    });

    if (!guest) {
      console.warn(`No guest found for message SID: ${MessageSid}`);
      // Still return 200 to Twilio to acknowledge receipt
      res.status(200).send('OK');
      return;
    }

    // Map Twilio status to our status
    let sendStatus: string | null = null;
    const updateData: any = {};

    switch (MessageStatus) {
      case 'sent':
        sendStatus = 'sent';
        updateData.lastSentAt = new Date();
        break;
      case 'delivered':
        sendStatus = 'delivered';
        updateData.lastDeliveredAt = new Date();
        // If we haven't set sent status yet, set it now
        if (guest.sendStatus !== 'sent' && guest.sendStatus !== 'delivered' && guest.sendStatus !== 'read') {
          updateData.lastSentAt = new Date();
        }
        break;
      case 'read':
        sendStatus = 'read';
        updateData.lastReadAt = new Date();
        // Ensure delivered is also set
        if (!guest.lastDeliveredAt) {
          updateData.lastDeliveredAt = new Date();
        }
        break;
      case 'failed':
      case 'undelivered':
        sendStatus = 'failed';
        break;
      default:
        // For other statuses (queued, etc.), we don't update
        console.log(`Unhandled status: ${MessageStatus}`);
        res.status(200).send('OK');
        return;
    }

    // Update guest status
    if (sendStatus) {
      await prisma.guest.update({
        where: { id: guest.id },
        data: {
          sendStatus,
          ...updateData,
        },
      });

      console.log(`Updated guest ${guest.id} (${guest.name}) status to ${sendStatus}`);
    }

    // Always return 200 to Twilio
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    // Still return 200 to prevent Twilio from retrying
    res.status(200).send('OK');
  }
});

export default router;

