import type { Breadcrumb, BreadcrumbType, CorrelatedRequest } from './types';

/**
 * Configuration for breadcrumb collector
 */
export interface BreadcrumbCollectorConfig {
  maxBreadcrumbs?: number;
  /** Function to get trace headers for outgoing requests */
  getTraceHeaders?: (url: string) => Record<string, string>;
  /** Function to scrub URLs for privacy */
  scrubUrl?: (url: string) => string;
  /** Function to mask PII in messages */
  maskPII?: (text: string) => string;
}

/**
 * Breadcrumb collector for tracking user actions
 */
export class BreadcrumbCollector {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs: number;
  private enabled: boolean = false;
  private config: BreadcrumbCollectorConfig;
  private correlatedRequests: CorrelatedRequest[] = [];
  private maxCorrelatedRequests: number = 10;

  constructor(maxBreadcrumbsOrConfig: number | BreadcrumbCollectorConfig = 50) {
    if (typeof maxBreadcrumbsOrConfig === 'number') {
      this.maxBreadcrumbs = maxBreadcrumbsOrConfig;
      this.config = {};
    } else {
      this.maxBreadcrumbs = maxBreadcrumbsOrConfig.maxBreadcrumbs || 50;
      this.config = maxBreadcrumbsOrConfig;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: BreadcrumbCollectorConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get recent correlated requests (for error context)
   */
  getCorrelatedRequests(): CorrelatedRequest[] {
    return [...this.correlatedRequests];
  }

  /**
   * Clear correlated requests
   */
  clearCorrelatedRequests(): void {
    this.correlatedRequests = [];
  }

  /**
   * Start collecting breadcrumbs
   */
  start(): void {
    if (this.enabled || typeof window === 'undefined') return;
    this.enabled = true;

    this.setupClickTracking();
    this.setupNavigationTracking();
    this.setupConsoleTracking();
    this.setupFetchTracking();
    this.setupXhrTracking();
  }

  /**
   * Stop collecting breadcrumbs
   */
  stop(): void {
    this.enabled = false;
    // Note: Event listeners remain attached but check enabled flag
  }

  /**
   * Add a custom breadcrumb
   */
  add(type: BreadcrumbType, message: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    // Apply privacy masking if configured
    let maskedMessage = message;
    if (this.config.maskPII) {
      maskedMessage = this.config.maskPII(message);
    }

    const breadcrumb: Breadcrumb = {
      type,
      message: maskedMessage,
      timestamp: Date.now(),
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Get all breadcrumbs
   */
  getAll(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear all breadcrumbs
   */
  clear(): void {
    this.breadcrumbs = [];
  }

  /**
   * Track click events
   */
  private setupClickTracking(): void {
    document.addEventListener(
      'click',
      (event) => {
        if (!this.enabled) return;

        const target = event.target as HTMLElement;
        const selector = this.getElementSelector(target);
        const text = this.getElementText(target);

        this.add('click', `Click on ${selector}${text ? `: "${text}"` : ''}`, {
          selector,
          tagName: target.tagName.toLowerCase(),
          id: target.id || undefined,
          className: target.className || undefined,
        });
      },
      { capture: true, passive: true }
    );
  }

  /**
   * Track navigation events
   */
  private setupNavigationTracking(): void {
    // History pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      if (this.enabled) {
        this.add('navigation', `Navigate to ${window.location.pathname}`, {
          url: window.location.href,
          method: 'pushState',
        });
      }
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      if (this.enabled) {
        this.add('navigation', `Replace state: ${window.location.pathname}`, {
          url: window.location.href,
          method: 'replaceState',
        });
      }
    };

    // Popstate (back/forward)
    window.addEventListener('popstate', () => {
      if (!this.enabled) return;
      this.add('navigation', `Navigate to ${window.location.pathname}`, {
        url: window.location.href,
        method: 'popstate',
      });
    });
  }

  /**
   * Track console logs
   */
  private setupConsoleTracking(): void {
    const levels: Array<'log' | 'info' | 'warn' | 'error'> = ['log', 'info', 'warn', 'error'];
    const collector = this;

    levels.forEach((level) => {
      const original = console[level];
      console[level] = (...args: unknown[]) => {
        if (collector.enabled) {
          let message = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ');

          // Apply privacy masking to console output
          if (collector.config.maskPII) {
            message = collector.config.maskPII(message);
          }

          collector.add('console', `[${level}] ${message.substring(0, 200)}`, {
            level,
          });
        }
        original.apply(console, args);
      };
    });
  }

  /**
   * Track fetch requests
   */
  private setupFetchTracking(): void {
    const originalFetch = window.fetch;
    const collector = this;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      const startTime = performance.now();

      // Scrub URL for privacy
      const scrubbedUrl = collector.config.scrubUrl ? collector.config.scrubUrl(url) : url;

      // Inject trace headers if configured
      let modifiedInit = init;
      if (collector.config.getTraceHeaders) {
        const traceHeaders = collector.config.getTraceHeaders(url);
        if (Object.keys(traceHeaders).length > 0) {
          modifiedInit = {
            ...init,
            headers: {
              ...(init?.headers || {}),
              ...traceHeaders,
            },
          };
        }
      }

      if (collector.enabled) {
        collector.add('fetch', `${method} ${scrubbedUrl}`, {
          url: scrubbedUrl,
          method,
        });
      }

      try {
        const response = await originalFetch(input, modifiedInit);
        const endTime = performance.now();

        if (collector.enabled) {
          collector.add('fetch', `${method} ${scrubbedUrl} - ${response.status}`, {
            url: scrubbedUrl,
            method,
            status: response.status,
          });

          // Track correlated request for error context
          collector.trackCorrelatedRequest({
            url: scrubbedUrl,
            method,
            startTime,
            endTime,
            status: response.status,
            duration: endTime - startTime,
            // Extract trace ID from response headers if present
            traceId: response.headers.get('x-trace-id') || '',
            spanId: response.headers.get('x-span-id') || '',
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();

        if (collector.enabled) {
          collector.add('fetch', `${method} ${scrubbedUrl} - Failed`, {
            url: scrubbedUrl,
            method,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Track failed request
          collector.trackCorrelatedRequest({
            url: scrubbedUrl,
            method,
            startTime,
            endTime,
            status: 0,
            duration: endTime - startTime,
            traceId: '',
            spanId: '',
          });
        }
        throw error;
      }
    };
  }

  /**
   * Track a correlated request
   */
  private trackCorrelatedRequest(request: CorrelatedRequest): void {
    this.correlatedRequests.push(request);

    // Keep only the most recent requests
    if (this.correlatedRequests.length > this.maxCorrelatedRequests) {
      this.correlatedRequests.shift();
    }
  }

  /**
   * Track XMLHttpRequest
   */
  private setupXhrTracking(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    const collector = this;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...args: [boolean?, string?, string?]
    ) {
      const xhrExt = this as XMLHttpRequest & {
        _nadiMethod: string;
        _nadiUrl: string;
        _nadiStartTime: number;
      };
      xhrExt._nadiMethod = method;
      xhrExt._nadiUrl = String(url);
      return originalOpen.apply(this, [method, url, ...args] as Parameters<typeof originalOpen>);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const xhr = this as XMLHttpRequest & {
        _nadiMethod: string;
        _nadiUrl: string;
        _nadiStartTime: number;
      };

      xhr._nadiStartTime = performance.now();

      // Scrub URL for privacy
      const scrubbedUrl = collector.config.scrubUrl
        ? collector.config.scrubUrl(xhr._nadiUrl)
        : xhr._nadiUrl;

      // Inject trace headers if configured
      if (collector.config.getTraceHeaders) {
        const traceHeaders = collector.config.getTraceHeaders(xhr._nadiUrl);
        for (const [key, value] of Object.entries(traceHeaders)) {
          try {
            originalSetRequestHeader.call(this, key, value);
          } catch {
            // Header might already be set or not allowed
          }
        }
      }

      if (collector.enabled) {
        collector.add('xhr', `${xhr._nadiMethod} ${scrubbedUrl}`, {
          url: scrubbedUrl,
          method: xhr._nadiMethod,
        });
      }

      this.addEventListener('loadend', () => {
        const endTime = performance.now();

        if (collector.enabled) {
          collector.add('xhr', `${xhr._nadiMethod} ${scrubbedUrl} - ${this.status}`, {
            url: scrubbedUrl,
            method: xhr._nadiMethod,
            status: this.status,
          });

          // Track correlated request
          collector.trackCorrelatedRequest({
            url: scrubbedUrl,
            method: xhr._nadiMethod,
            startTime: xhr._nadiStartTime,
            endTime,
            status: this.status,
            duration: endTime - xhr._nadiStartTime,
            traceId: this.getResponseHeader('x-trace-id') || '',
            spanId: this.getResponseHeader('x-span-id') || '',
          });
        }
      });

      return originalSend.call(this, body);
    };
  }

  /**
   * Get a CSS-like selector for an element
   */
  private getElementSelector(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();

    if (element.id) {
      return `${tag}#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) {
        return `${tag}.${classes}`;
      }
    }

    return tag;
  }

  /**
   * Get truncated text content of an element
   */
  private getElementText(element: HTMLElement): string {
    const text = element.textContent?.trim() || '';
    return text.length > 30 ? text.substring(0, 30) + '...' : text;
  }
}
