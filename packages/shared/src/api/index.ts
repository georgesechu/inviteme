/**
 * API exports
 */
export * from './paths';
export * from './types';
export * from './client';

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

