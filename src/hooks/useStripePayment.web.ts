/**
 * Stripe Payment Hook — Web Stub
 *
 * Stripe PaymentSheet is a native-only (iOS/Android) feature.
 * On web, this hook returns an idle state so the UI renders
 * without crashing. The payment method selector will still
 * offer M-Pesa and Paystack as alternatives.
 */

import { useState, useCallback } from 'react';
import type { CurrencyCode } from '../constants/types';

export type StripeStep = 'idle' | 'success' | 'error';

export interface StripePaymentState {
  step: StripeStep;
  paymentIntentId?: string;
  errorMessage?: string;
}

/**
 * Web-safe stub — Stripe native payments are not available on web.
 */
export function useStripePayment() {
  const [state, setState] = useState<StripePaymentState>({ step: 'idle' });

  const reset = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  const startPayment = useCallback(
    async (_params: {
      amount: number;
      currency: CurrencyCode;
      planName: string;
      metadata?: Record<string, unknown>;
    }) => {
      setState({
        step: 'error',
        errorMessage: 'Stripe payments are not available on web. Please use M-Pesa or Paystack.',
      });
    },
    [],
  );

  const retry = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  return {
    ...state,
    isProcessing: false,
    startPayment,
    reset,
    retry,
  };
}
