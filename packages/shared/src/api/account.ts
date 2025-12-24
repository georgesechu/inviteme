/**
 * Account API types
 */
import type { ApiResponse } from './types';

export interface AccountInfoData {
  id: string;
  phoneNumber: string;
  messageCredits: number;
  createdAt: Date;
}

export interface MessageBundle {
  id: string;
  userId: string;
  messages: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseBundleBody {
  messages: number;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}

export interface PurchaseBundleResponse {
  bundle: MessageBundle;
  payment: any;
  newBalance: number;
}

export type GetAccountResponse = ApiResponse<AccountInfoData>;
export type PurchaseBundleResponseType = ApiResponse<PurchaseBundleResponse>;

