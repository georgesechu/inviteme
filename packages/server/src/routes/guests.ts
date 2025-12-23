/**
 * Guest management routes
 */
import { Router, Response } from 'express';
import {
  Guest,
  GuestType,
  ApiResponse,
  normalizeCode,
  generateCode,
  CreateGuestBody,
  UpdateGuestBody,
} from '@inviteme/shared';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/guests
 * Get all guests for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const guests = await prisma.guest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({
      success: true,
      data: guests,
    } as ApiResponse<Guest[]>);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/guests
 * Create a new guest
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, type } = req.body as CreateGuestBody;

    if (!name || !mobile || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name, mobile, and type are required',
      } as ApiResponse<null>);
    }

    if (type !== 'Single' && type !== 'Double') {
      return res.status(400).json({
        success: false,
        error: 'Type must be "Single" or "Double"',
      } as ApiResponse<null>);
    }

    // Ensure unique code
    let code: string | null = null;
    for (let i = 0; i < 5; i++) {
      const candidate = normalizeCode(generateCode()) || generateCode();
      const existing = await prisma.guest.findUnique({ where: { code: candidate } });
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return res.status(500).json({
        success: false,
        error: 'Could not generate unique code, please try again',
      } as ApiResponse<null>);
    }

    const created = await prisma.guest.create({
      data: {
        userId: req.user!.id,
        name: name.trim(),
        mobile: mobile.trim(),
        type,
        code,
      },
    });

    return res.status(201).json({
      success: true,
      data: created,
    } as ApiResponse<Guest>);
  } catch (error) {
    console.error('Error creating guest:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/guests/:id
 * Update a guest
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, mobile, type } = req.body as UpdateGuestBody;

    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest) {
      return res.status(404).json({
        success: false,
        error: 'Guest not found',
      } as ApiResponse<null>);
    }

    // Verify ownership
    if (guest.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse<null>);
    }

    const data: Partial<Guest> = {};
    if (name) data.name = name.trim();
    if (mobile) data.mobile = mobile.trim();
    if (type && (type === 'Single' || type === 'Double')) {
      data.type = type as GuestType;
    }

    const updated = await prisma.guest.update({
      where: { id },
      data,
    });

    return res.json({
      success: true,
      data: updated,
    } as ApiResponse<Guest>);
  } catch (error) {
    console.error('Error updating guest:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/guests/:id
 * Delete a guest
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest) {
      return res.status(404).json({
        success: false,
        error: 'Guest not found',
      } as ApiResponse<null>);
    }

    // Verify guest belongs to user
    if (guest.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse<null>);
    }

    await prisma.guest.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Guest deleted successfully',
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting guest:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

export default router;

