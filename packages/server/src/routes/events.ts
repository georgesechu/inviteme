/**
 * Event management routes
 */
import { Router, Response } from 'express';
import { ApiResponse, Event } from '@inviteme/shared';
// eslint-disable-next-line import/named
import type { CreateEventBody, UpdateEventBody } from '@inviteme/shared';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/events
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: events } as ApiResponse<Event[]>);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/events
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, date, location, description } = req.body as CreateEventBody;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      } as ApiResponse<null>);
    }
    const created = await prisma.event.create({
      data: {
        userId: req.user!.id,
        name: name.trim(),
        date: date ? new Date(date) : undefined,
        location: location?.trim(),
        description: description?.trim(),
      },
    });
    return res.status(201).json({ success: true, data: created } as ApiResponse<Event>);
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/events/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, date, location, description } = req.body as UpdateEventBody;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      } as ApiResponse<null>);
    }
    if (event.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse<null>);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        name: name?.trim() ?? event.name,
        date: date ? new Date(date) : event.date,
        location: location?.trim() ?? event.location,
        description: description?.trim() ?? event.description,
      },
    });
    return res.json({ success: true, data: updated } as ApiResponse<Event>);
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/events/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      } as ApiResponse<null>);
    }
    if (event.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse<null>);
    }

    await prisma.event.delete({ where: { id } });
    return res.json({ success: true, message: 'Event deleted' } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

export default router;

