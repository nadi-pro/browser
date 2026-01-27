import type { PageLoadEntry, PageLoadPayload } from './types';
import { send, createHeaders, buildUrl } from './transport';
import { getPageUrl, getDeviceInfo, getConnectionType } from './utils';

/**
 * Page load collector for tracking full page load waterfall
 */
export class PageLoadCollector {
  private sent: boolean = false;
  private enabled: boolean = false;
  private config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion: string;
    getSessionId: () => string | undefined;
  };

  constructor(config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion?: string;
    getSessionId: () => string | undefined;
  }) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      token: config.token,
      apiVersion: config.apiVersion || 'v1',
      getSessionId: config.getSessionId,
    };
  }

  /**
   * Start collecting page load data
   */
  start(): void {
    if (this.enabled || typeof window === 'undefined') return;
    this.enabled = true;

    // Wait for load event to get complete timing
    if (document.readyState === 'complete') {
      this.collectAndSend();
    } else {
      window.addEventListener('load', () => {
        // Wait a bit for all resources to finish loading
        setTimeout(() => this.collectAndSend(), 100);
      });
    }
  }

  /**
   * Stop collecting
   */
  stop(): void {
    this.enabled = false;
  }

  /**
   * Force send page load data
   */
  async flush(): Promise<void> {
    if (!this.sent) {
      await this.collectAndSend();
    }
  }

  /**
   * Collect and send page load data
   */
  private async collectAndSend(): Promise<void> {
    if (this.sent || !this.enabled) return;
    this.sent = true;

    const entry = this.collectPageLoad();
    if (!entry) return;

    await this.sendPageLoad(entry);
  }

  /**
   * Collect page load timing data
   */
  private collectPageLoad(): PageLoadEntry | null {
    if (typeof performance === 'undefined') return null;

    const navEntries = performance.getEntriesByType('navigation');
    if (!navEntries.length) return null;

    const nav = navEntries[0] as PerformanceNavigationTiming;
    const deviceInfo = getDeviceInfo();

    // Count resources by type
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const resourceCounts = this.countResources(resources);

    const entry: PageLoadEntry = {
      navigationType: this.getNavigationType(nav.type),
      dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
      tcpConnect: nav.connectEnd - nav.connectStart,
      sslTime:
        nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : undefined,
      ttfb: nav.responseStart - nav.requestStart,
      responseTime: nav.responseEnd - nav.responseStart,
      domInteractive: nav.domInteractive - nav.fetchStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
      domComplete: nav.domComplete - nav.fetchStart,
      loadEvent: nav.loadEventEnd - nav.fetchStart,
      totalLoadTime: nav.loadEventEnd - nav.fetchStart,
      resourceCount: resources.length,
      scriptCount: resourceCounts.script,
      stylesheetCount: resourceCounts.css,
      imageCount: resourceCounts.img,
      totalTransferSize: this.getTotalTransferSize(resources),
      deviceType: deviceInfo.deviceType,
      connectionType: getConnectionType(),
    };

    return entry;
  }

  /**
   * Get navigation type string
   */
  private getNavigationType(
    type: NavigationTimingType | undefined
  ): string {
    const typeMap: Record<string, string> = {
      navigate: 'navigate',
      reload: 'reload',
      back_forward: 'back_forward',
      prerender: 'prerender',
    };
    return typeMap[type || ''] || 'navigate';
  }

  /**
   * Count resources by type
   */
  private countResources(
    resources: PerformanceResourceTiming[]
  ): Record<string, number> {
    const counts: Record<string, number> = {
      script: 0,
      css: 0,
      img: 0,
    };

    for (const resource of resources) {
      if (resource.initiatorType === 'script') {
        counts.script++;
      } else if (
        resource.initiatorType === 'link' &&
        resource.name.includes('.css')
      ) {
        counts.css++;
      } else if (
        resource.initiatorType === 'img' ||
        resource.initiatorType === 'image'
      ) {
        counts.img++;
      }
    }

    return counts;
  }

  /**
   * Get total transfer size
   */
  private getTotalTransferSize(resources: PerformanceResourceTiming[]): number {
    return resources.reduce((total, r) => total + (r.transferSize || 0), 0);
  }

  /**
   * Send page load data to server
   */
  private async sendPageLoad(entry: PageLoadEntry): Promise<void> {
    const payload: PageLoadPayload = {
      navigation_type: entry.navigationType,
      dns_lookup: entry.dnsLookup,
      tcp_connect: entry.tcpConnect,
      ssl_time: entry.sslTime,
      ttfb: entry.ttfb,
      response_time: entry.responseTime,
      dom_interactive: entry.domInteractive,
      dom_content_loaded: entry.domContentLoaded,
      dom_complete: entry.domComplete,
      load_event: entry.loadEvent,
      total_load_time: entry.totalLoadTime,
      resource_count: entry.resourceCount,
      script_count: entry.scriptCount,
      stylesheet_count: entry.stylesheetCount,
      image_count: entry.imageCount,
      total_transfer_size: entry.totalTransferSize,
      device_type: entry.deviceType,
      connection_type: entry.connectionType,
      session_id: this.config.getSessionId(),
      page_url: getPageUrl(),
    };

    const url = buildUrl(this.config.url, '/rum/pageloads');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({
      url,
      headers,
      data: payload,
    });
  }
}
