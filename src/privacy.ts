/**
 * Privacy & Data Masking Module
 *
 * Automatically detects and masks PII (Personally Identifiable Information)
 * in URLs, error messages, breadcrumbs, and user data before sending to the server.
 */

/**
 * Result of PII detection
 */
export interface PIIDetectionResult {
  /** Whether PII was detected */
  hasPII: boolean;
  /** Types of PII detected */
  types: string[];
  /** Number of occurrences found */
  count: number;
}

/**
 * Privacy configuration options
 */
export interface PrivacyConfig {
  /** Enable privacy masking (default: true) */
  enabled: boolean;
  /** URL parameters to always mask */
  sensitiveUrlParams?: string[];
  /** Masking strategy */
  maskingStrategy?: 'redact' | 'partial' | 'hash';
  /** Custom PII patterns to detect */
  customPIIPatterns?: Record<string, RegExp>;
  /** Fields to always mask in objects */
  sensitiveFields?: string[];
}

/**
 * Default privacy configuration
 */
export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  enabled: true,
  sensitiveUrlParams: [
    'password',
    'pwd',
    'pass',
    'secret',
    'token',
    'api_key',
    'apikey',
    'api-key',
    'auth',
    'authorization',
    'access_token',
    'refresh_token',
    'session',
    'sessionid',
    'session_id',
    'credit_card',
    'creditcard',
    'cc',
    'cvv',
    'ssn',
    'social_security',
    'email',
    'phone',
    'mobile',
  ],
  maskingStrategy: 'redact',
  sensitiveFields: [
    'password',
    'pwd',
    'pass',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'creditCard',
    'credit_card',
    'cardNumber',
    'card_number',
    'cvv',
    'cvc',
    'ssn',
    'socialSecurity',
    'social_security',
  ],
};

/**
 * Redaction placeholder
 */
const REDACTED = '[REDACTED]';

/**
 * Privacy Manager for PII detection and masking
 */
export class PrivacyManager {
  private config: PrivacyConfig;

  /** Built-in PII detection patterns */
  private patterns: Record<string, RegExp> = {
    // Email addresses
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

    // Credit card numbers (with optional separators)
    // Matches 13-19 digit sequences that pass basic format validation
    creditCard: /\b(?:\d[ -]*?){13,19}\b/g,

    // US Phone numbers (various formats)
    usPhone: /(?:\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,

    // Social Security Numbers (US)
    ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

    // API keys (common patterns)
    apiKey:
      /\b(?:sk|pk|api|key|token|secret|auth|bearer)[-_]?[a-zA-Z0-9]{20,}\b/gi,

    // IPv4 addresses
    ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

    // IPv6 addresses (simplified pattern)
    ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,

    // Bearer tokens in text
    bearerToken: /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,

    // JWT tokens
    jwt: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,

    // UUID (potential session/user IDs)
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  };

  constructor(config: Partial<PrivacyConfig> = {}) {
    this.config = { ...DEFAULT_PRIVACY_CONFIG, ...config };

    // Add custom patterns if provided
    if (config.customPIIPatterns) {
      this.patterns = { ...this.patterns, ...config.customPIIPatterns };
    }
  }

  /**
   * Scrub sensitive URL parameters
   *
   * @param url The URL to scrub
   * @returns URL with sensitive parameters masked
   */
  scrubUrl(url: string): string {
    if (!this.config.enabled || !url) return url;

    try {
      const urlObj = new URL(url, window.location.origin);
      const sensitiveParams = this.config.sensitiveUrlParams || [];
      let modified = false;

      // Scrub query parameters
      for (const param of sensitiveParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, REDACTED);
          modified = true;
        }
      }

      // Also check for PII in the URL path (like email in reset links)
      let pathname = urlObj.pathname;
      pathname = this.maskPII(pathname);

      if (pathname !== urlObj.pathname) {
        urlObj.pathname = pathname;
        modified = true;
      }

      // Scrub hash if it contains sensitive data
      if (urlObj.hash) {
        const scrubbedHash = this.maskPII(urlObj.hash);
        if (scrubbedHash !== urlObj.hash) {
          urlObj.hash = scrubbedHash;
          modified = true;
        }
      }

      return modified ? urlObj.href : url;
    } catch {
      // If URL parsing fails, try to scrub as plain text
      return this.maskPII(url);
    }
  }

  /**
   * Mask PII in a text string
   *
   * @param text The text to mask
   * @returns Text with PII masked according to the configured strategy
   */
  maskPII(text: string): string {
    if (!this.config.enabled || !text || typeof text !== 'string') return text;

    let result = text;

    for (const [, pattern] of Object.entries(this.patterns)) {
      result = result.replace(pattern, (match) => this.applyMaskingStrategy(match));
    }

    return result;
  }

  /**
   * Mask sensitive fields in an object
   *
   * @param obj The object to mask
   * @param additionalFields Additional field names to mask
   * @returns Object with sensitive fields masked
   */
  maskObject<T extends Record<string, unknown>>(
    obj: T,
    additionalFields: string[] = []
  ): T {
    if (!this.config.enabled || !obj || typeof obj !== 'object') return obj;

    const sensitiveFields = [
      ...(this.config.sensitiveFields || []),
      ...additionalFields,
    ];

    const mask = (value: unknown, key?: string): unknown => {
      if (value === null || value === undefined) return value;

      // Check if this key should be masked
      if (key && this.isSensitiveField(key, sensitiveFields)) {
        return REDACTED;
      }

      if (typeof value === 'string') {
        return this.maskPII(value);
      }

      if (Array.isArray(value)) {
        return value.map((item) => mask(item));
      }

      if (typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          result[k] = mask(v, k);
        }
        return result;
      }

      return value;
    };

    return mask(obj) as T;
  }

  /**
   * Detect PII in a text string
   *
   * @param text The text to analyze
   * @returns Detection result with types and count
   */
  detectPII(text: string): PIIDetectionResult {
    if (!text || typeof text !== 'string') {
      return { hasPII: false, types: [], count: 0 };
    }

    const types: string[] = [];
    let totalCount = 0;

    for (const [type, pattern] of Object.entries(this.patterns)) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        types.push(type);
        totalCount += matches.length;
      }
    }

    return {
      hasPII: types.length > 0,
      types,
      count: totalCount,
    };
  }

  /**
   * Validate if a string looks like a credit card number using Luhn algorithm
   *
   * @param number The number to validate
   * @returns True if it passes Luhn check
   */
  isValidCreditCard(number: string): boolean {
    // Remove spaces and dashes
    const digits = number.replace(/[\s-]/g, '');

    // Must be 13-19 digits
    if (!/^\d{13,19}$/.test(digits)) return false;

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Mask breadcrumb data
   *
   * @param breadcrumb The breadcrumb to mask
   * @returns Masked breadcrumb
   */
  maskBreadcrumb<T extends { message?: string; data?: Record<string, unknown> }>(
    breadcrumb: T
  ): T {
    if (!this.config.enabled) return breadcrumb;

    const result = { ...breadcrumb };

    if (result.message) {
      result.message = this.maskPII(result.message);
    }

    if (result.data) {
      result.data = this.maskObject(result.data);
    }

    return result;
  }

  /**
   * Mask error message and stack trace
   *
   * @param message Error message
   * @param stack Stack trace
   * @returns Masked error data
   */
  maskError(message: string, stack?: string): { message: string; stack?: string } {
    return {
      message: this.maskPII(message),
      stack: stack ? this.maskPII(stack) : undefined,
    };
  }

  /**
   * Check if tracing is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PrivacyConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.customPIIPatterns) {
      this.patterns = { ...this.patterns, ...config.customPIIPatterns };
    }
  }

  /**
   * Add a custom PII pattern
   */
  addPattern(name: string, pattern: RegExp): void {
    this.patterns[name] = pattern;
  }

  /**
   * Remove a PII pattern
   */
  removePattern(name: string): void {
    delete this.patterns[name];
  }

  /**
   * Apply the configured masking strategy
   */
  private applyMaskingStrategy(match: string): string {
    switch (this.config.maskingStrategy) {
      case 'partial':
        // Show first and last characters, mask the middle
        if (match.length <= 4) return REDACTED;
        return `${match[0]}${'*'.repeat(match.length - 2)}${match[match.length - 1]}`;

      case 'hash':
        // Return a hash representation (simple hash for client-side)
        return `[HASH:${this.simpleHash(match)}]`;

      case 'redact':
      default:
        return REDACTED;
    }
  }

  /**
   * Check if a field name is sensitive
   */
  private isSensitiveField(fieldName: string, sensitiveFields: string[]): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return sensitiveFields.some(
      (sensitive) =>
        lowerFieldName === sensitive.toLowerCase() ||
        lowerFieldName.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Simple hash function for client-side use
   * Not cryptographically secure, just for obfuscation
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }
}
