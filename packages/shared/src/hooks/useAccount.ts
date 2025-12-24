import { useCallback, useEffect, useState } from 'react';
import type { AccountSDK } from '../sdk/account';
import type { AccountState } from '../sdk/types';
import type { PurchaseBundleBody, PurchaseBundleResponse } from '../api/account';

export function useAccount(accountSDK: AccountSDK) {
  const [state, setState] = useState<AccountState>(accountSDK.getState());

  useEffect(() => {
    const unsubscribe = accountSDK.subscribe(setState);
    return unsubscribe;
  }, [accountSDK]);

  const loadAccount = useCallback(async (): Promise<void> => {
    await accountSDK.loadAccount();
  }, [accountSDK]);

  const purchaseBundle = useCallback(
    async (data: PurchaseBundleBody): Promise<PurchaseBundleResponse | null> => {
      return await accountSDK.purchaseBundle(data);
    },
    [accountSDK]
  );

  const getMessageCredits = useCallback((): number => {
    return accountSDK.getMessageCredits();
  }, [accountSDK]);

  return {
    account: state.account,
    isLoading: state.isLoading,
    error: state.error,
    isPurchasing: state.isPurchasing,
    loadAccount,
    purchaseBundle,
    getMessageCredits,
  };
}

