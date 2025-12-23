/**
 * Payment management routes
 */
import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, Payment } from '@inviteme/shared';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/payments
 * Create a payment for sharing invitation cards
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { invitationId, amount, currency, paymentMethod } = req.body;

    if (!invitationId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'invitationId, amount, and paymentMethod are required',
      } as ApiResponse<null>);
    }

    // Verify invitation belongs to user
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.userId !== req.user!.id) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found',
      } as ApiResponse<null>);
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        invitationId,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        status: 'pending',
        paymentMethod,
      },
    });

    // TODO: Integrate with payment gateway (Stripe, PayPal, etc.)
    // For now, we'll just create the payment record

    return res.status(201).json({
      success: true,
      data: {
        id: payment.id,
        userId: payment.userId,
        invitationId: payment.invitationId,
        amount: payment.amount.toNumber(),
        currency: payment.currency,
        status: payment.status as Payment['status'],
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId || undefined,
        createdAt: payment.createdAt,
      },
    } as ApiResponse<Payment>);
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/payments
 * Get all payments for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      include: {
        invitation: {
          include: {
            cardDesign: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: payments.map(p => ({
        id: p.id,
        userId: p.userId,
        invitationId: p.invitationId,
        amount: p.amount.toNumber(),
        currency: p.currency,
        status: p.status as Payment['status'],
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId || undefined,
        createdAt: p.createdAt,
      })),
    } as ApiResponse<Payment[]>);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

export default router;

