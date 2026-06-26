/**
 * Stripe Payment Hook
 *
 * Manages the full Stripe PaymentSheet flow:
 *   1. Fetch client secret from backend
 *   2. Initialize PaymentSheet
 *   3. Present PaymentSheet (native UI)
 *   4. Handle success/failure
 *
 * All credentials stay on the server — the client never sees
 * the secret key, and even the publishable key comes from the server.
 */

import { useState, useCallback, useRef } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import {
  createStripePaymentIntent,
  getStripePublishableKey,
} from '../services/stripeService';
import { CurrencyCode } from '../constants/types';

export type StripeStep =
  | 'idle'
  | 'loading_key'
  | 'creating_intent'
  | 'initializing_sheet'
  | 'ready'
  | 'presenting'
  | 'success'
  | 'error';

export interface StripePaymentState {
  step: StripeStep;
  paymentIntentId?: string;
  clientSecret?: string;
  errorMessage?: string;
  amount?: number;
  currency?: string;
}

/**
 * Hook that manages the Stripe PaymentSheet flow end-to-end.
 */
export function useStripePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [state, setState] = useState<StripePaymentState>({ step: 'idle' });
  const publishableKeyRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  /**
   * Start the Stripe payment flow:
   * 1. Get publishable key (cached)
   * 2. Create PaymentIntent
   * 3. Init PaymentSheet
   * 4. Present PaymentSheet
   */
  const startPayment = useCallback(
    async ({
      amount,
      currency,
      planName,
      metadata,
    }: {
      amount: number;
      currency: CurrencyCode;
      planName: string;
      metadata?: Record<string, unknown>;
    }) => {
      try {
        // Step 1: Get publishable key (cache after first fetch)
        if (!publishableKeyRef.current) {
          setState({ step: 'loading_key' });
          const keyRes = await getStripePublishableKey();
          if (!keyRes.success || !keyRes.publishableKey) {
            setState({
              step: 'error',
              errorMessage: keyRes.error || 'Failed to initialize payment',
            });
            return;
          }
          publishableKeyRef.current = keyRes.publishableKey;
        }

        // Step 2: Create PaymentIntent
        setState({ step: 'creating_intent' });
        const intentRes = await createStripePaymentIntent({
          amount,
          currency,
          description: `HAMA ${planName} Subscription`,
          metadata: {
            plan_name: planName,
            ...metadata,
          },
        });

        if (!intentRes.success || !intentRes.clientSecret) {
          setState({
            step: 'error',
            errorMessage: intentRes.error || 'Failed to create payment',
          });
          return;
        }

        // Step 3: Initialize PaymentSheet
        setState({ step: 'initializing_sheet' });
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'HAMA',
          paymentIntentClientSecret: intentRes.clientSecret,
          defaultBillingDetails: {
            name: '',
          },
        });

        if (initError) {
          setState({
            step: 'error',
            errorMessage: initError.message || 'Failed to initialize payment sheet',
          });
          return;
        }

        // Step 4: Present PaymentSheet
        setState({
          step: 'ready',
          paymentIntentId: intentRes.paymentIntentId,
          clientSecret: intentRes.clientSecret,
          amount: intentRes.amount,
          currency: intentRes.currency,
        });

        setState({ step: 'presenting' });
        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code === 'Canceled') {
            // User cancelled — go back to idle
            setState({ step: 'idle' });
          } else {
            setState({
              step: 'error',
              errorMessage: presentError.message || 'Payment failed',
            });
          }
          return;
        }

        // Success!
        setState({
          step: 'success',
          paymentIntentId: intentRes.paymentIntentId,
          amount: intentRes.amount,
          currency: intentRes.currency,
        });
      } catch (err) {
        setState({
          step: 'error',
          errorMessage: err instanceof Error ? err.message : 'Payment failed',
        });
      }
    },
    [initPaymentSheet, presentPaymentSheet],
  );

  const retry = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  return {
    ...state,
    isProcessing:
      state.step === 'loading_key' ||
      state.step === 'creating_intent' ||
      state.step === 'initializing_sheet' ||
      state.step === 'presenting',
    startPayment,
    reset,
    retry,
  };
}
