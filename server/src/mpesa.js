/**
 * M-Pesa Daraja API Service
 * 
 * Handles:
 * - OAuth token generation
 * - STK Push (simulate) initiation
 * - Callback verification & processing
 */

const fetch = require('node-fetch');

// Sandbox vs Production URLs
const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

/**
 * Generate OAuth token from consumer key/secret
 */
async function getOAuthToken(env = 'sandbox') {
  const baseUrl = BASE_URLS[env];
  const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get OAuth token: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Generate the STK Push password
 * Password = Base64(BusinessShortCode + PassKey + Timestamp)
 */
function generatePassword(shortCode, passKey, timestamp) {
  const str = shortCode + passKey + timestamp;
  return Buffer.from(str).toString('base64');
}

/**
 * Generate timestamp in format YYYYMMDDHHmmss
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Initiate STK Push (M-Pesa prompt to user's phone)
 * 
 * @param {Object} params
 * @param {string} params.phoneNumber - Customer phone in 2547XXXXXXXX format
 * @param {number} params.amount - Amount to charge
 * @param {string} params.accountReference - What this payment is for (e.g., "SUB-001")
 * @param {string} params.transactionDesc - Description shown to user
 * @returns {Promise<Object>} Daraja API response with CheckoutRequestID
 */
async function stkPush({ phoneNumber, amount, accountReference, transactionDesc }) {
  const env = process.env.MPESA_ENV || 'sandbox';
  const baseUrl = BASE_URLS[env];
  const shortCode = process.env.MPESA_SHORTCODE;
  const passKey = process.env.MPESA_PASSKEY;
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerBuyGoodsOnline';
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  const appName = process.env.APP_NAME || 'HAMA';

  if (!shortCode || !passKey) {
    throw new Error('MPESA_SHORTCODE and MPESA_PASSKEY are required');
  }

  const token = await getOAuthToken(env);
  const timestamp = generateTimestamp();
  const password = generatePassword(shortCode, passKey, timestamp);

  const body = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: transactionType,
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: shortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference || `${appName}-${Date.now()}`,
    TransactionDesc: transactionDesc || `${appName} Payment`,
  };

  const res = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`STK Push failed: ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Verify and process the STK Push callback from Safaricom
 * 
 * @param {Object} callbackData - The JSON body from Safaricom's callback
 * @returns {Object} Processed payment result
 */
function processCallback(callbackData) {
  try {
    const { Body } = callbackData;
    if (!Body || !Body.stkCallback) {
      throw new Error('Invalid callback structure');
    }

    const { stkCallback } = Body;
    const { ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const result = {
      checkoutRequestId: stkCallback.CheckoutRequestID,
      merchantRequestId: stkCallback.MerchantRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      success: ResultCode === 0,
    };

    // Extract metadata items if available
    if (CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        result[item.Name] = item.Value;
      }
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message,
      rawData: callbackData,
    };
  }
}

/**
 * Query the status of an STK Push transaction
 */
async function queryStatus(checkoutRequestId, env = 'sandbox') {
  const baseUrl = BASE_URLS[env];
  const shortCode = process.env.MPESA_SHORTCODE;
  const passKey = process.env.MPESA_PASSKEY;

  const token = await getOAuthToken(env);
  const timestamp = generateTimestamp();
  const password = generatePassword(shortCode, passKey, timestamp);

  const body = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return await res.json();
}

module.exports = {
  stkPush,
  processCallback,
  queryStatus,
};
