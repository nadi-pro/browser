import type { ErrorPayload, Breadcrumb } from './types';
import { send, createHeaders, buildUrl } from './transport';
import { getPageUrl } from './utils';

/**
 * Error tracker for capturing JavaScript errors
 */
export class ErrorTracker {
  private enabled: boolean = false;
  private config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion: string;
    getSessionId: () => string | undefined;
    getBreadcrumbs: () => Breadcrumb[];
    onError?: (error: ErrorPayload) => void;
  };

  constructor(config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion?: string;
    getSessionId: () => string | undefined;
    getBreadcrumbs: () => Breadcrumb[];
    onError?: (error: ErrorPayload) => void;
  }) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      token: config.token,
      apiVersion: config.apiVersion || 'v1',
      getSessionId: config.getSessionId,
      getBreadcrumbs: config.getBreadcrumbs,
      onError: config.onError,
    };
  }

  /**
   * Start capturing errors
   */
  start(): void {
    if (this.enabled || typeof window === 'undefined') return;
    this.enabled = true;

    this.setupErrorHandler();
    this.setupUnhandledRejectionHandler();
  }

  /**
   * Stop capturing errors
   */
  stop(): void {
    this.enabled = false;
  }

  /**
   * Manually capture an error
   */
  async captureError(error: Error, context?: Record<string, unknown>): Promise<void> {
    if (!this.enabled) return;

    const payload = this.createErrorPayload(
      error.message,
      error.stack,
      undefined,
      undefined,
      undefined,
      error.name,
      context
    );

    await this.sendError(payload);
  }

  /**
   * Manually capture a message as an error
   */
  async captureMessage(message: string, context?: Record<string, unknown>): Promise<void> {
    if (!this.enabled) return;

    const payload = this.createErrorPayload(
      message,
      undefined,
      undefined,
      undefined,
      undefined,
      'Message',
      context
    );

    await this.sendError(payload);
  }

  /**
   * Setup global error handler
   */
  private setupErrorHandler(): void {
    window.addEventListener('error', (event) => {
      if (!this.enabled) return;

      // Ignore errors from extensions or cross-origin scripts
      if (this.shouldIgnoreError(event)) return;

      const payload = this.createErrorPayload(
        event.message,
        event.error?.stack,
        event.filename,
        event.lineno,
        event.colno,
        event.error?.name
      );

      this.sendError(payload);
    });
  }

  /**
   * Setup unhandled promise rejection handler
   */
  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      if (!this.enabled) return;

      const reason = event.reason;
      let message: string;
      let stack: string | undefined;
      let type: string = 'UnhandledPromiseRejection';

      if (reason instanceof Error) {
        message = reason.message;
        stack = reason.stack;
        type = reason.name || type;
      } else if (typeof reason === 'string') {
        message = reason;
      } else {
        message = JSON.stringify(reason) || 'Unknown rejection reason';
      }

      const payload = this.createErrorPayload(
        message,
        stack,
        undefined,
        undefined,
        undefined,
        type
      );

      this.sendError(payload);
    });
  }

  /**
   * Create error payload
   */
  private createErrorPayload(
    message: string,
    stack?: string,
    filename?: string,
    lineno?: number,
    colno?: number,
    type?: string,
    context?: Record<string, unknown>
  ): ErrorPayload {
    return {
      message,
      stack,
      filename,
      lineno,
      colno,
      type,
      sessionId: this.config.getSessionId(),
      pageUrl: getPageUrl(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      breadcrumbs: this.config.getBreadcrumbs(),
      ...(context && { context }),
    };
  }

  /**
   * Send error to server
   */
  private async sendError(payload: ErrorPayload): Promise<void> {
    // Call onError callback if provided
    if (this.config.onError) {
      this.config.onError(payload);
    }

    const url = buildUrl(this.config.url, '/api/rum/errors');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({
      url,
      headers,
      data: {
        message: payload.message,
        stack: payload.stack,
        filename: payload.filename,
        lineno: payload.lineno,
        colno: payload.colno,
        type: payload.type,
        session_id: payload.sessionId,
        page_url: payload.pageUrl,
        user_agent: payload.userAgent,
        breadcrumbs: payload.breadcrumbs,
      },
    });
  }

  /**
   * Check if an error should be ignored
   */
  private shouldIgnoreError(event: ErrorEvent): boolean {
    // Ignore errors without a message
    if (!event.message) return true;

    // Ignore cross-origin script errors (shows as "Script error.")
    if (event.message === 'Script error.' && !event.filename) return true;

    // Ignore browser extension errors
    if (event.filename?.includes('extension://')) return true;

    // Ignore errors from common ad/tracking scripts
    const ignoredPatterns = [
      'googletagmanager.com',
      'google-analytics.com',
      'facebook.net',
      'doubleclick.net',
    ];

    if (event.filename && ignoredPatterns.some((p) => event.filename?.includes(p))) {
      return true;
    }

    return false;
  }
}
