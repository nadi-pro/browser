import type {
  RageClickEntry,
  RageClicksPayload,
  UserInteractionEntry,
  UserInteractionsPayload,
  CustomEventEntry,
  CustomEventsPayload,
} from './types';
import { send, createHeaders, buildUrl } from './transport';
import { getPageUrl, debounce } from './utils';

/**
 * Interactions collector for rage clicks, scroll depth, and custom events
 */
export class InteractionsCollector {
  private rageClicks: RageClickEntry[] = [];
  private interactions: UserInteractionEntry[] = [];
  private customEvents: CustomEventEntry[] = [];
  private enabled: boolean = false;
  private clickTracker: ClickTracker | null = null;
  private scrollTracker: ScrollTracker | null = null;
  private config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion: string;
    rageClickThreshold: number;
    rageClickWindowMs: number;
    scrollDepthTracking: boolean;
    getSessionId: () => string | undefined;
  };

  constructor(config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion?: string;
    rageClickThreshold?: number;
    rageClickWindowMs?: number;
    scrollDepthTracking?: boolean;
    getSessionId: () => string | undefined;
  }) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      token: config.token,
      apiVersion: config.apiVersion || 'v1',
      rageClickThreshold: config.rageClickThreshold ?? 3,
      rageClickWindowMs: config.rageClickWindowMs ?? 1000,
      scrollDepthTracking: config.scrollDepthTracking ?? false,
      getSessionId: config.getSessionId,
    };
  }

  /**
   * Start collecting interactions
   */
  start(): void {
    if (this.enabled || typeof window === 'undefined') return;
    this.enabled = true;

    // Setup rage click detection
    this.clickTracker = new ClickTracker(
      this.config.rageClickThreshold,
      this.config.rageClickWindowMs,
      (entry) => this.handleRageClick(entry)
    );
    this.clickTracker.start();

    // Setup scroll depth tracking if enabled
    if (this.config.scrollDepthTracking) {
      this.scrollTracker = new ScrollTracker((depth, distance) =>
        this.handleScrollDepth(depth, distance)
      );
      this.scrollTracker.start();
    }

    // Send on page hide/unload
    this.setupSendOnUnload();
  }

  /**
   * Stop collecting
   */
  stop(): void {
    this.enabled = false;
    this.clickTracker?.stop();
    this.scrollTracker?.stop();
  }

  /**
   * Track a custom event
   */
  trackEvent(
    name: string,
    category?: string,
    value?: number,
    tags?: Record<string, string>
  ): void {
    if (!this.enabled) return;

    this.customEvents.push({
      name,
      category,
      value,
      tags,
    });
  }

  /**
   * Track a timing event
   */
  trackTiming(name: string, duration: number, tags?: Record<string, string>): void {
    if (!this.enabled) return;

    this.customEvents.push({
      name,
      duration,
      tags,
    });
  }

  /**
   * Force send all data immediately
   */
  async flush(): Promise<void> {
    await Promise.all([
      this.sendRageClicks(),
      this.sendInteractions(),
      this.sendCustomEvents(),
    ]);
  }

  /**
   * Handle rage click detection
   */
  private handleRageClick(entry: RageClickEntry): void {
    this.rageClicks.push(entry);
  }

  /**
   * Handle scroll depth update
   */
  private handleScrollDepth(depth: number, distance: number): void {
    // Update or add scroll interaction
    const existing = this.interactions.find((i) => i.type === 'scroll');
    if (existing) {
      existing.maxScrollDepth = Math.max(existing.maxScrollDepth || 0, depth);
      existing.scrollDistancePx = distance;
    } else {
      this.interactions.push({
        type: 'scroll',
        maxScrollDepth: depth,
        scrollDistancePx: distance,
      });
    }
  }

  /**
   * Setup sending on page unload
   */
  private setupSendOnUnload(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendAll(true);
      }
    });

    window.addEventListener('pagehide', () => {
      this.sendAll(true);
    });
  }

  /**
   * Send all data
   */
  private async sendAll(useBeacon: boolean = false): Promise<void> {
    await Promise.all([
      this.sendRageClicks(useBeacon),
      this.sendInteractions(useBeacon),
      this.sendCustomEvents(useBeacon),
    ]);
  }

  /**
   * Send rage clicks to server
   */
  private async sendRageClicks(useBeacon: boolean = false): Promise<void> {
    if (this.rageClicks.length === 0) return;

    const payload: RageClicksPayload = {
      clicks: this.rageClicks.map((c) => ({
        selector: c.selector,
        tag_name: c.tagName,
        element_id: c.elementId,
        element_class: c.elementClass,
        element_text: c.elementText,
        click_count: c.clickCount,
        window_ms: c.windowMs,
        x_position: c.xPosition,
        y_position: c.yPosition,
      })),
      session_id: this.config.getSessionId(),
      page_url: getPageUrl(),
    };

    const url = buildUrl(this.config.url, '/rum/rage-clicks');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({ url, headers, data: payload, useBeacon });
    this.rageClicks = [];
  }

  /**
   * Send user interactions to server
   */
  private async sendInteractions(useBeacon: boolean = false): Promise<void> {
    if (this.interactions.length === 0) return;

    const payload: UserInteractionsPayload = {
      interactions: this.interactions.map((i) => ({
        type: i.type,
        max_scroll_depth: i.maxScrollDepth,
        scroll_distance_px: i.scrollDistancePx,
        form_id: i.formId,
        form_name: i.formName,
        form_interaction_time: i.formInteractionTime,
        form_submitted: i.formSubmitted,
        form_field_count: i.formFieldCount,
        element_selector: i.elementSelector,
        time_to_visible: i.timeToVisible,
        time_visible: i.timeVisible,
        visibility_percent: i.visibilityPercent,
        metadata: i.metadata,
      })),
      session_id: this.config.getSessionId(),
      page_url: getPageUrl(),
    };

    const url = buildUrl(this.config.url, '/rum/interactions');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({ url, headers, data: payload, useBeacon });
    this.interactions = [];
  }

  /**
   * Send custom events to server
   */
  private async sendCustomEvents(useBeacon: boolean = false): Promise<void> {
    if (this.customEvents.length === 0) return;

    const payload: CustomEventsPayload = {
      events: this.customEvents,
      session_id: this.config.getSessionId(),
      page_url: getPageUrl(),
    };

    const url = buildUrl(this.config.url, '/rum/events');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({ url, headers, data: payload, useBeacon });
    this.customEvents = [];
  }
}

/**
 * Click tracker for detecting rage clicks
 */
class ClickTracker {
  private clicks: Array<{
    element: HTMLElement;
    timestamp: number;
    x: number;
    y: number;
  }> = [];
  private threshold: number;
  private windowMs: number;
  private onRageClick: (entry: RageClickEntry) => void;
  private boundHandler: (e: MouseEvent) => void;

  constructor(
    threshold: number,
    windowMs: number,
    onRageClick: (entry: RageClickEntry) => void
  ) {
    this.threshold = threshold;
    this.windowMs = windowMs;
    this.onRageClick = onRageClick;
    this.boundHandler = this.handleClick.bind(this);
  }

  start(): void {
    document.addEventListener('click', this.boundHandler, { capture: true });
  }

  stop(): void {
    document.removeEventListener('click', this.boundHandler, { capture: true });
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const now = Date.now();

    // Add this click
    this.clicks.push({
      element: target,
      timestamp: now,
      x: event.clientX,
      y: event.clientY,
    });

    // Remove old clicks outside window
    this.clicks = this.clicks.filter((c) => now - c.timestamp < this.windowMs);

    // Check for rage clicks on same element
    const sameElementClicks = this.clicks.filter((c) => c.element === target);

    if (sameElementClicks.length >= this.threshold) {
      this.onRageClick({
        selector: this.getSelector(target),
        tagName: target.tagName.toLowerCase(),
        elementId: target.id || undefined,
        elementClass: target.className || undefined,
        elementText: this.getElementText(target),
        clickCount: sameElementClicks.length,
        windowMs: this.windowMs,
        xPosition: event.clientX,
        yPosition: event.clientY,
      });

      // Clear clicks for this element to prevent duplicate reports
      this.clicks = this.clicks.filter((c) => c.element !== target);
    }
  }

  private getSelector(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    if (element.id) return `${tag}#${element.id}`;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) return `${tag}.${classes}`;
    }
    return tag;
  }

  private getElementText(element: HTMLElement): string | undefined {
    const text = element.textContent?.trim();
    if (!text) return undefined;
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }
}

/**
 * Scroll tracker for tracking scroll depth
 */
class ScrollTracker {
  private maxDepth: number = 0;
  private totalDistance: number = 0;
  private lastScrollTop: number = 0;
  private onUpdate: (depth: number, distance: number) => void;
  private debouncedHandler: () => void;

  constructor(onUpdate: (depth: number, distance: number) => void) {
    this.onUpdate = onUpdate;
    this.debouncedHandler = debounce(() => this.handleScroll(), 200);
  }

  start(): void {
    window.addEventListener('scroll', this.debouncedHandler, { passive: true });
  }

  stop(): void {
    window.removeEventListener('scroll', this.debouncedHandler);
  }

  private handleScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // Calculate scroll depth percentage
    const maxScroll = scrollHeight - clientHeight;
    const depth = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;

    // Track total scroll distance
    this.totalDistance += Math.abs(scrollTop - this.lastScrollTop);
    this.lastScrollTop = scrollTop;

    // Update max depth
    if (depth > this.maxDepth) {
      this.maxDepth = depth;
    }

    this.onUpdate(this.maxDepth, this.totalDistance);
  }
}
