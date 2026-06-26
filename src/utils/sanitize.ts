/**
 * Sanitize user input to defend against:
 * - SQL injection (pattern-based blocking)
 * - XSS (cross-site scripting) via script/iframe/event injection
 * - Control character injection (null bytes, escape sequences)
 *
 * This is defense-in-depth for the frontend. Backend must still use
 * parameterized queries and proper server-side validation.
 *
 * NOTE: Password inputs should use `sanitizeInput` with `{ stripSql: false }`
 * to avoid corrupting passwords that contain SQL-like patterns (e.g. "Select123!").
 */

/** Known SQL injection patterns */
const SQL_PATTERNS = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|--|;.*--)/i;

/** Known XSS patterns (tags, event handlers, javascript:) */
const XSS_PATTERNS = /<script[^>]*>|<\/script>|<iframe[^>]*>|<\/iframe>|on\w+\s*=|javascript\s*:|data\s*:\s*text\/html/i;

/** Control characters (null byte, backspace, escape, etc.) */
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Maximum safe input length */
export const MAX_INPUT_LENGTH = 500;

/**
 * Remove control characters that could be used for injection or encoding attacks.
 */
export const stripControlChars = (value: string): string =>
  value.replace(CONTROL_CHARS, '');

/**
 * Detect and block SQL injection patterns.
 * Returns true if dangerous SQL patterns are found.
 */
export const hasSqlInjection = (value: string): boolean =>
  SQL_PATTERNS.test(value);

/**
 * Detect and block XSS patterns.
 * Returns true if dangerous XSS patterns are found.
 */
export const hasXss = (value: string): boolean =>
  XSS_PATTERNS.test(value);

/**
 * Escape HTML special characters to neutralise XSS in rendered content.
 * Safe for use in React Native Text components (defense-in-depth).
 */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

/**
 * Fully sanitize a single input value:
 * 1. Strip control characters
 * 2. Optionally trim whitespace (default true; set false for passwords)
 * 3. Enforce max length
 * 4. Optionally strip dangerous SQL injection patterns (default true; set false for passwords)
 * 5. Strip dangerous XSS patterns (defense-in-depth)
 *
 * Returns the cleaned, safe string.
 */
export const sanitizeInput = (
  value: string,
  maxLength: number = MAX_INPUT_LENGTH,
  options?: { trim?: boolean; stripSql?: boolean },
): string => {
  // Step 1: Strip control characters
  let sanitized = stripControlChars(value);

  // Step 2: Trim (do NOT trim passwords — spaces are valid password chars)
  if (options?.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Step 3: Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Step 4: Optionally strip dangerous SQL injection patterns
  // SKIP for passwords to avoid corrupting them (passwords go to Supabase Auth, not SQL)
  if (options?.stripSql !== false) {
    sanitized = sanitized.replace(SQL_PATTERNS, '');
  }

  // Step 5: Strip dangerous XSS patterns
  sanitized = sanitized.replace(XSS_PATTERNS, '');

  return sanitized;
};

/**
 * Light sanitize for search/display fields that shouldn't reject input
 * but should still strip control characters and enforce length.
 * Returns only the safe string (control chars removed, truncated).
 */
export const softSanitize = (value: string, maxLength: number = MAX_INPUT_LENGTH): string => {
  let cleaned = stripControlChars(value);
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
};
