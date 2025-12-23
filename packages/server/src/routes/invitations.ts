/**
 * Invitation management routes
 */
import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, Invitation } from '@inviteme/shared';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateCardsForInvitation } from '../services/cardGeneration';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/invitations
 * Get all invitations for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: { userId: req.user!.id },
      include: {
        cardDesign: true,
        invitationGuests: {
          include: { guest: true },
        },
        _count: {
          select: { payments: true, invitationGuests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: invitations.map(inv => ({
        id: inv.id,
        userId: inv.userId,
        cardDesignId: inv.cardDesignId,
        guests: inv.invitationGuests.map(ig => ig.guest),
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      })),
    } as ApiResponse<Invitation[]>);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/invitations
 * Create a new invitation with selected guests and card design
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { cardDesignId, guestIds } = req.body;

    if (!cardDesignId || !guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'cardDesignId and guestIds array are required',
      } as ApiResponse<null>);
    }

    // Verify card design exists
    const cardDesign = await prisma.cardDesign.findUnique({
      where: { id: cardDesignId },
    });

    if (!cardDesign) {
      return res.status(404).json({
        success: false,
        error: 'Card design not found',
      } as ApiResponse<null>);
    }

    // Verify all guests belong to the user
    const guests = await prisma.guest.findMany({
      where: {
        id: { in: guestIds },
        userId: req.user!.id,
      },
    });

    if (guests.length !== guestIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some guests not found or access denied',
      } as ApiResponse<null>);
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        cardDesignId,
        invitationGuests: {
          create: guestIds.map(id => ({ guestId: id })),
        },
      },
      include: {
        cardDesign: true,
        invitationGuests: {
          include: { guest: true },
        },
      },
    });

    // Generate cards for all guests
    await generateCardsForInvitation(invitation.id);

    return res.status(201).json({
      success: true,
      data: {
        id: invitation.id,
        userId: invitation.userId,
        cardDesignId: invitation.cardDesignId,
        guests: invitation.invitationGuests.map(ig => ig.guest),
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
      },
    } as ApiResponse<Invitation>);
  } catch (error) {
    console.error('Error creating invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

export default router;

