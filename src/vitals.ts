import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import type { VitalMetric, VitalsPayload, DeviceInfo } from './types';
import { send, createHeaders, buildUrl } from './transport';
import { getPageUrl, getRoutePattern, getDeviceInfo, shouldSample } from './utils';

/**
 * Web Vitals collector
 */
export class VitalsCollector {
  private metrics: VitalMetric[] = [];
  private enabled: boolean = false;
  private sent: boolean = false;
  private config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion: string;
    sampleRate: number;
    getSessionId: () => string | undefined;
  };

  constructor(config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion?: string;
    sampleRate?: number;
    getSessionId: () => string | undefined;
  }) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      token: config.token,
      apiVersion: config.apiVersion || 'v1',
      sampleRate: config.sampleRate ?? 1.0,
      getSessionId: config.getSessionId,
    };
  }

  /**
   * Start collecting Web Vitals
   */
  start(): void {
    if (this.enabled || typeof window === 'undefined') return;

    // Check sample rate
    if (!shouldSample(this.config.sampleRate)) {
      return;
    }

    this.enabled = true;

    // Collect all Core Web Vitals
    onLCP((metric) => this.handleMetric(metric));
    onINP((metric) => this.handleMetric(metric));
    onCLS((metric) => this.handleMetric(metric));
    onFCP((metric) => this.handleMetric(metric));
    onTTFB((metric) => this.handleMetric(metric));

    // Send on page hide/unload
    this.setupSendOnUnload();
  }

  /**
   * Stop collecting (metrics already collected will still be sent)
   */
  stop(): void {
    this.enabled = false;
  }

  /**
   * Force send metrics immediately
   */
  async flush(): Promise<void> {
    if (this.metrics.length === 0 || this.sent) return;

    this.sent = true;
    await this.sendMetrics();
  }

  /**
   * Get collected metrics
   */
  getMetrics(): VitalMetric[] {
    return [...this.metrics];
  }

  /**
   * Handle a metric from web-vitals library
   */
  private handleMetric(metric: Metric): void {
    if (!this.enabled) return;

    const vitalMetric: VitalMetric = {
      name: metric.name as VitalMetric['name'],
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating,
    };

    // Update or add metric
    const existingIndex = this.metrics.findIndex((m) => m.name === metric.name);
    if (existingIndex >= 0) {
      this.metrics[existingIndex] = vitalMetric;
    } else {
      this.metrics.push(vitalMetric);
    }
  }

  /**
   * Setup sending metrics on page unload
   */
  private setupSendOnUnload(): void {
    // Use visibilitychange as primary (more reliable)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && !this.sent) {
        this.sent = true;
        this.sendMetrics(true);
      }
    });

    // Fallback for older browsers
    window.addEventListener('pagehide', () => {
      if (!this.sent) {
        this.sent = true;
        this.sendMetrics(true);
      }
    });
  }

  /**
   * Send metrics to server
   */
  private async sendMetrics(useBeacon: boolean = false): Promise<void> {
    if (this.metrics.length === 0) return;

    const deviceInfo = getDeviceInfo();
    const payload: VitalsPayload = {
      metrics: this.metrics,
      sessionId: this.config.getSessionId(),
      pageUrl: getPageUrl(),
      route: getRoutePattern(),
      deviceInfo: this.formatDeviceInfo(deviceInfo),
    };

    const url = buildUrl(this.config.url, '/api/rum/vitals');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({
      url,
      headers,
      data: payload,
      useBeacon,
    });
  }

  /**
   * Format device info for API
   */
  private formatDeviceInfo(
    info: DeviceInfo
  ): Partial<DeviceInfo> {
    return {
      browser: info.browser,
      browserVersion: info.browserVersion,
      os: info.os,
      osVersion: info.osVersion,
      deviceType: info.deviceType,
      connectionType: info.connectionType,
    };
  }
}

/**
 * Get rating thresholds for each metric
 */
export function getMetricThresholds(metricName: string): { good: number; poor: number } {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    INP: { good: 200, poor: 500 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    FID: { good: 100, poor: 300 }, // Deprecated but included for compatibility
  };

  return thresholds[metricName] || { good: 0, poor: Infinity };
}

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const { good, poor } = getMetricThresholds(metricName);

  if (value <= good) return 'good';
  if (value > poor) return 'poor';
  return 'needs-improvement';
}
