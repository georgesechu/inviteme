import { Router, Response } from 'express';
import { ApiResponse } from '@inviteme/shared';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/account
 * Get current user's account information including message credits
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        phoneNumber: true,
        messageCredits: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse<null>);
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        messageCredits: user.messageCredits,
        createdAt: user.createdAt,
      },
    } as ApiResponse<{
      id: string;
      phoneNumber: string;
      messageCredits: number;
      createdAt: Date;
    }>);
  } catch (error) {
    console.error('Error fetching account:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/account/purchase-bundle
 * Purchase a message bundle
 */
router.post('/purchase-bundle', async (req: AuthRequest, res: Response) => {
  try {
    const { messages, amount, currency = 'USD', paymentMethod = 'manual' } = req.body;

    if (!messages || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Messages and amount are required',
      } as ApiResponse<null>);
    }

    if (messages <= 0 || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages and amount must be positive',
      } as ApiResponse<null>);
    }

    // Create message bundle
    const bundle = await prisma.messageBundle.create({
      data: {
        userId: req.user!.id,
        messages: parseInt(messages),
        amount: parseFloat(amount),
        currency,
        status: 'pending',
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        messageBundleId: bundle.id,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        paymentMethod,
      },
    });

    // For now, we'll auto-complete the payment (in production, this would be handled by payment gateway)
    // Update bundle and payment status to completed
    const updatedBundle = await prisma.messageBundle.update({
      where: { id: bundle.id },
      data: { status: 'completed' },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
    });

    // Add messages to user's credit balance
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        messageCredits: {
          increment: parseInt(messages),
        },
      },
    });

    return res.json({
      success: true,
      data: {
        bundle: updatedBundle,
        payment,
        newBalance: (await prisma.user.findUnique({ where: { id: req.user!.id } }))?.messageCredits || 0,
      },
    } as ApiResponse<{
      bundle: any;
      payment: any;
      newBalance: number;
    }>);
  } catch (error) {
    console.error('Error purchasing bundle:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

export default router;

