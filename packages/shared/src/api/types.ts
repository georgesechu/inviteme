/**
 * API request/response types
 */
import type { User, Guest, Event } from '../types';
import type { ApiResponse } from '../types';

// Re-export ApiResponse for convenience
export type { ApiResponse } from '../types';

// Auth API types
export interface AuthRequestCodeBody {
  phoneNumber: string;
}

export type AuthRequestCodeResponse = ApiResponse<null>;

export interface AuthVerifyCodeBody {
  phoneNumber: string;
  code: string;
}

export interface AuthVerifyCodeResponse extends ApiResponse<{
  user: User;
  token: string;
}> {}

// Guests API types
export type GetGuestsResponse = ApiResponse<Guest[]>;

export interface CreateGuestBody {
  eventId: string;
  name: string;
  mobile: string;
  type: 'Single' | 'Double';
}

export type CreateGuestResponse = ApiResponse<Guest>;

export interface UpdateGuestBody {
  eventId?: string;
  name?: string;
  mobile?: string;
  type?: 'Single' | 'Double';
}

export type UpdateGuestResponse = ApiResponse<Guest>;

export type DeleteGuestResponse = ApiResponse<null>;

// Events API types
export type GetEventsResponse = ApiResponse<Event[]>;

export interface CreateEventBody {
  name: string;
  date?: string;
  location?: string;
  description?: string;
}

export type CreateEventResponse = ApiResponse<Event>;

export interface UpdateEventBody {
  name?: string;
  date?: string;
  location?: string;
  description?: string;
}

export type UpdateEventResponse = ApiResponse<Event>;

export type DeleteEventResponse = ApiResponse<null>;

