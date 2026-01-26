import type { Breadcrumb, BreadcrumbType } from './types';

/**
 * Breadcrumb collector for tracking user actions
 */
export class BreadcrumbCollector {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs: number;
  private enabled: boolean = false;

  constructor(maxBreadcrumbs: number = 50) {
    this.maxBreadcrumbs = maxBreadcrumbs;
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

    const breadcrumb: Breadcrumb = {
      type,
      message,
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

    levels.forEach((level) => {
      const original = console[level];
      console[level] = (...args: unknown[]) => {
        if (this.enabled) {
          const message = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ');

          this.add('console', `[${level}] ${message.substring(0, 200)}`, {
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

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';

      if (this.enabled) {
        this.add('fetch', `${method} ${url}`, {
          url,
          method,
        });
      }

      try {
        const response = await originalFetch(input, init);

        if (this.enabled) {
          this.add('fetch', `${method} ${url} - ${response.status}`, {
            url,
            method,
            status: response.status,
          });
        }

        return response;
      } catch (error) {
        if (this.enabled) {
          this.add('fetch', `${method} ${url} - Failed`, {
            url,
            method,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        throw error;
      }
    };
  }

  /**
   * Track XMLHttpRequest
   */
  private setupXhrTracking(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const collector = this;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...args: [boolean?, string?, string?]
    ) {
      (this as XMLHttpRequest & { _nadiMethod: string; _nadiUrl: string })._nadiMethod = method;
      (this as XMLHttpRequest & { _nadiMethod: string; _nadiUrl: string })._nadiUrl = String(url);
      return originalOpen.apply(this, [method, url, ...args] as Parameters<typeof originalOpen>);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const xhr = this as XMLHttpRequest & { _nadiMethod: string; _nadiUrl: string };

      if (collector.enabled) {
        collector.add('xhr', `${xhr._nadiMethod} ${xhr._nadiUrl}`, {
          url: xhr._nadiUrl,
          method: xhr._nadiMethod,
        });
      }

      this.addEventListener('loadend', () => {
        if (collector.enabled) {
          collector.add('xhr', `${xhr._nadiMethod} ${xhr._nadiUrl} - ${this.status}`, {
            url: xhr._nadiUrl,
            method: xhr._nadiMethod,
            status: this.status,
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
