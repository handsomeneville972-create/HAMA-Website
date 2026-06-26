/**
 * Stripe Payment Service
 *
 * Client-side service that communicates with the HAMA backend
 * to create and verify Stripe PaymentIntents.
 * The secret key is NEVER exposed on the client —
 * even the publishable key comes from the server.
 */

export interface StripePaymentRequest {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface StripePaymentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
}

export interface StripePublishableKeyResponse {
  success: boolean;
  publishableKey?: string;
  error?: string;
}

export interface StripePaymentIntentResponse {
  success: boolean;
  paymentIntent?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    clientSecret?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    created: string;
  };
  error?: string;
}

// Backend server URL — same as other payment services
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3001'
  : 'https://api.hama.co.ke';

/**
 * Get the Stripe publishable key from the server.
 * This keeps all configuration centralized on the backend.
 */
export async function getStripePublishableKey(): Promise<StripePublishableKeyResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stripe/publishable-key`);
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get publishable key',
    };
  }
}

/**
 * Create a PaymentIntent via the backend.
 * The backend uses the secret key — never exposed here.
 */
export async function createStripePaymentIntent(
  request: StripePaymentRequest,
): Promise<StripePaymentResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stripe/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create payment',
    };
  }
}

/**
 * Retrieve a PaymentIntent status from the server.
 */
export async function getStripePaymentIntent(
  paymentIntentId: string,
): Promise<StripePaymentIntentResponse> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/stripe/payment-intent/${encodeURIComponent(paymentIntentId)}`,
    );
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve payment',
    };
  }
}
