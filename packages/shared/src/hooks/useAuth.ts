/**
 * React hook for authentication
 * Note: This requires React to be available
 */
import { useState, useEffect, useCallback } from 'react';
import type { AuthSDK } from '../sdk/auth';
import type { AuthState, RequestCodeState, VerifyCodeState } from '../sdk/types';

export function useAuth(authSDK: AuthSDK) {
  const [authState, setAuthState] = useState<AuthState>(authSDK.getState());
  const [requestCodeState, setRequestCodeState] = useState<RequestCodeState>(
    authSDK.getRequestCodeState()
  );
  const [verifyCodeState, setVerifyCodeState] = useState<VerifyCodeState>(
    authSDK.getVerifyCodeState()
  );

  useEffect(() => {
    const unsubscribeAuth = authSDK.subscribe(setAuthState);
    const unsubscribeRequest = authSDK.subscribeRequestCode(setRequestCodeState);
    const unsubscribeVerify = authSDK.subscribeVerifyCode(setVerifyCodeState);

    return () => {
      unsubscribeAuth();
      unsubscribeRequest();
      unsubscribeVerify();
    };
  }, [authSDK]);

  const requestCode = useCallback(
    async (phoneNumber: string) => {
      await authSDK.requestCode(phoneNumber);
    },
    [authSDK]
  );

  const verifyCode = useCallback(
    async (phoneNumber: string, code: string) => {
      return await authSDK.verifyCode(phoneNumber, code);
    },
    [authSDK]
  );

  const logout = useCallback(() => {
    authSDK.logout();
  }, [authSDK]);

  return {
    // Auth state
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,

    // Request code state
    requestCodeState: {
      isLoading: requestCodeState.isLoading,
      error: requestCodeState.error,
      success: requestCodeState.success,
    },

    // Verify code state
    verifyCodeState: {
      isLoading: verifyCodeState.isLoading,
      error: verifyCodeState.error,
      success: verifyCodeState.success,
    },

    // Actions
    requestCode,
    verifyCode,
    logout,
  };
}

