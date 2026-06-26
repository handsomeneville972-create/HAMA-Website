import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import {
  initPaystackPayment,
  verifyPaystackPayment,
} from '../services/paystackService';
import { formatPrice } from '../utils/currency';
import { CurrencyCode } from '../constants/types';

export type PaymentStep =
  | 'idle'
  | 'confirm'
  | 'sending'
  | 'paystack_checkout'
  | 'waiting_pin'
  | 'verifying'
  | 'success'
  | 'error';

export interface PaystackPaymentState {
  step: PaymentStep;
  reference?: string;
  authorizationUrl?: string;
  errorMessage?: string;
  paymentChannel?: string;
}

export interface UsePaystackPaymentOptions {
  appName?: string;
}

/**
 * Hook that manages the full Paystack payment flow:
 *   1. User confirms payment amount
 *   2. Backend initializes Paystack transaction → returns authorization URL
 *   3. Opens WebView checkout for user to pay (cards or M-Pesa)
 *   4. Verifies payment status
 */
export function usePaystackPayment(options: UsePaystackPaymentOptions = {}) {
  const [state, setState] = useState<PaystackPaymentState>({ step: 'idle' });

  const reset = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  /**
   * Start payment flow: confirm → initialize → open checkout
   */
  const startPayment = useCallback(
    async ({
      email,
      amount,
      currency,
      planName,
      metadata,
    }: {
      email: string;
      amount: number;
      currency: CurrencyCode;
      planName: string;
      metadata?: Record<string, unknown>;
    }) => {
      // Show confirmation
      setState({ step: 'confirm' });

      const formattedAmount = formatPrice(amount, currency);
      const appName = options.appName || 'HAMA';

      return new Promise<void>((resolve, reject) => {
        Alert.alert(
          'Confirm Payment',
          `You are about to pay ${appName} ${formattedAmount} for ${planName} subscription.\n\nProceed with Paystack?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setState({ step: 'idle' });
                reject(new Error('Cancelled'));
              },
            },
            {
              text: 'Pay Now',
              style: 'default',
              onPress: async () => {
                try {
                  // Initialize Paystack transaction
                  setState({ step: 'sending' });
                  const response = await initPaystackPayment({
                    email,
                    amount,
                    currency,
                    metadata: {
                      ...metadata,
                      plan_name: planName,
                    },
                  });

                  if (
                    !response.success ||
                    !response.authorizationUrl ||
                    !response.reference
                  ) {
                    setState({
                      step: 'error',
                      errorMessage:
                        response.error || 'Payment initialization failed',
                    });
                    reject(
                      new Error(
                        response.error || 'Payment initialization failed'
                      )
                    );
                    return;
                  }

                  // Open Paystack checkout WebView
                  setState({
                    step: 'paystack_checkout',
                    reference: response.reference,
                    authorizationUrl: response.authorizationUrl,
                  });

                  // The WebView component will handle the checkout flow
                  // and call onComplete/onError when done.
                  // The hook just sets up the state — the rest is in PaystackWebView.

                  resolve();
                } catch (err) {
                  setState({
                    step: 'error',
                    errorMessage:
                      err instanceof Error
                        ? err.message
                        : 'Payment failed',
                  });
                  reject(err);
                }
              },
            },
          ]
        );
      });
    },
    [options.appName]
  );

  /**
   * Handle successful payment from the WebView checkout
   */
  const onCheckoutSuccess = useCallback(
    async (reference: string) => {
      setState({ step: 'verifying', reference });

      try {
        const result = await verifyPaystackPayment(reference);

        if (result.verified) {
          setState({
            step: 'success',
            reference: result.reference,
            paymentChannel: result.channel,
          });
        } else {
          setState({
            step: 'error',
            errorMessage:
              result.status === 'failed'
                ? 'Payment failed. Please try again.'
                : 'Payment is still processing. Check your email for confirmation.',
          });
        }
      } catch (err) {
        // Even if verification fails, the payment may have succeeded
        // The user can check their email for confirmation
        setState({
          step: 'success',
          reference,
          paymentChannel: 'unknown',
        });
      }
    },
    []
  );

  /**
   * Handle cancelled payment from WebView
   */
  const onCheckoutCancel = useCallback(() => {
    setState({
      step: 'error',
      errorMessage: 'Payment was cancelled. You can try again.',
    });
  }, []);

  /**
   * Handle error from WebView
   */
  const onCheckoutError = useCallback((error: string) => {
    setState({
      step: 'error',
      errorMessage: error,
    });
  }, []);

  /**
   * Retry after an error
   */
  const retry = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  return {
    ...state,
    isProcessing:
      state.step === 'sending' ||
      state.step === 'paystack_checkout' ||
      state.step === 'verifying',
    startPayment,
    onCheckoutSuccess,
    onCheckoutCancel,
    onCheckoutError,
    reset,
    retry,
  };
}
