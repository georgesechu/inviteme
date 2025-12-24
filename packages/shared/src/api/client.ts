/**
 * Typed API client using fetch
 */
import type {
  ApiResponse,
  AuthRequestCodeBody,
  AuthRequestCodeResponse,
  AuthVerifyCodeBody,
  AuthVerifyCodeResponse,
  CreateGuestBody,
  CreateGuestResponse,
  UpdateGuestBody,
  UpdateGuestResponse,
  GetGuestsResponse,
  DeleteGuestResponse,
  GetEventsResponse,
  CreateEventBody,
  CreateEventResponse,
  UpdateEventBody,
  UpdateEventResponse,
  DeleteEventResponse,
  GetCardDesignsResponse,
  GetCardDesignResponse,
  CreateCardDesignBody,
  CreateCardDesignResponse,
  UpdateCardDesignBody,
  UpdateCardDesignResponse,
} from './types';
import {
  AUTH_REQUEST_CODE,
  AUTH_VERIFY_CODE,
  EVENTS_BASE,
  GUESTS_BASE,
  CARD_DESIGNS_BASE,
  ACCOUNT_BASE,
  ACCOUNT_PURCHASE_BUNDLE,
  INVITATIONS_SEND,
} from './paths';
import type {
  GetAccountResponse,
  PurchaseBundleBody,
  PurchaseBundleResponseType,
} from './account';
import type {
  SendInvitationsBody,
  SendInvitationsResponseType,
} from './invitations';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.getToken = config.getToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const token = this.getToken?.();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = (await response.json()) as ApiResponse<T>;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        } as ApiResponse<T>;
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      } as ApiResponse<T>;
    }
  }

  // Auth endpoints
  async requestCode(body: AuthRequestCodeBody): Promise<AuthRequestCodeResponse> {
    return this.request<null>(AUTH_REQUEST_CODE, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<AuthRequestCodeResponse>;
  }

  async verifyCode(body: AuthVerifyCodeBody): Promise<AuthVerifyCodeResponse> {
    return this.request<AuthVerifyCodeResponse['data']>(AUTH_VERIFY_CODE, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<AuthVerifyCodeResponse>;
  }

  // Guest endpoints
  async getGuests(eventId: string): Promise<GetGuestsResponse> {
    const path = GUESTS_BASE.replace(':eventId', eventId);
    return this.request<GetGuestsResponse['data']>(path, {
      method: 'GET',
    }) as Promise<GetGuestsResponse>;
  }

  async createGuest(body: CreateGuestBody): Promise<CreateGuestResponse> {
    const path = GUESTS_BASE.replace(':eventId', body.eventId);
    return this.request<CreateGuestResponse['data']>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<CreateGuestResponse>;
  }

  async updateGuest(id: string, body: UpdateGuestBody): Promise<UpdateGuestResponse> {
    if (!body.eventId) {
      throw new Error('eventId is required to update a guest');
    }
    const path = `${GUESTS_BASE.replace(':eventId', body.eventId)}/${id}`;
    return this.request<UpdateGuestResponse['data']>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }) as Promise<UpdateGuestResponse>;
  }

  async deleteGuest(id: string, eventId: string): Promise<DeleteGuestResponse> {
    const path = `${GUESTS_BASE.replace(':eventId', eventId)}/${id}`;
    return this.request<null>(path, {
      method: 'DELETE',
    }) as Promise<DeleteGuestResponse>;
  }

  // Events endpoints
  async getEvents(): Promise<GetEventsResponse> {
    return this.request<GetEventsResponse['data']>(EVENTS_BASE, {
      method: 'GET',
    }) as Promise<GetEventsResponse>;
  }

  async createEvent(body: CreateEventBody): Promise<CreateEventResponse> {
    return this.request<CreateEventResponse['data']>(EVENTS_BASE, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<CreateEventResponse>;
  }

  async updateEvent(id: string, body: UpdateEventBody): Promise<UpdateEventResponse> {
    return this.request<UpdateEventResponse['data']>(`${EVENTS_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }) as Promise<UpdateEventResponse>;
  }

  async deleteEvent(id: string): Promise<DeleteEventResponse> {
    return this.request<null>(`${EVENTS_BASE}/${id}`, {
      method: 'DELETE',
    }) as Promise<DeleteEventResponse>;
  }

  // Card Designs endpoints
  async getCardDesigns(): Promise<GetCardDesignsResponse> {
    return this.request<GetCardDesignsResponse['data']>(CARD_DESIGNS_BASE, {
      method: 'GET',
    }) as Promise<GetCardDesignsResponse>;
  }

  async getCardDesign(id: string): Promise<GetCardDesignResponse> {
    return this.request<GetCardDesignResponse['data']>(`${CARD_DESIGNS_BASE}/${id}`, {
      method: 'GET',
    }) as Promise<GetCardDesignResponse>;
  }

  async createCardDesign(body: CreateCardDesignBody): Promise<CreateCardDesignResponse> {
    return this.request<CreateCardDesignResponse['data']>(CARD_DESIGNS_BASE, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<CreateCardDesignResponse>;
  }

  async updateCardDesign(id: string, body: UpdateCardDesignBody): Promise<UpdateCardDesignResponse> {
    return this.request<UpdateCardDesignResponse['data']>(`${CARD_DESIGNS_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }) as Promise<UpdateCardDesignResponse>;
  }

  // Account endpoints
  async getAccount(): Promise<GetAccountResponse> {
    return this.request<GetAccountResponse['data']>(ACCOUNT_BASE, {
      method: 'GET',
    }) as Promise<GetAccountResponse>;
  }

  async purchaseBundle(body: PurchaseBundleBody): Promise<PurchaseBundleResponseType> {
    return this.request<PurchaseBundleResponseType['data']>(ACCOUNT_PURCHASE_BUNDLE, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<PurchaseBundleResponseType>;
  }

  // Invitations endpoints
  async sendInvitations(body: SendInvitationsBody): Promise<SendInvitationsResponseType> {
    return this.request<SendInvitationsResponseType['data']>(INVITATIONS_SEND, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<SendInvitationsResponseType>;
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

