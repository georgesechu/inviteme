/**
 * Invitations API types
 */
import type { ApiResponse } from './types';

export interface SendInvitationsBody {
  guestIds: string[];
  eventId: string;
}

export interface SendInvitationsResult {
  guestId: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendInvitationsResponse {
  results: SendInvitationsResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export type SendInvitationsResponseType = ApiResponse<SendInvitationsResponse>;

