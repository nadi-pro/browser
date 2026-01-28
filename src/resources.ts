import type { ResourceEntry, ResourcePayload } from './types';
import { send, createHeaders, buildUrl } from './transport';
import { getPageUrl } from './utils';

/**
 * Resource timing collector for tracking slow-loading assets
 */
export class ResourceCollector {
  private resources: ResourceEntry[] = [];
  private enabled: boolean = false;
  private observer: PerformanceObserver | null = null;
  private config: {
    url: string;
    apiKey: string;
    appKey: string;
    apiVersion: string;
    thresholdMs: number;
    getSessionId: () => string | undefined;
  };

  constructor(config: {
    url: string;
    apiKey: string;
    appKey: string;
    apiVersion?: string;
    thresholdMs?: number;
    getSessionId: () => string | undefined;
  }) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      appKey: config.appKey,
      apiVersion: config.apiVersion || 'v1',
      thresholdMs: config.thresholdMs ?? 500,
      getSessionId: config.getSessionId,
    };
  }

  /**
   * Start collecting resource timings
   */
  start(): void {
    if (this.enabled || typeof window === 'undefined') return;
    if (typeof PerformanceObserver === 'undefined') return;

    this.enabled = true;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleEntry(entry as PerformanceResourceTiming);
        }
      });

      this.observer.observe({ type: 'resource', buffered: true });
    } catch {
      // PerformanceObserver not supported
      this.enabled = false;
    }

    // Send on page hide/unload
    this.setupSendOnUnload();
  }

  /**
   * Stop collecting
   */
  stop(): void {
    this.enabled = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Force send resources immediately
   */
  async flush(): Promise<void> {
    if (this.resources.length === 0) return;
    await this.sendResources();
    this.resources = [];
  }

  /**
   * Get collected resources
   */
  getResources(): ResourceEntry[] {
    return [...this.resources];
  }

  /**
   * Handle a resource timing entry
   */
  private handleEntry(entry: PerformanceResourceTiming): void {
    if (!this.enabled) return;

    // Only track resources that exceed threshold
    if (entry.duration < this.config.thresholdMs) return;

    // Skip Nadi's own requests
    if (entry.name.includes('/rum/') || entry.name.includes('/sessions/')) return;

    const resource: ResourceEntry = {
      url: entry.name,
      initiatorType: entry.initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize || undefined,
      encodedBodySize: entry.encodedBodySize || undefined,
      decodedBodySize: entry.decodedBodySize || undefined,
      protocol: entry.nextHopProtocol || undefined,
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart || undefined,
      tcpConnect: entry.connectEnd - entry.connectStart || undefined,
      sslTime:
        entry.secureConnectionStart > 0
          ? entry.connectEnd - entry.secureConnectionStart
          : undefined,
      ttfb: entry.responseStart - entry.requestStart || undefined,
      contentDownload: entry.responseEnd - entry.responseStart || undefined,
      cacheHit: entry.transferSize === 0 && entry.decodedBodySize > 0,
    };

    this.resources.push(resource);
  }

  /**
   * Setup sending on page unload
   */
  private setupSendOnUnload(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendResources(true);
      }
    });

    window.addEventListener('pagehide', () => {
      this.sendResources(true);
    });
  }

  /**
   * Send resources to server
   */
  private async sendResources(useBeacon: boolean = false): Promise<void> {
    if (this.resources.length === 0) return;

    const payload: ResourcePayload = {
      resources: this.resources.map((r) => ({
        url: r.url,
        initiator_type: r.initiatorType,
        duration: r.duration,
        transfer_size: r.transferSize,
        encoded_body_size: r.encodedBodySize,
        decoded_body_size: r.decodedBodySize,
        protocol: r.protocol,
        dns_lookup: r.dnsLookup,
        tcp_connect: r.tcpConnect,
        ssl_time: r.sslTime,
        ttfb: r.ttfb,
        content_download: r.contentDownload,
        cache_hit: r.cacheHit,
      })),
      session_id: this.config.getSessionId(),
      page_url: getPageUrl(),
    };

    const url = buildUrl(this.config.url, '/rum/resources');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.appKey,
      this.config.apiVersion
    );

    await send({
      url,
      headers,
      data: payload,
      useBeacon,
    });

    // Clear sent resources
    this.resources = [];
  }
}
