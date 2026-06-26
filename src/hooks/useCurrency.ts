import { useState, useCallback, useEffect } from 'react';
import { getUserCurrency, setUserCurrency, loadUserCurrency } from '../utils/currency';
import type { CurrencyCode } from '../constants/types';

/**
 * React hook that wraps the module-level currency preference with
 * persistence via SecureStore.
 *
 * - On mount, loads the saved preference from SecureStore (async).
 * - While loading, shows 'KSh' as the safe default.
 * - `setCurrency` persists the choice to SecureStore on every change.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getUserCurrency);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted preference on mount
  useEffect(() => {
    let mounted = true;
    loadUserCurrency().then((saved) => {
      if (mounted) {
        setCurrencyState(saved);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const updateCurrency = useCallback(async (code: CurrencyCode) => {
    // Update React state immediately so the UI re-renders right away,
    // even if the caller navigates back before persistence completes.
    setCurrencyState(code);
    // Persist to SecureStore asynchronously (fire-and-forget).
    await setUserCurrency(code);
  }, []);

  return {
    currency,
    setCurrency: updateCurrency,
    isLoading,
  };
}
