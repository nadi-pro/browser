/**
 * Advanced Sampling Module
 *
 * Implements configurable, intelligent sampling with per-route rules,
 * error prioritization, and slow session detection.
 */

/**
 * Context for making sampling decisions
 */
export interface SamplingContext {
  /** Current page URL */
  url: string;
  /** Route pattern (e.g., /users/:id) */
  route?: string;
  /** Whether an error occurred */
  hasError: boolean;
  /** Device type */
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  /** Whether the session is considered slow */
  isSlowSession: boolean;
  /** Connection type */
  connectionType?: string;
  /** Custom tags for matching */
  tags?: Record<string, string>;
}

/**
 * A single sampling rule
 */
export interface SamplingRule {
  /** Rule name for debugging */
  name: string;
  /** Function to match the context */
  match: (ctx: SamplingContext) => boolean;
  /** Sample rate for matching contexts (0-1) */
  rate: number;
  /** Priority (higher = evaluated first) */
  priority: number;
}

/**
 * Sampling configuration
 */
export interface SamplingConfig {
  /** Global sample rate (0-1), default: 1.0 */
  globalRate: number;
  /** Custom sampling rules */
  rules?: SamplingRule[];
  /** Always sample sessions with errors (default: true) */
  alwaysSampleErrors?: boolean;
  /** Always sample slow sessions (default: true) */
  alwaysSampleSlowSessions?: boolean;
  /** Threshold in ms to consider a session slow (default: 5000) */
  slowSessionThresholdMs?: number;
  /** Enable adaptive sampling based on error rate */
  adaptiveSampling?: boolean;
}

/**
 * Default sampling configuration
 */
export const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  globalRate: 1.0,
  rules: [],
  alwaysSampleErrors: true,
  alwaysSampleSlowSessions: true,
  slowSessionThresholdMs: 5000,
  adaptiveSampling: false,
};

/**
 * Sampling decision result
 */
export interface SamplingDecision {
  /** Whether to sample this event */
  sampled: boolean;
  /** The rule that made the decision (null if global rate) */
  matchedRule?: string;
  /** The sample rate that was applied */
  appliedRate: number;
  /** Reason for the decision */
  reason: 'rule' | 'global' | 'error' | 'slow_session' | 'forced';
}

/**
 * Sampling Manager for intelligent event sampling
 *
 * Supports rule-based sampling, error prioritization, and adaptive sampling.
 */
export class SamplingManager {
  private config: SamplingConfig;
  private rules: SamplingRule[] = [];
  private sessionSampled: boolean | null = null;
  private sessionDecision: SamplingDecision | null = null;

  // Adaptive sampling state
  private errorCount: number = 0;
  private totalEvents: number = 0;
  private adaptiveRate: number = 1.0;

  constructor(config: Partial<SamplingConfig> = {}) {
    this.config = { ...DEFAULT_SAMPLING_CONFIG, ...config };
    this.rules = [...(config.rules || [])];
    this.sortRules();
  }

  /**
   * Determine if an event should be sampled
   *
   * @param context The sampling context
   * @returns Sampling decision
   */
  shouldSample(context: SamplingContext): SamplingDecision {
    // Always sample errors if configured
    if (this.config.alwaysSampleErrors && context.hasError) {
      return {
        sampled: true,
        appliedRate: 1.0,
        reason: 'error',
      };
    }

    // Always sample slow sessions if configured
    if (this.config.alwaysSampleSlowSessions && context.isSlowSession) {
      return {
        sampled: true,
        appliedRate: 1.0,
        reason: 'slow_session',
      };
    }

    // Check rules in priority order
    for (const rule of this.rules) {
      if (rule.match(context)) {
        const sampled = this.randomSample(rule.rate);
        return {
          sampled,
          matchedRule: rule.name,
          appliedRate: rule.rate,
          reason: 'rule',
        };
      }
    }

    // Use adaptive rate if enabled
    const effectiveRate = this.config.adaptiveSampling
      ? this.adaptiveRate
      : this.config.globalRate;

    const sampled = this.randomSample(effectiveRate);
    return {
      sampled,
      appliedRate: effectiveRate,
      reason: 'global',
    };
  }

  /**
   * Determine if the current session should be sampled
   * Uses consistent session-level sampling
   *
   * @param context The sampling context
   * @returns Whether to sample this session
   */
  shouldSampleSession(context: SamplingContext): boolean {
    // Return cached decision if we have one
    if (this.sessionSampled !== null) {
      return this.sessionSampled;
    }

    const decision = this.shouldSample(context);
    this.sessionSampled = decision.sampled;
    this.sessionDecision = decision;

    return decision.sampled;
  }

  /**
   * Get the session sampling decision
   */
  getSessionDecision(): SamplingDecision | null {
    return this.sessionDecision;
  }

  /**
   * Force the session to be sampled
   * Useful when an error occurs after initial sampling decision
   */
  forceSampleSession(): void {
    this.sessionSampled = true;
    this.sessionDecision = {
      sampled: true,
      appliedRate: 1.0,
      reason: 'forced',
    };
  }

  /**
   * Reset session sampling (for new sessions)
   */
  resetSession(): void {
    this.sessionSampled = null;
    this.sessionDecision = null;
  }

  /**
   * Add a sampling rule
   *
   * @param rule The rule to add
   */
  addRule(rule: SamplingRule): void {
    this.rules.push(rule);
    this.sortRules();
  }

  /**
   * Remove a sampling rule by name
   *
   * @param name The rule name to remove
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter((r) => r.name !== name);
  }

  /**
   * Update the global sample rate
   *
   * @param rate The new sample rate (0-1)
   */
  setGlobalRate(rate: number): void {
    this.config.globalRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Get the current global rate
   */
  getGlobalRate(): number {
    return this.config.adaptiveSampling ? this.adaptiveRate : this.config.globalRate;
  }

  /**
   * Record an event for adaptive sampling
   *
   * @param hasError Whether the event had an error
   */
  recordEvent(hasError: boolean): void {
    this.totalEvents++;
    if (hasError) {
      this.errorCount++;
    }

    if (this.config.adaptiveSampling) {
      this.adjustAdaptiveRate();
    }
  }

  /**
   * Force error sampling to be enabled/disabled
   */
  setAlwaysSampleErrors(enabled: boolean): void {
    this.config.alwaysSampleErrors = enabled;
  }

  /**
   * Create common sampling rules
   */
  static createRouteRule(
    name: string,
    routePattern: string | RegExp,
    rate: number,
    priority: number = 50
  ): SamplingRule {
    const matcher =
      typeof routePattern === 'string'
        ? (route: string) => route === routePattern || route.startsWith(routePattern)
        : (route: string) => routePattern.test(route);

    return {
      name,
      match: (ctx) => (ctx.route ? matcher(ctx.route) : false),
      rate,
      priority,
    };
  }

  static createDeviceTypeRule(
    name: string,
    deviceType: 'desktop' | 'mobile' | 'tablet',
    rate: number,
    priority: number = 40
  ): SamplingRule {
    return {
      name,
      match: (ctx) => ctx.deviceType === deviceType,
      rate,
      priority,
    };
  }

  static createConnectionTypeRule(
    name: string,
    connectionType: string,
    rate: number,
    priority: number = 30
  ): SamplingRule {
    return {
      name,
      match: (ctx) => ctx.connectionType === connectionType,
      rate,
      priority,
    };
  }

  /**
   * Load rules from server configuration
   *
   * @param serverRules Rules from the server API
   */
  loadServerRules(
    serverRules: Array<{
      name: string;
      rate: number;
      priority: number;
      conditions?: {
        routes?: string[];
        deviceTypes?: string[];
        connectionTypes?: string[];
      };
    }>
  ): void {
    for (const serverRule of serverRules) {
      const rule: SamplingRule = {
        name: serverRule.name,
        rate: serverRule.rate,
        priority: serverRule.priority,
        match: (ctx) => {
          if (!serverRule.conditions) return true;

          const { routes, deviceTypes, connectionTypes } = serverRule.conditions;

          if (routes && routes.length > 0) {
            if (!ctx.route || !routes.some((r) => ctx.route?.startsWith(r))) {
              return false;
            }
          }

          if (deviceTypes && deviceTypes.length > 0) {
            if (!ctx.deviceType || !deviceTypes.includes(ctx.deviceType)) {
              return false;
            }
          }

          if (connectionTypes && connectionTypes.length > 0) {
            if (!ctx.connectionType || !connectionTypes.includes(ctx.connectionType)) {
              return false;
            }
          }

          return true;
        },
      };

      this.addRule(rule);
    }
  }

  /**
   * Check if we're above the slow session threshold
   *
   * @param loadTime The page load time in ms
   * @returns Whether this is considered a slow session
   */
  isSlowSession(loadTime: number): boolean {
    return loadTime > (this.config.slowSessionThresholdMs || 5000);
  }

  /**
   * Get current configuration
   */
  getConfig(): SamplingConfig {
    return { ...this.config };
  }

  /**
   * Sort rules by priority (descending)
   */
  private sortRules(): void {
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Perform random sampling based on rate
   */
  private randomSample(rate: number): boolean {
    if (rate >= 1) return true;
    if (rate <= 0) return false;
    return Math.random() < rate;
  }

  /**
   * Adjust adaptive sampling rate based on error rate
   *
   * Higher error rates -> higher sampling rate (to capture more errors)
   * Lower error rates -> lower sampling rate (to reduce volume)
   */
  private adjustAdaptiveRate(): void {
    if (this.totalEvents < 100) {
      // Not enough data, use global rate
      this.adaptiveRate = this.config.globalRate;
      return;
    }

    const errorRate = this.errorCount / this.totalEvents;

    // Adjust sampling rate based on error rate
    // Error rate > 5% -> sample at 100%
    // Error rate 1-5% -> sample at 50%
    // Error rate 0.1-1% -> sample at 25%
    // Error rate < 0.1% -> sample at 10%
    if (errorRate > 0.05) {
      this.adaptiveRate = 1.0;
    } else if (errorRate > 0.01) {
      this.adaptiveRate = 0.5;
    } else if (errorRate > 0.001) {
      this.adaptiveRate = 0.25;
    } else {
      this.adaptiveRate = 0.1;
    }

    // Never go below the configured global rate
    this.adaptiveRate = Math.max(this.adaptiveRate, this.config.globalRate);
  }
}
