import type { NadiConfig, Breadcrumb, BreadcrumbType, SessionData, VitalMetric, TraceContext } from './types';
import { SessionManager } from './session';
import { VitalsCollector } from './vitals';
import { ErrorTracker } from './errors';
import { BreadcrumbCollector } from './breadcrumbs';
import { ResourceCollector } from './resources';
import { LongTaskCollector } from './long-tasks';
import { PageLoadCollector } from './pageload';
import { MemoryCollector } from './memory';
import { InteractionsCollector } from './interactions';
import { TracingManager } from './tracing';
import { PrivacyManager } from './privacy';
import { SamplingManager, type SamplingContext } from './sampling';

/**
 * Required config with defaults applied
 */
interface ResolvedConfig extends Required<Omit<NadiConfig, 'propagateTraceUrls' | 'customPIIPatterns' | 'samplingRules'>> {
  // All properties from NadiConfig with defaults applied
  propagateTraceUrls: (string | RegExp)[];
  customPIIPatterns: Record<string, RegExp>;
  samplingRules: NadiConfig['samplingRules'];
}

/**
 * Nadi Browser SDK
 *
 * Provides real user monitoring including:
 * - Session tracking
 * - Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
 * - JavaScript error capture
 * - User action breadcrumbs
 * - Resource timing (slow assets)
 * - Long task detection
 * - Page load waterfall
 * - Memory monitoring
 * - Rage click detection
 * - Custom events/timing
 * - Scroll depth tracking
 */
export class Nadi {
  private static instance: Nadi | null = null;

  private config: ResolvedConfig;
  private session: SessionManager;
  private vitals: VitalsCollector;
  private errors: ErrorTracker;
  private breadcrumbs: BreadcrumbCollector;
  private resources: ResourceCollector;
  private longTasks: LongTaskCollector;
  private pageLoad: PageLoadCollector;
  private memory: MemoryCollector;
  private interactions: InteractionsCollector;
  private tracing: TracingManager;
  private privacy: PrivacyManager;
  private sampling: SamplingManager;
  private initialized: boolean = false;
  private pageLoadTime: number = 0;

  private constructor(config: NadiConfig) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      appKey: config.appKey,
      apiVersion: config.apiVersion || 'v1',
      debug: config.debug || false,
      autoSession: config.autoSession ?? true,
      autoVitals: config.autoVitals ?? true,
      autoErrors: config.autoErrors ?? true,
      autoBreadcrumbs: config.autoBreadcrumbs ?? true,
      maxBreadcrumbs: config.maxBreadcrumbs || 50,
      sessionTimeout: config.sessionTimeout || 30,
      release: config.release || '',
      environment: config.environment || 'production',
      sampleRate: config.sampleRate ?? 1.0,
      // Phase 1 features
      resourceTracking: config.resourceTracking ?? true,
      resourceThresholdMs: config.resourceThresholdMs ?? 500,
      longTaskTracking: config.longTaskTracking ?? true,
      longTaskThresholdMs: config.longTaskThresholdMs ?? 50,
      // Phase 2 features
      rageClickDetection: config.rageClickDetection ?? true,
      rageClickThreshold: config.rageClickThreshold ?? 3,
      rageClickWindowMs: config.rageClickWindowMs ?? 1000,
      networkRequestTracking: config.networkRequestTracking ?? true,
      networkRequestThresholdMs: config.networkRequestThresholdMs ?? 1000,
      memoryTracking: config.memoryTracking ?? false,
      memorySampleIntervalMs: config.memorySampleIntervalMs ?? 30000,
      scrollDepthTracking: config.scrollDepthTracking ?? false,
      firstPartyDomains: config.firstPartyDomains ?? [],
      pageLoadTracking: config.pageLoadTracking ?? true,
      // Phase 3: Distributed Tracing
      tracingEnabled: config.tracingEnabled ?? false,
      propagateTraceUrls: config.propagateTraceUrls ?? [],
      traceState: config.traceState ?? '',
      // Phase 3: Privacy & Data Masking
      privacyEnabled: config.privacyEnabled ?? true,
      sensitiveUrlParams: config.sensitiveUrlParams ?? [],
      maskingStrategy: config.maskingStrategy ?? 'redact',
      customPIIPatterns: config.customPIIPatterns ?? {},
      sensitiveFields: config.sensitiveFields ?? [],
      // Phase 3: Advanced Sampling
      samplingRules: config.samplingRules,
      alwaysSampleErrors: config.alwaysSampleErrors ?? true,
      alwaysSampleSlowSessions: config.alwaysSampleSlowSessions ?? true,
      slowSessionThresholdMs: config.slowSessionThresholdMs ?? 5000,
      adaptiveSampling: config.adaptiveSampling ?? false,
    };

    // Initialize tracing manager
    this.tracing = new TracingManager({
      enabled: this.config.tracingEnabled,
      propagateTraceUrls: this.config.propagateTraceUrls,
      traceState: this.config.traceState,
    });

    // Initialize privacy manager
    this.privacy = new PrivacyManager({
      enabled: this.config.privacyEnabled,
      sensitiveUrlParams: this.config.sensitiveUrlParams,
      maskingStrategy: this.config.maskingStrategy,
      customPIIPatterns: this.config.customPIIPatterns,
      sensitiveFields: this.config.sensitiveFields,
    });

    // Initialize sampling manager
    this.sampling = new SamplingManager({
      globalRate: this.config.sampleRate,
      rules: this.config.samplingRules?.map((rule) => ({
        name: rule.name,
        rate: rule.rate,
        priority: rule.priority,
        match: (ctx: SamplingContext) => {
          if (!rule.conditions) return true;
          const { routes, deviceTypes, connectionTypes } = rule.conditions;
          if (routes && routes.length > 0) {
            if (!ctx.route || !routes.some((r) => ctx.route?.startsWith(r))) return false;
          }
          if (deviceTypes && deviceTypes.length > 0) {
            if (!ctx.deviceType || !deviceTypes.includes(ctx.deviceType)) return false;
          }
          if (connectionTypes && connectionTypes.length > 0) {
            if (!ctx.connectionType || !connectionTypes.includes(ctx.connectionType)) return false;
          }
          return true;
        },
      })),
      alwaysSampleErrors: this.config.alwaysSampleErrors,
      alwaysSampleSlowSessions: this.config.alwaysSampleSlowSessions,
      slowSessionThresholdMs: this.config.slowSessionThresholdMs,
      adaptiveSampling: this.config.adaptiveSampling,
    });

    // Initialize components
    this.breadcrumbs = new BreadcrumbCollector({
      maxBreadcrumbs: this.config.maxBreadcrumbs,
      getTraceHeaders: (url) => this.tracing.getTraceHeaders(url),
      scrubUrl: (url) => this.privacy.scrubUrl(url),
      maskPII: (text) => this.privacy.maskPII(text),
    });

    this.session = new SessionManager({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      timeout: this.config.sessionTimeout,
      release: this.config.release,
      environment: this.config.environment,
    });

    this.vitals = new VitalsCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      sampleRate: this.config.sampleRate,
      getSessionId: () => this.session.getSessionId(),
    });

    this.errors = new ErrorTracker({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      release: this.config.release,
      getSessionId: () => this.session.getSessionId(),
      getBreadcrumbs: () => this.breadcrumbs.getAll(),
      getTraceContext: () => this.tracing.isEnabled() ? this.tracing.getContext() : undefined,
      maskError: (message, stack) => this.privacy.maskError(message, stack),
      onError: () => {
        this.breadcrumbs.add('error', 'Error captured');
        // Force session to be sampled when an error occurs
        this.sampling.forceSampleSession();
      },
    });

    this.resources = new ResourceCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      thresholdMs: this.config.resourceThresholdMs,
      getSessionId: () => this.session.getSessionId(),
    });

    this.longTasks = new LongTaskCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      thresholdMs: this.config.longTaskThresholdMs,
      getSessionId: () => this.session.getSessionId(),
    });

    this.pageLoad = new PageLoadCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      getSessionId: () => this.session.getSessionId(),
    });

    this.memory = new MemoryCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      sampleIntervalMs: this.config.memorySampleIntervalMs,
      getSessionId: () => this.session.getSessionId(),
    });

    this.interactions = new InteractionsCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      appKey: this.config.appKey,
      apiVersion: this.config.apiVersion,
      rageClickThreshold: this.config.rageClickThreshold,
      rageClickWindowMs: this.config.rageClickWindowMs,
      scrollDepthTracking: this.config.scrollDepthTracking,
      getSessionId: () => this.session.getSessionId(),
    });

    this.log('Nadi SDK initialized', this.config);
  }

  /**
   * Initialize the Nadi SDK
   */
  static init(config: NadiConfig): Nadi {
    if (Nadi.instance) {
      console.warn('Nadi SDK already initialized. Use Nadi.getInstance() to get the instance.');
      return Nadi.instance;
    }

    // Validate required configuration
    Nadi.validateConfig(config);

    Nadi.instance = new Nadi(config);
    Nadi.instance.start();
    return Nadi.instance;
  }

  /**
   * Validate SDK configuration
   * @throws Error if configuration is invalid
   */
  private static validateConfig(config: NadiConfig): void {
    if (!config.url || typeof config.url !== 'string' || config.url.trim() === '') {
      throw new Error('[Nadi] Configuration error: "url" is required and must be a non-empty string');
    }

    if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
      throw new Error('[Nadi] Configuration error: "apiKey" is required and must be a non-empty string');
    }

    if (!config.appKey || typeof config.appKey !== 'string' || config.appKey.trim() === '' || config.appKey === 'undefined') {
      throw new Error('[Nadi] Configuration error: "appKey" is required and must be a valid application token from the Nadi dashboard');
    }
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): Nadi | null {
    return Nadi.instance;
  }

  /**
   * Start all configured collectors
   */
  private async start(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // Start breadcrumbs first (needed by error tracker)
    if (this.config.autoBreadcrumbs) {
      this.breadcrumbs.start();
      this.log('Breadcrumb collection started');
    }

    // Start session tracking
    if (this.config.autoSession) {
      await this.session.start();
      this.log('Session started', this.session.getSession());
    }

    // Start Web Vitals collection
    if (this.config.autoVitals) {
      this.vitals.start();
      this.log('Web Vitals collection started');
    }

    // Start error tracking
    if (this.config.autoErrors) {
      this.errors.start();
      this.log('Error tracking started');
    }

    // Start resource timing tracking
    if (this.config.resourceTracking) {
      this.resources.start();
      this.log('Resource timing collection started');
    }

    // Start long task tracking
    if (this.config.longTaskTracking) {
      this.longTasks.start();
      this.log('Long task collection started');
    }

    // Start page load tracking
    if (this.config.pageLoadTracking) {
      this.pageLoad.start();
      this.log('Page load collection started');
    }

    // Start memory tracking (Chrome only)
    if (this.config.memoryTracking && MemoryCollector.isSupported()) {
      this.memory.start();
      this.log('Memory tracking started');
    }

    // Start interactions (rage clicks, scroll depth)
    if (this.config.rageClickDetection || this.config.scrollDepthTracking) {
      this.interactions.start();
      this.log('Interactions collection started');
    }
  }

  /**
   * Stop all collectors
   */
  async stop(): Promise<void> {
    this.breadcrumbs.stop();
    this.vitals.stop();
    this.errors.stop();
    this.resources.stop();
    this.longTasks.stop();
    this.pageLoad.stop();
    this.memory.stop();
    this.interactions.stop();
    await this.session.end();
    this.initialized = false;
    this.log('Nadi SDK stopped');
  }

  // ==================
  // Session Methods
  // ==================

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    return this.session.getSession();
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | undefined {
    return this.session.getSessionId();
  }

  /**
   * Set user ID for the current session
   */
  setUser(userId: string): void {
    this.session.setUserId(userId);
    this.log('User set', { userId });
  }

  /**
   * Report a crash
   */
  async reportCrash(): Promise<void> {
    await this.session.crash();
    this.log('Crash reported');
  }

  // ==================
  // Breadcrumb Methods
  // ==================

  /**
   * Add a custom breadcrumb
   */
  addBreadcrumb(type: BreadcrumbType, message: string, data?: Record<string, unknown>): void {
    this.breadcrumbs.add(type, message, data);
    this.log('Breadcrumb added', { type, message, data });
  }

  /**
   * Get all breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs.getAll();
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs.clear();
    this.log('Breadcrumbs cleared');
  }

  // ==================
  // Error Methods
  // ==================

  /**
   * Capture an error
   */
  async captureError(error: Error, context?: Record<string, unknown>): Promise<void> {
    await this.errors.captureError(error, context);
    this.log('Error captured', { error: error.message, context });
  }

  /**
   * Capture a message as an error
   */
  async captureMessage(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.errors.captureMessage(message, context);
    this.log('Message captured', { message, context });
  }

  // ==================
  // Vitals Methods
  // ==================

  /**
   * Get collected Web Vitals
   */
  getVitals(): VitalMetric[] {
    return this.vitals.getMetrics();
  }

  /**
   * Flush Web Vitals immediately
   */
  async flushVitals(): Promise<void> {
    await this.vitals.flush();
    this.log('Vitals flushed');
  }

  // ==================
  // Custom Event Methods
  // ==================

  /**
   * Track a custom event
   */
  trackEvent(
    name: string,
    category?: string,
    value?: number,
    tags?: Record<string, string>
  ): void {
    this.interactions.trackEvent(name, category, value, tags);
    this.log('Event tracked', { name, category, value, tags });
  }

  /**
   * Track a timing event
   */
  trackTiming(name: string, duration: number, tags?: Record<string, string>): void {
    this.interactions.trackTiming(name, duration, tags);
    this.log('Timing tracked', { name, duration, tags });
  }

  // ==================
  // Flush Methods
  // ==================

  /**
   * Flush all collected data immediately
   */
  async flush(): Promise<void> {
    await Promise.all([
      this.vitals.flush(),
      this.resources.flush(),
      this.longTasks.flush(),
      this.pageLoad.flush(),
      this.memory.flush(),
      this.interactions.flush(),
    ]);
    this.log('All data flushed');
  }

  // ==================
  // Tracing Methods
  // ==================

  /**
   * Get current trace context
   */
  getTraceContext(): TraceContext | null {
    if (!this.tracing.isEnabled()) return null;
    return this.tracing.getContext();
  }

  /**
   * Get the current trace ID
   */
  getTraceId(): string | null {
    if (!this.tracing.isEnabled()) return null;
    return this.tracing.getTraceId();
  }

  /**
   * Get trace headers for an outgoing request
   * @param url The target URL
   */
  getTraceHeaders(url: string): Record<string, string> {
    return this.tracing.getTraceHeaders(url);
  }

  /**
   * Adopt an existing trace context (e.g., from server-rendered page)
   */
  adoptTraceContext(context: TraceContext): void {
    this.tracing.adoptContext(context);
    this.log('Trace context adopted', context);
  }

  // ==================
  // Privacy Methods
  // ==================

  /**
   * Scrub PII from a URL
   */
  scrubUrl(url: string): string {
    return this.privacy.scrubUrl(url);
  }

  /**
   * Mask PII in text
   */
  maskPII(text: string): string {
    return this.privacy.maskPII(text);
  }

  /**
   * Detect PII in text
   */
  detectPII(text: string): { hasPII: boolean; types: string[]; count: number } {
    return this.privacy.detectPII(text);
  }

  // ==================
  // Sampling Methods
  // ==================

  /**
   * Check if the current session should be sampled
   */
  shouldSampleSession(): boolean {
    const context = this.getSamplingContext();
    return this.sampling.shouldSampleSession(context);
  }

  /**
   * Get the current sampling decision
   */
  getSamplingDecision(): { sampled: boolean; reason: string; rate: number } | null {
    const decision = this.sampling.getSessionDecision();
    if (!decision) return null;
    return {
      sampled: decision.sampled,
      reason: decision.reason,
      rate: decision.appliedRate,
    };
  }

  /**
   * Force the session to be sampled
   */
  forceSampleSession(): void {
    this.sampling.forceSampleSession();
    this.log('Session sampling forced');
  }

  // ==================
  // Utility Methods
  // ==================

  /**
   * Debug logging
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[Nadi] ${message}`, data || '');
    }
  }

  /**
   * Get sampling context for current page
   */
  private getSamplingContext(): SamplingContext {
    const deviceInfo = this.session.getSession()?.deviceInfo;
    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      route: typeof window !== 'undefined' ? window.location.pathname.replace(/\/\d+/g, '/:id') : '',
      hasError: false,
      deviceType: deviceInfo?.deviceType,
      isSlowSession: this.pageLoadTime > this.config.slowSessionThresholdMs,
      connectionType: deviceInfo?.connectionType,
    };
  }

  /**
   * Set page load time for slow session detection
   */
  setPageLoadTime(loadTime: number): void {
    this.pageLoadTime = loadTime;
  }
}

// Export types
export type {
  NadiConfig,
  Breadcrumb,
  BreadcrumbType,
  SessionData,
  VitalMetric,
  DeviceInfo,
  ErrorPayload,
  VitalsPayload,
  ResourceEntry,
  LongTaskEntry,
  CustomEventEntry,
  RageClickEntry,
  NetworkRequestEntry,
  PageLoadEntry,
  MemorySampleEntry,
  UserInteractionEntry,
  InteractionType,
  TraceContext,
  CorrelatedRequest,
  SamplingRuleConfig,
} from './types';

// Export tracing types and utilities
export { TracingManager, type TracingConfig } from './tracing';

// Export privacy types and utilities
export { PrivacyManager, type PrivacyConfig, type PIIDetectionResult } from './privacy';

// Export sampling types and utilities
export { SamplingManager, type SamplingConfig, type SamplingContext, type SamplingDecision, type SamplingRule } from './sampling';

// Export utilities for advanced usage
export { getDeviceInfo, getPageUrl, getRoutePattern } from './utils';
export { getMetricThresholds, getMetricRating } from './vitals';

// Default export
export default Nadi;
