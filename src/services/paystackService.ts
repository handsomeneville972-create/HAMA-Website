/**
 * Paystack Payment Service
 *
 * Client-side service that communicates with the HAMA backend
 * to initialize and verify Paystack transactions.
 * The secret key is NEVER exposed on the client.
 */

import { CurrencyCode } from '../constants/types';

// Update this to your actual server URL
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3001' // Replace with your dev machine's local IP
  : 'https://api.hama.co.ke';

export interface PaystackInitRequest {
  email: string;
  amount: number;
  currency?: CurrencyCode;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResponse {
  success: boolean;
  reference?: string;
  authorizationUrl?: string;
  accessCode?: string;
  message?: string;
  error?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  verified?: boolean;
  reference?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paidAt?: string;
  channel?: string;
  error?: string;
}

/**
 * Initialize a Paystack transaction via the backend.
 * The backend handles the secret key — never exposed here.
 */
export async function initPaystackPayment(
  request: PaystackInitRequest
): Promise<PaystackInitResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/paystack/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to connect to payment server',
    };
  }
}

/**
 * Verify a Paystack transaction via the backend.
 */
export async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/paystack/verify/${encodeURIComponent(reference)}`
    );
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to verify payment',
    };
  }
}

/**
 * Check Paystack payment status from our records
 */
export async function getPaystackPaymentStatus(
  reference: string
): Promise<{ success: boolean; payment?: Record<string, unknown>; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/paystack/status/${encodeURIComponent(reference)}`
    );
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to check payment status',
    };
  }
}
