/**
 * Authentication routes
 */
import { Router, Request, Response } from 'express';
import {
  AUTH_REQUEST_CODE,
  AUTH_VERIFY_CODE,
} from '@inviteme/shared';
import type {
  ApiResponse,
  AuthRequestCodeBody,
  AuthVerifyCodeBody,
  AuthVerifyCodeResponse,
  AuthRequestCodeResponse,
} from '@inviteme/shared';
import { requestLoginCode, verifyLoginCode } from '../services/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Rate-limit request-code to avoid abuse (e.g., 5 requests per 5 minutes per IP)
const requestCodeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
});

/**
 * POST /api/auth/request-code
 * Request a login code via WhatsApp
 */
router.post(
  AUTH_REQUEST_CODE.replace('/api/auth', ''), // keep router mounting clean
  requestCodeRateLimit,
  async (req: Request<unknown, AuthRequestCodeResponse, AuthRequestCodeBody>, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      } as ApiResponse<null>);
    }

    const result = await requestLoginCode(phoneNumber);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
      } as ApiResponse<null>);
    }

    return res.json({
      success: true,
      message: result.message,
    } as AuthRequestCodeResponse);
  } catch (error) {
    console.error('Error requesting login code:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/auth/verify-code
 * Verify login code and get token
 */
router.post(
  AUTH_VERIFY_CODE.replace('/api/auth', ''),
  async (req: Request<unknown, AuthVerifyCodeResponse, AuthVerifyCodeBody>, res: Response) => {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and code are required',
        } as ApiResponse<null>);
      }

      const result = await verifyLoginCode(phoneNumber, code);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: 'Invalid code or code expired',
        } as ApiResponse<null>);
      }

      return res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
      } as AuthVerifyCodeResponse);
    } catch (error) {
      console.error('Error verifying code:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>);
    }
  }
);

export default router;

