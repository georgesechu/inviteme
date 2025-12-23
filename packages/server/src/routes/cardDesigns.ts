/**
 * Card design management routes
 */
import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, CardDesign } from '@inviteme/shared';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/card-designs
 * Get all available card designs
 */
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const designs = await prisma.cardDesign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: designs.map((d: any) => ({
        id: d.id,
        name: d.name,
        thumbnailUrl: d.thumbnailUrl,
        templateUrl: d.templateUrl,
        templateConfig: d.templateConfig as any,
        createdAt: d.createdAt,
      })),
    } as ApiResponse<CardDesign[]>);
  } catch (error) {
    console.error('Error fetching card designs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/card-designs
 * Create a new card design (admin only - for now, any authenticated user)
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, thumbnailUrl, templateUrl } = req.body;

    if (!name || !thumbnailUrl || !templateUrl) {
      return res.status(400).json({
        success: false,
        error: 'Name, thumbnailUrl, and templateUrl are required',
      } as ApiResponse<null>);
    }

    const design = await prisma.cardDesign.create({
      data: {
        id: uuidv4(),
        name: name.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        templateUrl: templateUrl.trim(),
      },
    });

      return res.status(201).json({
        success: true,
        data: {
          id: design.id,
          name: design.name,
          thumbnailUrl: design.thumbnailUrl,
          templateUrl: design.templateUrl,
          templateConfig: design.templateConfig as any,
          createdAt: design.createdAt,
        },
      } as ApiResponse<CardDesign>);
    } catch (error) {
      console.error('Error creating card design:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  });

/**
 * GET /api/card-designs/:id
 * Get a single card design
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const design = await prisma.cardDesign.findUnique({ where: { id } });

    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found',
      } as ApiResponse<null>);
    }

    return res.json({
      success: true,
      data: {
        id: design.id,
        name: design.name,
        thumbnailUrl: design.thumbnailUrl,
        templateUrl: design.templateUrl,
        templateConfig: design.templateConfig as any,
        createdAt: design.createdAt,
      },
    } as ApiResponse<CardDesign>);
  } catch (error) {
    console.error('Error fetching card design:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/card-designs/:id
 * Update a card design (including template config)
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, thumbnailUrl, templateUrl, templateConfig } = req.body;

    const design = await prisma.cardDesign.findUnique({ where: { id } });
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found',
      } as ApiResponse<null>);
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl.trim();
    if (templateUrl) updateData.templateUrl = templateUrl.trim();
    if (templateConfig !== undefined) updateData.templateConfig = templateConfig;

    const updated = await prisma.cardDesign.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        thumbnailUrl: updated.thumbnailUrl,
        templateUrl: updated.templateUrl,
        templateConfig: updated.templateConfig as any,
        createdAt: updated.createdAt,
      },
    } as ApiResponse<CardDesign>);
  } catch (error) {
    console.error('Error updating card design:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

export default router;

