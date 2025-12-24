/**
 * Shared types used across server, web, and mobile
 */

export type GuestType = 'Single' | 'Double';

export interface Guest {
  id: string;
  userId: string;
  eventId: string;
  name: string;
  mobile: string;
  type: GuestType;
  code: string;
  sendStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | null;
  messageSid?: string | null;
  lastSentAt?: Date | null;
  lastDeliveredAt?: Date | null;
  lastReadAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  userId: string;
  name: string;
  date?: Date;
  location?: string;
  description?: string;
  cardDesignImageUrl?: string | null;
  cardTemplateConfig?: TemplateConfig | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'qr';
  field?: string; // Data field to bind (e.g., 'guest.name', 'event.date')
  content?: string; // Static content or template string
  position: {
    x: number; // Percentage (0-100) or pixels
    y: number;
    anchor?: 'center' | 'left' | 'right' | 'top' | 'bottom';
  };
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | 'lighter';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
    size?: number; // For QR codes
  };
  dynamic: boolean;
}

export interface TemplateConfig {
  version: string;
  baseImage: string;
  elements: TemplateElement[];
}

export interface CardDesign {
  id: string;
  name: string;
  thumbnailUrl: string;
  templateUrl: string;
  templateConfig?: TemplateConfig | null;
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

