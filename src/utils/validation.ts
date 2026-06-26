/**
 * Password & Security Validation Utilities
 *
 * Enforces the HAMA password policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */

/** Password validation result */
export interface PasswordValidationResult {
  /** Whether the password meets all requirements */
  isValid: boolean;
  /** Human-readable error message */
  message: string;
  /** Individual requirement checks */
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validates a password against HAMA's security policy.
 */
export const validatePassword = (
  password: string,
  options?: { minLength?: number },
): PasswordValidationResult => {
  const minLength = options?.minLength ?? 8;

  const checks = {
    minLength: password.length >= minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const failures: string[] = [];

  if (!checks.minLength) {
    failures.push(`at least ${minLength} characters`);
  }
  if (!checks.hasUppercase) {
    failures.push('an uppercase letter');
  }
  if (!checks.hasLowercase) {
    failures.push('a lowercase letter');
  }
  if (!checks.hasNumber) {
    failures.push('a number');
  }
  if (!checks.hasSpecialChar) {
    failures.push('a special character (!@#$%^&* etc.)');
  }

  const isValid = failures.length === 0;

  return {
    isValid,
    message: isValid
      ? 'Password is strong.'
      : `Password must contain ${failures.join(', ')}.`,
    checks,
  };
};

/**
 * Returns a list of password requirement strings for UI display.
 */
export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', key: 'minLength' as const },
  { label: 'One uppercase letter', key: 'hasUppercase' as const },
  { label: 'One lowercase letter', key: 'hasLowercase' as const },
  { label: 'One number', key: 'hasNumber' as const },
  { label: 'One special character', key: 'hasSpecialChar' as const },
];

/**
 * Validates an email address format.
 */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Telephone number validation for Kenyan phone numbers.
 * Supports formats: +254XXXXXXXXX, 0XXXXXXXXX, 07XXXXXXXXX
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Kenyan phone number patterns
  const patterns = [
    /^\+254\d{9}$/,          // +254712345678
    /^0\d{9}$/,              // 0712345678
    /^07\d{8}$/,             // 071234567
  ];
  return patterns.some((p) => p.test(phone.replace(/\s/g, '')));
};

/**
 * Detects common suspicious patterns in input (potential injection, spam).
 */
export const hasSuspiciousContent = (value: string): boolean => {
  const suspicious = [
    /<script[^>]*>/i,
    /javascript\s*:/i,
    /on\w+\s*=/i,
    /data:\s*text\/html/i,
    /https?:\/\/[^\s]*(?:phishing|malware|hack|free-money)/i,
    /(?:buy|sell)\s+(?:followers|likes|views|reviews)/i,
  ];
  return suspicious.some((pattern) => pattern.test(value));
};

/**
 * Rate limiting helper — tracks attempts in memory.
 * Note: Real rate limiting should be server-side.
 * This is a client-side UX helper only.
 */
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  let attempts: number[] = [];

  const check = (): boolean => {
    const now = Date.now();
    // Remove old attempts outside the window
    attempts = attempts.filter((t) => now - t < windowMs);
    return attempts.length < maxAttempts;
  };

  const increment = (): void => {
    attempts.push(Date.now());
  };

  const reset = (): void => {
    attempts = [];
  };

  return { check, increment, reset };
};
