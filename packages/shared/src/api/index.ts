/**
 * API exports
 */
export * from './paths';
export * from './types';
export * from './client';
export * from './account';
export * from './invitations';

// Re-export types from auth and guests (paths are in paths.ts)
export type {
  AuthRequestCodeBody,
  AuthRequestCodeResponse,
  AuthVerifyCodeBody,
  AuthVerifyCodeResponse,
} from './auth';

export type {
  GetGuestsResponse,
  CreateGuestBody,
  CreateGuestResponse,
  UpdateGuestBody,
  UpdateGuestResponse,
  DeleteGuestResponse,
} from './guests';

export type {
  GetEventsResponse,
  CreateEventBody,
  CreateEventResponse,
  UpdateEventBody,
  UpdateEventResponse,
  DeleteEventResponse,
} from './events';

// Re-export Event type for convenience
export type { Event } from '../types';

export type {
  GetCardDesignsResponse,
  GetCardDesignResponse,
  CreateCardDesignBody,
  CreateCardDesignResponse,
  UpdateCardDesignBody,
  UpdateCardDesignResponse,
} from './cardDesigns';

