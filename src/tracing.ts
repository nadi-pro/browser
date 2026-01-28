/**
 * Distributed Tracing Module
 *
 * Implements W3C Trace Context propagation for correlating frontend RUM data
 * with backend traces.
 *
 * @see https://www.w3.org/TR/trace-context/
 */

/**
 * Trace context object following W3C Trace Context spec
 */
export interface TraceContext {
  /** 32 hex character trace ID */
  traceId: string;
  /** 16 hex character parent span ID */
  spanId: string;
  /** Whether the trace is sampled */
  sampled: boolean;
  /** Trace state (vendor-specific key-value pairs) */
  traceState?: string;
}

/**
 * Tracing configuration options
 */
export interface TracingConfig {
  /** Enable distributed tracing (default: false) */
  enabled: boolean;
  /** URLs/patterns to propagate trace headers to */
  propagateTraceUrls?: (string | RegExp)[];
  /** Include trace context in all RUM payloads */
  includeInPayloads?: boolean;
  /** Custom trace state to include */
  traceState?: string;
}

/**
 * Default tracing configuration
 */
export const DEFAULT_TRACING_CONFIG: TracingConfig = {
  enabled: false,
  propagateTraceUrls: [],
  includeInPayloads: true,
};

/**
 * Tracing Manager for W3C Trace Context
 *
 * Generates and manages trace context for distributed tracing.
 * Provides methods to create traceparent headers and determine
 * which requests should receive trace propagation.
 */
export class TracingManager {
  private traceId: string;
  private spanId: string;
  private sampled: boolean;
  private traceState?: string;
  private config: TracingConfig;

  constructor(config: Partial<TracingConfig> = {}) {
    this.config = { ...DEFAULT_TRACING_CONFIG, ...config };
    this.traceId = this.generateTraceId();
    this.spanId = this.generateSpanId();
    this.sampled = true;
    this.traceState = config.traceState;
  }

  /**
   * Generate a new 32-character hex trace ID
   *
   * Uses crypto.getRandomValues for cryptographically secure randomness
   */
  generateTraceId(): string {
    return this.generateHexString(16); // 16 bytes = 32 hex chars
  }

  /**
   * Generate a new 16-character hex span ID
   */
  generateSpanId(): string {
    return this.generateHexString(8); // 8 bytes = 16 hex chars
  }

  /**
   * Generate a new span ID for a child span
   * This creates a new span ID while keeping the same trace ID
   */
  createChildSpan(): string {
    return this.generateSpanId();
  }

  /**
   * Create a W3C traceparent header value
   *
   * Format: {version}-{trace-id}-{parent-id}-{trace-flags}
   * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
   *
   * @param spanId Optional span ID to use (creates new one if not provided)
   */
  createTraceparent(spanId?: string): string {
    const version = '00';
    const flags = this.sampled ? '01' : '00';
    const parentId = spanId || this.spanId;

    return `${version}-${this.traceId}-${parentId}-${flags}`;
  }

  /**
   * Create a W3C tracestate header value (if configured)
   */
  createTracestate(): string | undefined {
    if (this.traceState) {
      return `nadi=${this.spanId},${this.traceState}`;
    }
    return `nadi=${this.spanId}`;
  }

  /**
   * Parse a traceparent header and return the trace context
   *
   * @param header The traceparent header value
   * @returns Parsed trace context or null if invalid
   */
  parseTraceparent(header: string): TraceContext | null {
    if (!header) return null;

    // traceparent format: {version}-{trace-id}-{parent-id}-{trace-flags}
    const parts = header.split('-');
    if (parts.length !== 4) return null;

    const [version, traceId, spanId, flags] = parts;

    // Validate version (only 00 is currently supported)
    if (version !== '00') return null;

    // Validate trace ID (32 hex chars, not all zeros)
    if (!/^[0-9a-f]{32}$/.test(traceId) || traceId === '0'.repeat(32)) {
      return null;
    }

    // Validate span ID (16 hex chars, not all zeros)
    if (!/^[0-9a-f]{16}$/.test(spanId) || spanId === '0'.repeat(16)) {
      return null;
    }

    // Validate flags (2 hex chars)
    if (!/^[0-9a-f]{2}$/.test(flags)) return null;

    // Parse sampled flag (bit 0)
    const sampled = (parseInt(flags, 16) & 0x01) === 1;

    return {
      traceId,
      spanId,
      sampled,
    };
  }

  /**
   * Parse tracestate header
   *
   * @param header The tracestate header value
   * @returns Map of vendor to value
   */
  parseTracestate(header: string): Map<string, string> {
    const result = new Map<string, string>();
    if (!header) return result;

    // tracestate format: vendor1=value1,vendor2=value2
    const pairs = header.split(',');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        result.set(key.trim(), value.trim());
      }
    }

    return result;
  }

  /**
   * Check if trace headers should be propagated to a URL
   *
   * Only propagates to first-party domains or explicitly allowed URLs
   * to prevent leaking trace data to third parties.
   *
   * @param url The URL to check
   */
  shouldPropagate(url: string): boolean {
    if (!this.config.enabled) return false;

    const propagateUrls = this.config.propagateTraceUrls || [];

    // If no patterns specified, don't propagate
    if (propagateUrls.length === 0) return false;

    try {
      const urlObj = new URL(url, window.location.origin);
      const fullUrl = urlObj.href;

      for (const pattern of propagateUrls) {
        if (typeof pattern === 'string') {
          // String matching - check if URL starts with pattern
          if (fullUrl.startsWith(pattern) || urlObj.hostname === pattern) {
            return true;
          }
        } else if (pattern instanceof RegExp) {
          // Regex matching
          if (pattern.test(fullUrl)) {
            return true;
          }
        }
      }
    } catch {
      // Invalid URL
      return false;
    }

    return false;
  }

  /**
   * Get the current trace context
   */
  getContext(): TraceContext {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      sampled: this.sampled,
      traceState: this.traceState,
    };
  }

  /**
   * Get trace headers for an outgoing request
   *
   * @param url The target URL (to check if propagation is allowed)
   * @returns Headers object with traceparent (and optionally tracestate)
   */
  getTraceHeaders(url: string): Record<string, string> {
    if (!this.shouldPropagate(url)) {
      return {};
    }

    const headers: Record<string, string> = {
      traceparent: this.createTraceparent(),
    };

    const tracestate = this.createTracestate();
    if (tracestate) {
      headers['tracestate'] = tracestate;
    }

    return headers;
  }

  /**
   * Set the sampled state
   */
  setSampled(sampled: boolean): void {
    this.sampled = sampled;
  }

  /**
   * Set trace state
   */
  setTraceState(traceState: string): void {
    this.traceState = traceState;
  }

  /**
   * Reset with a new trace (used when starting a new page/session)
   */
  reset(): void {
    this.traceId = this.generateTraceId();
    this.spanId = this.generateSpanId();
  }

  /**
   * Adopt an existing trace context (e.g., from server-rendered traceparent)
   */
  adoptContext(context: TraceContext): void {
    this.traceId = context.traceId;
    this.spanId = context.spanId;
    this.sampled = context.sampled;
    if (context.traceState) {
      this.traceState = context.traceState;
    }
  }

  /**
   * Get the current trace ID
   */
  getTraceId(): string {
    return this.traceId;
  }

  /**
   * Get the current span ID
   */
  getSpanId(): string {
    return this.spanId;
  }

  /**
   * Check if tracing is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Generate a hex string of specified byte length
   */
  private generateHexString(byteLength: number): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(byteLength);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Fallback for environments without crypto
    let result = '';
    for (let i = 0; i < byteLength * 2; i++) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  }
}
