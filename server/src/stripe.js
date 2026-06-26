/**
 * Stripe Payment Service
 *
 * Handles:
 * - Creating PaymentIntents for checkout
 * - Retrieving / verifying PaymentIntent status
 *
 * STRIPE_SECRET_KEY stays server-side — NEVER exposed to the client.
 * STRIPE_PUBLISHABLE_KEY is safe for frontend but proxied through
 * the server for consistency with the rest of HAMA's architecture.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a PaymentIntent for a subscription purchase.
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in KSh (converted to cents)
 * @param {string} params.currency - Currency code (e.g., 'kes', 'usd', 'eur')
 * @param {string} params.description - What the payment is for
 * @param {Object} [params.metadata] - Additional metadata (plan info, user info)
 * @returns {Promise<{clientSecret: string, paymentIntentId: string, amount: number, currency: string}>}
 */
async function createPaymentIntent({ amount, currency, description, metadata }) {
  if (!amount || amount < 1) {
    throw new Error('Amount must be at least 1');
  }

  // Stripe uses cents (smallest currency unit)
  // KSh uses the same decimal as USD (100 cents = 1 unit)
  const unitAmount = Math.round(amount * 100);

  // Map custom app currency codes to Stripe ISO 4217 codes
  const currencyMap = {
    'KSH': 'kes',
    'KSh': 'kes',
    'KES': 'kes',
    'UGX': 'ugx',
    'TZS': 'tzs',
    'USD': 'usd',
    'EUR': 'eur',
    'GBP': 'gbp',
  };
  const normalizedCurrency = (currencyMap[(currency || 'KES').toUpperCase()] || 'kes').toLowerCase();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: unitAmount,
    currency: normalizedCurrency,
    description: description || 'HAMA Subscription',
    metadata: {
      app_name: 'HAMA',
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: paymentIntent.status,
  };
}

/**
 * Retrieve a PaymentIntent by ID.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<Object>} PaymentIntent details
 */
async function retrievePaymentIntent(paymentIntentId) {
  if (!paymentIntentId) {
    throw new Error('PaymentIntent ID is required');
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
    description: paymentIntent.description,
    metadata: paymentIntent.metadata,
    created: new Date(paymentIntent.created * 1000).toISOString(),
  };
}

/**
 * Get the Stripe publishable key (safe for frontend).
 * We proxy it through the server so the client never needs
 * to store any keys.
 */
function getPublishableKey() {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('STRIPE_PUBLISHABLE_KEY is not configured');
  }
  return key;
}

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  getPublishableKey,
};
