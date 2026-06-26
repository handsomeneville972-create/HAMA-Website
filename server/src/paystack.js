/**
 * Paystack Payment Service
 * 
 * Handles:
 * - Transaction initialization (returns authorization URL for checkout)
 * - Transaction verification (confirms payment status)
 * 
 * Paystack API: https://paystack.com/docs/api/transaction/
 */

const fetch = require('node-fetch');

const PAYSTACK_API = 'https://api.paystack.co';

/**
 * Generate a unique transaction reference
 */
function generateReference(prefix = 'HAMA') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

/**
 * Get Paystack secret key from environment
 */
function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }
  return key;
}

/**
 * Initialize a Paystack transaction
 * 
 * @param {Object} params
 * @param {string} params.email - Customer's email address
 * @param {number} params.amount - Amount in KSh (will be converted to kobo)
 * @param {string} [params.reference] - Unique transaction reference (auto-generated if omitted)
 * @param {string} [params.currency] - Currency code (default: KES)
 * @param {Object} [params.metadata] - Additional metadata to attach
 * @param {string} [params.callbackUrl] - URL to redirect after payment
 * @returns {Promise<{authorizationUrl: string, reference: string, accessCode: string}>}
 */
async function initializeTransaction({ email, amount, reference, currency, metadata, callbackUrl }) {
  const secretKey = getSecretKey();
  const ref = reference || generateReference();
  const cbUrl = callbackUrl || process.env.PAYSTACK_CALLBACK_URL || 'https://api.hama.co.ke/api/paystack/callback';

  const body = {
    email,
    amount: Math.round(amount * 100), // Convert to kobo/cents
    currency: currency || 'KES',
    reference: ref,
    callback_url: cbUrl,
    metadata: metadata || {},
  };

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(`Paystack initialize failed: ${data.message || JSON.stringify(data)}`);
  }

  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
    accessCode: data.data.access_code,
  };
}

/**
 * Verify a Paystack transaction
 * 
 * @param {string} reference - The transaction reference to verify
 * @returns {Promise<{verified: boolean, amount: number, currency: string, status: string, paidAt: string|null, customer: Object}>}
 */
async function verifyTransaction(reference) {
  const secretKey = getSecretKey();

  if (!reference) {
    throw new Error('Transaction reference is required');
  }

  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();

  if (!data.status) {
    return {
      verified: false,
      status: data.data?.status || 'unknown',
      message: data.message || 'Transaction verification failed',
    };
  }

  const tx = data.data;

  return {
    verified: tx.status === 'success',
    reference: tx.reference,
    amount: tx.amount / 100, // Convert from kobo back to KSh
    currency: tx.currency,
    status: tx.status,
    paidAt: tx.paid_at,
    channel: tx.channel,
    customer: tx.customer,
    metadata: tx.metadata,
    authorization: tx.authorization,
  };
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  generateReference,
};
