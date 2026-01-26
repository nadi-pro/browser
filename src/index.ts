import type { NadiConfig, Breadcrumb, BreadcrumbType, SessionData, VitalMetric } from './types';
import { SessionManager } from './session';
import { VitalsCollector } from './vitals';
import { ErrorTracker } from './errors';
import { BreadcrumbCollector } from './breadcrumbs';

/**
 * Nadi Browser SDK
 *
 * Provides real user monitoring including:
 * - Session tracking
 * - Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
 * - JavaScript error capture
 * - User action breadcrumbs
 */
export class Nadi {
  private static instance: Nadi | null = null;

  private config: Required<NadiConfig>;
  private session: SessionManager;
  private vitals: VitalsCollector;
  private errors: ErrorTracker;
  private breadcrumbs: BreadcrumbCollector;
  private initialized: boolean = false;

  private constructor(config: NadiConfig) {
    this.config = {
      url: config.url,
      appToken: config.appToken,
      bearerToken: config.bearerToken,
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
    };

    // Initialize components
    this.breadcrumbs = new BreadcrumbCollector(this.config.maxBreadcrumbs);

    this.session = new SessionManager({
      url: this.config.url,
      bearerToken: this.config.bearerToken,
      appToken: this.config.appToken,
      apiVersion: this.config.apiVersion,
      timeout: this.config.sessionTimeout,
      release: this.config.release,
      environment: this.config.environment,
    });

    this.vitals = new VitalsCollector({
      url: this.config.url,
      bearerToken: this.config.bearerToken,
      appToken: this.config.appToken,
      apiVersion: this.config.apiVersion,
      sampleRate: this.config.sampleRate,
      getSessionId: () => this.session.getSessionId(),
    });

    this.errors = new ErrorTracker({
      url: this.config.url,
      bearerToken: this.config.bearerToken,
      appToken: this.config.appToken,
      apiVersion: this.config.apiVersion,
      getSessionId: () => this.session.getSessionId(),
      getBreadcrumbs: () => this.breadcrumbs.getAll(),
      onError: () => {
        // Record error as breadcrumb
        this.breadcrumbs.add('error', 'Error captured');
      },
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
  }

  /**
   * Stop all collectors
   */
  async stop(): Promise<void> {
    this.breadcrumbs.stop();
    this.vitals.stop();
    this.errors.stop();
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
} from './types';

// Export utilities for advanced usage
export { getDeviceInfo, getPageUrl, getRoutePattern } from './utils';
export { getMetricThresholds, getMetricRating } from './vitals';

// Default export
export default Nadi;
