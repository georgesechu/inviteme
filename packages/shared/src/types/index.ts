/**
 * Shared types used across server, web, and mobile
 */

export type GuestType = 'Single' | 'Double';

export interface Guest {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  type: GuestType;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardDesign {
  id: string;
  name: string;
  thumbnailUrl: string;
  templateUrl: string;
  createdAt: Date;
}

export interface User {
  id: string;
  phoneNumber: string;
  whatsappCode?: string;
  whatsappCodeExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invitation {
  id: string;
  userId: string;
  cardDesignId: string;
  guests: Guest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  invitationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  transactionId?: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

