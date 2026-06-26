/**
 * Exchange Rate Service
 *
 * Fetches live exchange rates from Frankfurter API (free, no API key required).
 * Rates are cached in memory and updated on a configurable interval.
 * Falls back to hardcoded defaults from CURRENCIES if the API is unavailable.
 */
import { CURRENCIES, type CurrencyCode } from '../constants/types';

// ============================================================
// Configuration
// ============================================================

/** Frankfurter API endpoint for KES-base rates */
const FRANKFURTER_URL = 'https://api.frankfurter.dev/v2/rates?base=KES';

/** Which target currencies we care about (all except KSh itself) */
const TARGET_CODES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'UGX', 'TZS'];

/**
 * How often to refresh rates from the API (milliseconds).
 * Frankfurter rates update once per day, so fetching every 6 hours is plenty.
 */
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Minimum time between API calls to avoid hammering the free tier */
const MIN_FETCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// ============================================================
// Internal state
// ============================================================

/** Live rates keyed by CurrencyCode. Only populated for non-KSh codes. */
const _liveRates: Partial<Record<CurrencyCode, number>> = {};

/** Timestamp of the last successful API fetch (ms since epoch). */
let _lastFetchAt = 0;

/** Timestamp of the last fetch *attempt* (to enforce MIN_FETCH_INTERVAL). */
let _lastAttemptAt = 0;

/** Is a fetch currently in-flight? Prevents concurrent requests. */
let _isFetching = false;

// ============================================================
// Helpers
// ============================================================

/**
 * Get the effective rate for a currency code.
 * Returns the live rate if available, otherwise the hardcoded default.
 */
export function getRateToKSh(code: CurrencyCode): number {
  // KSh to KSh is always 1
  if (code === 'KSh') return 1;
  return _liveRates[code] ?? CURRENCIES[code]?.rateToKSh ?? 1;
}

/** Get the timestamp of the last successful fetch. */
export function getLastFetchAt(): number {
  return _lastFetchAt;
}

/** Check if live rates are currently loaded. */
export function hasLiveRates(): boolean {
  return Object.keys(_liveRates).length > 0;
}

// ============================================================
// Core fetch logic
// ============================================================

/**
 * Fetch the latest exchange rates from Frankfurter API.
 *
 * Frankfurter returns rates with KES as the base directly, e.g.:
 * { "amount": 1, "base": "KES", "date": "2024-06-22", "rates": { "USD": 0.0077, ... } }
 *
 * The API is free, no API key required, and updates daily.
 */
async function fetchRatesFromAPI(): Promise<void> {
  const now = Date.now();

  // Rate limiting: don't try again within the minimum interval
  if (now - _lastAttemptAt < MIN_FETCH_INTERVAL_MS) {
    return;
  }

  if (_isFetching) return;
  _isFetching = true;
  _lastAttemptAt = now;

  try {
    // Build URL with specific symbols to reduce response size
    const symbolParam = TARGET_CODES.join(',');
    const url = `${FRANKFURTER_URL}&symbols=${symbolParam}`;

    // AbortSignal.timeout is available in Hermes (RN ≥0.71).
    // Fall back to manual timeout for older engines.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ExchangeRates] API responded with ${response.status}`);
      return;
    }

    const data = await response.json();

    // Frankfurter response shape: { amount: 1, base: "KES", date: "...", rates: { USD: ..., EUR: ... } }
    if (!data.rates || typeof data.rates !== 'object') {
      console.warn('[ExchangeRates] Unexpected response shape', data);
      return;
    }

    const { rates } = data;

    // Update live rates map with the Frankfurter currency codes (uppercase 3-letter)
    let updatedCount = 0;
    for (const code of TARGET_CODES) {
      const raw = rates[code];
      if (typeof raw === 'number' && raw > 0) {
        _liveRates[code] = raw;
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      _lastFetchAt = Date.now();
      console.log(`[ExchangeRates] Updated ${updatedCount}/${TARGET_CODES.length} rates`);
    }
  } catch (error: any) {
    // Timeout / network errors are expected — silently degrade to defaults
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      console.warn('[ExchangeRates] Request timed out');
    } else {
      console.warn('[ExchangeRates] Fetch failed:', error?.message ?? error);
    }
  } finally {
    _isFetching = false;
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Refresh exchange rates from the Frankfurter API.
 *
 * - Respects minimum interval between API calls (prevents hammering).
 * - Skips if a fetch is already in-flight.
 * - Silently falls back to hardcoded defaults on failure.
 *
 * Call this on app startup and optionally on a timer.
 */
export async function refreshRates(): Promise<void> {
  await fetchRatesFromAPI();
}

/**
 * Start periodic rate refresh.
 * Returns a cleanup function to stop the interval.
 *
 * Typically called from a useEffect in the root layout.
 */
export function startPeriodicRefresh(): () => void {
  // Initial fetch (respects MIN_FETCH_INTERVAL)
  refreshRates();

  // Periodic refresh
  const intervalId = setInterval(refreshRates, REFRESH_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
