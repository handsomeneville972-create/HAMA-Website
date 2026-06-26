/**
 * Unit tests for server/src/paystack.js
 *
 * Tests cover:
 *   - generateReference() — format, prefix, uniqueness
 *   - getSecretKey() — env var read, missing key error
 *   - initializeTransaction() — success, error, amount conversion, header correctness
 *   - verifyTransaction() — success, failure, missing reference, kobo conversion
 *
 * All network calls to Paystack API are mocked via Jest.
 */

// Use auto-mock pattern: jest.mock is hoisted, so require() gets the mocked version.
// For node-fetch v2 (module.exports = fetch), auto-mock creates a mock function.
jest.mock('node-fetch');
const mockFetch = require('node-fetch');

// ---- Module under test ----
const {
  generateReference,
  initializeTransaction,
  verifyTransaction,
} = require('../src/paystack');

// ---- Helpers ----

/** Convenience: build a fake Paystack API success response for initialize */
function fakeInitSuccess(overrides = {}) {
  return {
    status: true,
    message: 'Authorization URL created',
    data: {
      authorization_url: 'https://checkout.paystack.com/abc123',
      access_code: 'abc123',
      reference: 'HAMA-TEST001',
      ...overrides,
    },
  };
}

/** Convenience: build a fake Paystack API success response for verify */
function fakeVerifySuccess(status = 'success', overrides = {}) {
  return {
    status: true,
    message: 'Verification successful',
    data: {
      id: 12345678,
      status,
      reference: 'HAMA-TEST001',
      amount: 29900, // 299 KSh in kobo
      currency: 'KES',
      paid_at: '2024-06-15T10:30:00.000Z',
      channel: 'ussd',
      customer: {
        id: 98765,
        email: 'james@example.com',
      },
      authorization: {
        authorization_code: 'AUTH_abc123',
        bin: '424242',
        last4: '4242',
        exp_month: '12',
        exp_year: '2027',
        card_type: 'visa',
      },
      ...overrides,
    },
  };
}

/** Convenience: build a fake Paystack API error response */
function fakeApiError(message = 'An error occurred') {
  return {
    status: false,
    message,
  };
}

beforeEach(() => {
  // Reset call history and implementation before each test
  mockFetch.mockReset();
  // Set a default secret key so getSecretKey() doesn't throw by default
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_abc123';
  process.env.PAYSTACK_CALLBACK_URL = 'https://api.hama.co.ke/api/paystack/callback';
});

afterAll(() => {
  delete process.env.PAYSTACK_SECRET_KEY;
  delete process.env.PAYSTACK_CALLBACK_URL;
});

// ======================================================
// generateReference
// ======================================================

describe('generateReference()', () => {
  test('returns a string', () => {
    const ref = generateReference();
    expect(typeof ref).toBe('string');
  });

  test('defaults to HAMA prefix', () => {
    const ref = generateReference();
    expect(ref).toMatch(/^HAMA-/);
  });

  test('accepts a custom prefix', () => {
    const ref = generateReference('SUB');
    expect(ref).toMatch(/^SUB-/);
  });

  test('contains a timestamp portion in uppercase base36', () => {
    const ref = generateReference();
    // Expect format: PREFIX-XXXXXXYYYY (uppercase alphanumeric after hyphen)
    const suffix = ref.split('-')[1];
    expect(suffix).toMatch(/^[0-9A-Z]+$/);
    expect(suffix.length).toBeGreaterThanOrEqual(6);
  });

  test('generates unique references on successive calls', () => {
    const refs = new Set();
    for (let i = 0; i < 100; i++) {
      refs.add(generateReference());
    }
    // All 100 generated references must be unique
    expect(refs.size).toBe(100);
  });
});

// ======================================================
// getSecretKey (internal, but tested indirectly)
// ======================================================

describe('getSecretKey() (via initializeTransaction)', () => {
  test('throws when PAYSTACK_SECRET_KEY is not set', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    await expect(
      initializeTransaction({ email: 'test@test.com', amount: 100 })
    ).rejects.toThrow('PAYSTACK_SECRET_KEY is not configured');
  });

  test('succeeds when PAYSTACK_SECRET_KEY is set', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });
    const result = await initializeTransaction({
      email: 'test@test.com',
      amount: 299,
    });
    expect(result.reference).toBeDefined();
  });
});

// ======================================================
// initializeTransaction
// ======================================================

describe('initializeTransaction()', () => {
  const validParams = {
    email: 'james@example.com',
    amount: 299,
    currency: 'KES',
    reference: 'HAMA-UNITTEST',
    metadata: { plan_name: 'Premium - seeker' },
  };

  test('sends POST request to correct Paystack endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    await initializeTransaction(validParams);

    const callUrl = mockFetch.mock.calls[0][0];
    const callOptions = mockFetch.mock.calls[0][1];

    expect(callUrl).toBe('https://api.paystack.co/transaction/initialize');
    expect(callOptions.method).toBe('POST');
  });

  test('includes correct Authorization header with Bearer token', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_specialkey';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    await initializeTransaction(validParams);

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer sk_test_specialkey');
    expect(headers['Content-Type']).toBe('application/json');
  });

  test('converts amount to kobo (multiplies by 100)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    await initializeTransaction({ ...validParams, amount: 299 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.amount).toBe(29900); // 299 * 100
  });

  test('rounds fractional amounts correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    await initializeTransaction({ ...validParams, amount: 299.5 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.amount).toBe(29950); // 299.5 * 100
  });

  test('includes all required fields in request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    await initializeTransaction(validParams);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.email).toBe('james@example.com');
    expect(body.currency).toBe('KES');
    expect(body.reference).toBe('HAMA-UNITTEST');
    expect(body.callback_url).toBeDefined();
    expect(body.metadata).toEqual({ plan_name: 'Premium - seeker' });
  });

  test('defaults currency to KES when not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    await initializeTransaction({ email: 'test@test.com', amount: 100 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.currency).toBe('KES');
  });

  test('uses provided reference or auto-generates one', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess({ reference: 'HAMA-CUSTOM001' }),
    });

    const result = await initializeTransaction({
      email: 'test@test.com',
      amount: 100,
      reference: 'HAMA-CUSTOM001',
    });

    // Our mock returns the reference we gave it
    expect(result.reference).toBe('HAMA-CUSTOM001');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reference).toBe('HAMA-CUSTOM001');
  });

  test('auto-generates reference when not provided', async () => {
    const fakeRef = 'HAMA-AUTO123';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess({ reference: fakeRef }),
    });

    const result = await initializeTransaction({
      email: 'test@test.com',
      amount: 100,
    });

    expect(result.reference).toBe(fakeRef);
  });

  test('uses provided callback URL or falls back to env var', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    const customCb = 'https://myapp.com/paystack/callback';
    await initializeTransaction({ ...validParams, callbackUrl: customCb });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.callback_url).toBe(customCb);
  });

  test('falls back to PAYSTACK_CALLBACK_URL env var when no callbackUrl given', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeInitSuccess(),
    });

    await initializeTransaction({
      email: 'test@test.com',
      amount: 100,
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.callback_url).toBe('https://api.hama.co.ke/api/paystack/callback');
  });

  test('returns authorizationUrl, reference and accessCode on success', async () => {
    const apiResponse = {
      status: true,
      message: 'Authorization URL created',
      data: {
        authorization_url: 'https://checkout.paystack.com/abc123',
        access_code: 'abc123',
        reference: 'HAMA-SUCCESS',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    });

    const result = await initializeTransaction(validParams);

    expect(result).toEqual({
      authorizationUrl: 'https://checkout.paystack.com/abc123',
      reference: 'HAMA-SUCCESS',
      accessCode: 'abc123',
    });
  });

  test('throws when Paystack API returns failure status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeApiError('Invalid amount'),
    });

    await expect(
      initializeTransaction(validParams)
    ).rejects.toThrow('Paystack initialize failed: Invalid amount');
  });

  test('throws with full JSON when no error message is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: false }),
    });

    await expect(
      initializeTransaction(validParams)
    ).rejects.toThrow('Paystack initialize failed');
  });
});

// ======================================================
// verifyTransaction
// ======================================================

describe('verifyTransaction()', () => {
  test('throws when reference is empty', async () => {
    await expect(verifyTransaction('')).rejects.toThrow(
      'Transaction reference is required'
    );
  });

  test('throws when reference is null', async () => {
    await expect(verifyTransaction(null)).rejects.toThrow(
      'Transaction reference is required'
    );
  });

  test('makes GET request to correct endpoint with reference', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess(),
    });

    await verifyTransaction('HAMA-VERIFY001');

    const callUrl = mockFetch.mock.calls[0][0];
    const callOptions = mockFetch.mock.calls[0][1];

    expect(callUrl).toBe(
      'https://api.paystack.co/transaction/verify/HAMA-VERIFY001'
    );
    expect(callOptions.method).toBe('GET');
  });

  test('encodes special characters in reference URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess(),
    });

    await verifyTransaction('HAMA+REF/1');

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe(
      'https://api.paystack.co/transaction/verify/HAMA%2BREF%2F1'
    );
  });

  test('includes correct Authorization header', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_secret123';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess(),
    });

    await verifyTransaction('HAMA-TEST');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer sk_test_secret123');
  });

  test('returns verified=true when status is "success"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess('success'),
    });

    const result = await verifyTransaction('HAMA-SUCCESS');

    expect(result.verified).toBe(true);
    expect(result.status).toBe('success');
  });

  test('returns verified=false when status is "failed"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess('failed'),
    });

    const result = await verifyTransaction('HAMA-FAILED');

    expect(result.verified).toBe(false);
    expect(result.status).toBe('failed');
  });

  test('returns verified=false when status is "pending"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess('pending'),
    });

    const result = await verifyTransaction('HAMA-PENDING');

    expect(result.verified).toBe(false);
    expect(result.status).toBe('pending');
  });

  test('returns verified=false when API call status is false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeApiError('Transaction reference not found'),
    });

    const result = await verifyTransaction('HAMA-INVALID');

    expect(result.verified).toBe(false);
    expect(result.status).toBe('unknown');
    expect(result.message).toBe('Transaction reference not found');
  });

  test('falls back to "unknown" status when data is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: false }),
    });

    const result = await verifyTransaction('HAMA-NODATA');

    expect(result.verified).toBe(false);
    expect(result.status).toBe('unknown');
  });

  test('converts amount from kobo to KSh (divides by 100)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess('success', { amount: 29900 }),
    });

    const result = await verifyTransaction('HAMA-CONVERT');

    expect(result.amount).toBe(299); // 29900 / 100
  });

  test('handles zero amount correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeVerifySuccess('success', { amount: 0 }),
    });

    const result = await verifyTransaction('HAMA-ZERO');

    expect(result.amount).toBe(0);
  });

  test('returns all expected fields on successful verification', async () => {
    const apiResponse = {
      status: true,
      message: 'Verification successful',
      data: {
        id: 87654321,
        status: 'success',
        reference: 'HAMA-FULL',
        amount: 69900,
        currency: 'KES',
        paid_at: '2024-06-20T14:00:00.000Z',
        channel: 'card',
        customer: {
          id: 12345,
          email: 'faith@example.com',
          customer_code: 'CUS_abc123',
        },
        authorization: {
          authorization_code: 'AUTH_xyz789',
          card_type: 'mastercard',
          last4: '8888',
          exp_month: '08',
          exp_year: '2026',
          bin: '512345',
        },
        metadata: { plan_name: 'Pro - landlord' },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    });

    const result = await verifyTransaction('HAMA-FULL');

    expect(result).toEqual({
      verified: true,
      reference: 'HAMA-FULL',
      amount: 699, // 69900 / 100
      currency: 'KES',
      status: 'success',
      paidAt: '2024-06-20T14:00:00.000Z',
      channel: 'card',
      customer: {
        id: 12345,
        email: 'faith@example.com',
        customer_code: 'CUS_abc123',
      },
      authorization: {
        authorization_code: 'AUTH_xyz789',
        card_type: 'mastercard',
        last4: '8888',
        exp_month: '08',
        exp_year: '2026',
        bin: '512345',
      },
      metadata: { plan_name: 'Pro - landlord' },
    });
  });
});
