import type { NadiConfig, Breadcrumb, BreadcrumbType, SessionData, VitalMetric } from './types';
import { SessionManager } from './session';
import { VitalsCollector } from './vitals';
import { ErrorTracker } from './errors';
import { BreadcrumbCollector } from './breadcrumbs';
import { ResourceCollector } from './resources';
import { LongTaskCollector } from './long-tasks';
import { PageLoadCollector } from './pageload';
import { MemoryCollector } from './memory';
import { InteractionsCollector } from './interactions';

/**
 * Required config with defaults applied
 */
interface ResolvedConfig extends Required<NadiConfig> {
  // All properties from NadiConfig with defaults applied
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
  private initialized: boolean = false;

  private constructor(config: NadiConfig) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      token: config.token,
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
    };

    // Initialize components
    this.breadcrumbs = new BreadcrumbCollector(this.config.maxBreadcrumbs);

    this.session = new SessionManager({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
      apiVersion: this.config.apiVersion,
      timeout: this.config.sessionTimeout,
      release: this.config.release,
      environment: this.config.environment,
    });

    this.vitals = new VitalsCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
      apiVersion: this.config.apiVersion,
      sampleRate: this.config.sampleRate,
      getSessionId: () => this.session.getSessionId(),
    });

    this.errors = new ErrorTracker({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
      apiVersion: this.config.apiVersion,
      getSessionId: () => this.session.getSessionId(),
      getBreadcrumbs: () => this.breadcrumbs.getAll(),
      onError: () => {
        this.breadcrumbs.add('error', 'Error captured');
      },
    });

    this.resources = new ResourceCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
      apiVersion: this.config.apiVersion,
      thresholdMs: this.config.resourceThresholdMs,
      getSessionId: () => this.session.getSessionId(),
    });

    this.longTasks = new LongTaskCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
      apiVersion: this.config.apiVersion,
      thresholdMs: this.config.longTaskThresholdMs,
      getSessionId: () => this.session.getSessionId(),
    });

    this.pageLoad = new PageLoadCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
      apiVersion: this.config.apiVersion,
      getSessionId: () => this.session.getSessionId(),
    });

    this.memory = new MemoryCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
      apiVersion: this.config.apiVersion,
      sampleIntervalMs: this.config.memorySampleIntervalMs,
      getSessionId: () => this.session.getSessionId(),
    });

    this.interactions = new InteractionsCollector({
      url: this.config.url,
      apiKey: this.config.apiKey,
      token: this.config.token,
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

    Nadi.instance = new Nadi(config);
    Nadi.instance.start();
    return Nadi.instance;
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
} from './types';

// Export utilities for advanced usage
export { getDeviceInfo, getPageUrl, getRoutePattern } from './utils';
export { getMetricThresholds, getMetricRating } from './vitals';

// Default export
export default Nadi;
