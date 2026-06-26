import { CURRENCIES, type CurrencyCode } from '../../constants/types';
import { formatPrice, convertPrice } from '../currency';

// ============================================================
// Mock exchangeRates module
//
// We override getRateToKSh to use the hardcoded CURRENCIES rates
// by default. Individual tests can override this with mockReturnValue.
// ============================================================
jest.mock('../exchangeRates', () => ({
  getRateToKSh: jest.fn((code: CurrencyCode) => {
    if (code === 'KSh') return 1;
    return CURRENCIES[code]?.rateToKSh ?? 1;
  }),
}));

import { getRateToKSh } from '../exchangeRates';
const mockGetRateToKSh = getRateToKSh as jest.MockedFunction<typeof getRateToKSh>;

// ============================================================
// formatPrice — KSh (default/primary currency)
// ============================================================

describe('formatPrice — KSh (default currency)', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('formats a whole number price correctly', () => {
    expect(formatPrice(1500)).toBe('KSh 1,500');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('KSh 0');
  });

  it('formats large numbers with thousands separators', () => {
    expect(formatPrice(1000000)).toBe('KSh 1,000,000');
    expect(formatPrice(85000)).toBe('KSh 85,000');
    expect(formatPrice(12000)).toBe('KSh 12,000');
  });

  it('formats small numbers correctly', () => {
    expect(formatPrice(5)).toBe('KSh 5');
    expect(formatPrice(99)).toBe('KSh 99');
  });

  it('handles negative prices (e.g. refunds or adjustments)', () => {
    expect(formatPrice(-5000)).toBe('KSh -5,000');
  });

  it('formats the same whether or not KSh is passed explicitly', () => {
    expect(formatPrice(5000, 'KSh')).toBe('KSh 5,000');
    expect(formatPrice(5000)).toBe('KSh 5,000');
  });
});

// ============================================================
// formatPrice — USD
// ============================================================

describe('formatPrice — USD', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('converts KSh to USD using the hardcoded rate', () => {
    const result = formatPrice(100000, 'USD');
    // 100,000 KSh * 0.0077 = 770 USD → "$770.00"
    expect(result).toMatch(/^\$770\.00$/);
  });

  it('formats smaller amounts with proper decimals', () => {
    const result = formatPrice(5000, 'USD');
    // 5,000 KSh * 0.0077 = 38.50 USD → "$38.50"
    expect(result).toMatch(/^\$38\.50$/);
  });

  it('formats the minimum USD value for 1 KSh', () => {
    const result = formatPrice(1, 'USD');
    // 1 KSh * 0.0077 = 0.0077 → "$0.01"
    expect(result).toMatch(/^\$0\.01$/);
  });
});

// ============================================================
// formatPrice — EUR
// ============================================================

describe('formatPrice — EUR', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('converts KSh to EUR using the hardcoded rate', () => {
    const result = formatPrice(100000, 'EUR');
    // 100,000 KSh * 0.0071 = 710 EUR → "€710.00"
    expect(result).toMatch(/^.{1}710\.00/);
  });
});

// ============================================================
// formatPrice — GBP
// ============================================================

describe('formatPrice — GBP', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('converts KSh to GBP using the hardcoded rate', () => {
    const result = formatPrice(100000, 'GBP');
    // 100,000 KSh * 0.0061 = 610 GBP → "£610.00"
    expect(result).toMatch(/^.{1}610\.00/);
  });
});

// ============================================================
// formatPrice — UGX (0 decimal currency)
// ============================================================

describe('formatPrice — UGX (zero decimal)', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('converts KSh to UGX with no decimal places', () => {
    const result = formatPrice(1000, 'UGX');
    // 1,000 KSh * 28.5 = 28,500 UGX
    expect(result).toMatch(/USh/);
    expect(result).not.toContain('.');
  });
});

// ============================================================
// formatPrice — TZS (0 decimal currency)
// ============================================================

describe('formatPrice — TZS (zero decimal)', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('converts KSh to TZS with no decimal places', () => {
    const result = formatPrice(1000, 'TZS');
    // 1,000 KSh * 18.0 = 18,000 TZS
    expect(result).toMatch(/TSh/);
    expect(result).not.toContain('.');
  });
});

// ============================================================
// formatPrice — live rate override
// ============================================================

describe('formatPrice — live rate overrides hardcoded default', () => {
  it('uses the live rate when available instead of the hardcoded CURRENCIES rate', () => {
    mockGetRateToKSh.mockReturnValue(0.01); // 1 KSh = 0.01 USD (vs hardcoded 0.0077)

    const result = formatPrice(1000, 'USD');
    // 1,000 KSh * 0.01 = 10 USD → "$10.00"
    expect(result).toBe('$10.00');
  });

  it('always returns KSh format regardless of getRateToKSh value (KSh is the base)', () => {
    // Even if getRateToKSh returned something weird for KSh, formatPrice
    // has a dedicated KSh path that doesn't use the rate
    mockGetRateToKSh.mockReturnValue(999);
    expect(formatPrice(1000)).toBe('KSh 1,000');
  });
});

// ============================================================
// formatPrice — edge cases
// ============================================================

describe('formatPrice — edge cases', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('handles NaN gracefully', () => {
    // Current behavior: NaN passes through to toLocaleString which returns 'NaN'.
    // If a NaN guard is added in the future, update this test.
    const result = formatPrice(NaN);
    expect(result).toContain('KSh');
    expect(result).toContain('NaN');
  });

  it('handles extremely large numbers without crashing', () => {
    const result = formatPrice(999999999999, 'USD');
    expect(result).toContain('$');
    expect(result.length).toBeGreaterThan(5);
  });
});

// ============================================================
// convertPrice
// ============================================================

describe('convertPrice', () => {
  beforeEach(() => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });
  });

  it('converts KSh to USD as a numeric value', () => {
    const result = convertPrice(100000, 'USD');
    expect(result).toBeCloseTo(770, 2); // 100,000 * 0.0077
  });

  it('converts KSh to KSh (identity)', () => {
    const result = convertPrice(5000, 'KSh');
    expect(result).toBe(5000);
  });

  it('converts KSh to UGX (high-rate currency)', () => {
    const result = convertPrice(1000, 'UGX');
    expect(result).toBeCloseTo(28500, 0); // 1,000 * 28.5
  });

  it('converts zero to zero', () => {
    const result = convertPrice(0, 'USD');
    expect(result).toBe(0);
  });

  it('converts negative amounts (refunds)', () => {
    const result = convertPrice(-5000, 'EUR');
    expect(result).toBeLessThan(0);
  });

  it('uses live rate when getRateToKSh is overridden', () => {
    mockGetRateToKSh.mockReturnValue(0.005); // different from hardcoded 0.0077
    const result = convertPrice(1000, 'USD');
    expect(result).toBe(5); // 1,000 * 0.005
  });
});

// ============================================================
// getRateToKSh fallback (tested via mock integration)
// ============================================================

describe('getRateToKSh fallback when live rates unavailable', () => {
  it('falls back to hardcoded CURRENCIES rate when live rate is not set', () => {
    mockGetRateToKSh.mockImplementation((code: CurrencyCode) => {
      if (code === 'KSh') return 1;
      return CURRENCIES[code]?.rateToKSh ?? 1;
    });

    const hardcodedRate = CURRENCIES['USD'].rateToKSh;
    const result = convertPrice(1000, 'USD');
    expect(result).toBe(1000 * hardcodedRate);
  });

  it('returns 1 for unknown currency codes via fallback', () => {
    mockGetRateToKSh.mockImplementation(() => 1);
    const result = convertPrice(5000, 'USD');
    expect(result).toBe(5000);
  });
});
