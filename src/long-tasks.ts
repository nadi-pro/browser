import type { LongTaskEntry, LongTasksPayload } from './types';
import { send, createHeaders, buildUrl } from './transport';
import { getPageUrl } from './utils';

/**
 * Long tasks collector for tracking JS tasks blocking main thread
 */
export class LongTaskCollector {
  private tasks: LongTaskEntry[] = [];
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
      thresholdMs: config.thresholdMs ?? 50,
      getSessionId: config.getSessionId,
    };
  }

  /**
   * Start collecting long tasks
   */
  start(): void {
    if (this.enabled || typeof window === 'undefined') return;
    if (typeof PerformanceObserver === 'undefined') return;

    this.enabled = true;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleEntry(entry as PerformanceLongTaskTiming);
        }
      });

      this.observer.observe({ type: 'longtask', buffered: true });
    } catch {
      // Long task observer not supported
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
   * Force send tasks immediately
   */
  async flush(): Promise<void> {
    if (this.tasks.length === 0) return;
    await this.sendTasks();
    this.tasks = [];
  }

  /**
   * Get collected tasks
   */
  getTasks(): LongTaskEntry[] {
    return [...this.tasks];
  }

  /**
   * Handle a long task entry
   */
  private handleEntry(entry: PerformanceLongTaskTiming): void {
    if (!this.enabled) return;

    // Only track tasks that exceed threshold
    if (entry.duration < this.config.thresholdMs) return;

    // Get attribution info if available
    const attribution = entry.attribution?.[0];

    const task: LongTaskEntry = {
      startTime: entry.startTime,
      duration: entry.duration,
      attributionName: attribution?.name || undefined,
      attributionType: attribution?.entryType || undefined,
      containerType: attribution?.containerType || undefined,
      containerName: attribution?.containerName || undefined,
    };

    this.tasks.push(task);
  }

  /**
   * Setup sending on page unload
   */
  private setupSendOnUnload(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendTasks(true);
      }
    });

    window.addEventListener('pagehide', () => {
      this.sendTasks(true);
    });
  }

  /**
   * Send tasks to server
   */
  private async sendTasks(useBeacon: boolean = false): Promise<void> {
    if (this.tasks.length === 0) return;

    const payload: LongTasksPayload = {
      tasks: this.tasks.map((t) => ({
        start_time: t.startTime,
        duration: t.duration,
        attribution_name: t.attributionName,
        attribution_type: t.attributionType,
        container_type: t.containerType,
        container_name: t.containerName,
      })),
      session_id: this.config.getSessionId(),
      page_url: getPageUrl(),
    };

    const url = buildUrl(this.config.url, '/rum/long-tasks');
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

    // Clear sent tasks
    this.tasks = [];
  }
}

/**
 * Extended PerformanceLongTaskTiming interface
 */
interface PerformanceLongTaskTiming extends PerformanceEntry {
  attribution?: Array<{
    name?: string;
    entryType?: string;
    containerType?: string;
    containerName?: string;
    containerSrc?: string;
    containerId?: string;
  }>;
}
