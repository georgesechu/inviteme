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
} from './types';
import {
  AUTH_REQUEST_CODE,
  AUTH_VERIFY_CODE,
  GUESTS_BASE,
} from './paths';

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
  async getGuests(): Promise<GetGuestsResponse> {
    return this.request<GetGuestsResponse['data']>(GUESTS_BASE, {
      method: 'GET',
    }) as Promise<GetGuestsResponse>;
  }

  async createGuest(body: CreateGuestBody): Promise<CreateGuestResponse> {
    return this.request<CreateGuestResponse['data']>(GUESTS_BASE, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<CreateGuestResponse>;
  }

  async updateGuest(id: string, body: UpdateGuestBody): Promise<UpdateGuestResponse> {
    return this.request<UpdateGuestResponse['data']>(`${GUESTS_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }) as Promise<UpdateGuestResponse>;
  }

  async deleteGuest(id: string): Promise<DeleteGuestResponse> {
    return this.request<null>(`${GUESTS_BASE}/${id}`, {
      method: 'DELETE',
    }) as Promise<DeleteGuestResponse>;
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

