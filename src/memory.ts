import type { MemorySampleEntry, MemorySamplesPayload } from './types';
import { send, createHeaders, buildUrl } from './transport';
import { getPageUrl } from './utils';

/**
 * Memory collector for tracking JS heap usage (Chrome only)
 */
export class MemoryCollector {
  private samples: MemorySampleEntry[] = [];
  private enabled: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sampleIndex: number = 0;
  private config: {
    url: string;
    apiKey: string;
    appKey: string;
    apiVersion: string;
    sampleIntervalMs: number;
    getSessionId: () => string | undefined;
  };

  constructor(config: {
    url: string;
    apiKey: string;
    appKey: string;
    apiVersion?: string;
    sampleIntervalMs?: number;
    getSessionId: () => string | undefined;
  }) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      appKey: config.appKey,
      apiVersion: config.apiVersion || 'v1',
      sampleIntervalMs: config.sampleIntervalMs ?? 30000,
      getSessionId: config.getSessionId,
    };
  }

  /**
   * Check if memory API is available (Chrome only)
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (performance as PerformanceWithMemory).memory !== 'undefined'
    );
  }

  /**
   * Start collecting memory samples
   */
  start(): void {
    if (this.enabled || !MemoryCollector.isSupported()) return;

    this.enabled = true;
    this.sampleIndex = 0;

    // Take initial sample
    this.takeSample();

    // Setup interval for periodic sampling
    this.intervalId = setInterval(() => {
      this.takeSample();
    }, this.config.sampleIntervalMs);

    // Send on page hide/unload
    this.setupSendOnUnload();
  }

  /**
   * Stop collecting
   */
  stop(): void {
    this.enabled = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Force send samples immediately
   */
  async flush(): Promise<void> {
    if (this.samples.length === 0) return;
    await this.sendSamples();
    this.samples = [];
  }

  /**
   * Get collected samples
   */
  getSamples(): MemorySampleEntry[] {
    return [...this.samples];
  }

  /**
   * Take a memory sample
   */
  private takeSample(): void {
    if (!this.enabled || !MemoryCollector.isSupported()) return;

    const memory = (performance as PerformanceWithMemory).memory;
    if (!memory) return;

    const usedHeap = memory.usedJSHeapSize;
    const totalHeap = memory.totalJSHeapSize;
    const heapLimit = memory.jsHeapSizeLimit;

    const sample: MemorySampleEntry = {
      usedJSHeapSize: usedHeap,
      totalJSHeapSize: totalHeap,
      jsHeapSizeLimit: heapLimit,
      heapUsagePercent: heapLimit > 0 ? (usedHeap / heapLimit) * 100 : undefined,
      sampleIndex: this.sampleIndex++,
    };

    this.samples.push(sample);

    // Keep only last 100 samples to prevent memory issues
    if (this.samples.length > 100) {
      this.samples.shift();
    }
  }

  /**
   * Setup sending on page unload
   */
  private setupSendOnUnload(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendSamples(true);
      }
    });

    window.addEventListener('pagehide', () => {
      this.sendSamples(true);
    });
  }

  /**
   * Send samples to server
   */
  private async sendSamples(useBeacon: boolean = false): Promise<void> {
    if (this.samples.length === 0) return;

    const payload: MemorySamplesPayload = {
      samples: this.samples.map((s) => ({
        used_js_heap_size: s.usedJSHeapSize,
        total_js_heap_size: s.totalJSHeapSize,
        js_heap_size_limit: s.jsHeapSizeLimit,
        heap_usage_percent: s.heapUsagePercent,
        sample_index: s.sampleIndex,
      })),
      session_id: this.config.getSessionId(),
      page_url: getPageUrl(),
    };

    const url = buildUrl(this.config.url, '/rum/memory');
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

    // Clear sent samples
    this.samples = [];
  }
}

/**
 * Extended Performance interface with memory property
 */
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}
