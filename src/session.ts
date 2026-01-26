import type { SessionData, DeviceInfo } from './types';
import { generateSessionId, getDeviceId, getDeviceInfo } from './utils';
import { send, createHeaders, buildUrl } from './transport';

/**
 * Session manager for tracking user sessions
 */
export class SessionManager {
  private session: SessionData | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion: string;
    timeout: number;
    release?: string;
    environment?: string;
  };

  constructor(config: {
    url: string;
    apiKey: string;
    token: string;
    apiVersion?: string;
    timeout?: number;
    release?: string;
    environment?: string;
  }) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey,
      token: config.token,
      apiVersion: config.apiVersion || 'v1',
      timeout: (config.timeout || 30) * 60 * 1000, // Convert minutes to ms
      release: config.release,
      environment: config.environment,
    };
  }

  /**
   * Start a new session
   */
  async start(userId?: string): Promise<SessionData> {
    // End existing session if any
    if (this.session) {
      await this.end();
    }

    const deviceInfo = getDeviceInfo();
    const now = Date.now();

    this.session = {
      sessionId: generateSessionId(),
      userId,
      deviceId: getDeviceId(),
      startedAt: now,
      lastActivityAt: now,
      releaseVersion: this.config.release,
      environment: this.config.environment,
      deviceInfo,
    };

    // Send session start to server
    await this.sendSessionStart();

    // Setup activity tracking
    this.setupActivityTracking();

    // Setup page unload handler
    this.setupUnloadHandler();

    return this.session;
  }

  /**
   * End the current session
   */
  async end(): Promise<void> {
    if (!this.session) return;

    this.clearTimeout();
    await this.sendSessionEnd();
    this.session = null;
  }

  /**
   * Report a crash and end the session
   */
  async crash(): Promise<void> {
    if (!this.session) return;

    this.clearTimeout();
    await this.sendSessionCrash();
    this.session = null;
  }

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | undefined {
    return this.session?.sessionId;
  }

  /**
   * Update user identifier
   */
  setUserId(userId: string): void {
    if (this.session) {
      this.session.userId = userId;
    }
  }

  /**
   * Record activity to extend session
   */
  recordActivity(): void {
    if (!this.session) return;

    this.session.lastActivityAt = Date.now();
    this.resetTimeout();
  }

  /**
   * Send session start to server
   */
  private async sendSessionStart(): Promise<void> {
    if (!this.session) return;

    const url = buildUrl(this.config.url, '/api/sessions/start');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({
      url,
      headers,
      data: {
        session_id: this.session.sessionId,
        user_identifier: this.session.userId,
        device_id: this.session.deviceId,
        release_version: this.session.releaseVersion,
        environment: this.session.environment,
        device_info: this.formatDeviceInfo(this.session.deviceInfo),
        app_info: {
          version: this.session.releaseVersion,
        },
      },
    });
  }

  /**
   * Send session end to server
   */
  private async sendSessionEnd(): Promise<void> {
    if (!this.session) return;

    const url = buildUrl(this.config.url, '/api/sessions/end');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({
      url,
      headers,
      data: {
        session_id: this.session.sessionId,
      },
      useBeacon: true, // Use beacon for reliability on page unload
    });
  }

  /**
   * Send session crash to server
   */
  private async sendSessionCrash(): Promise<void> {
    if (!this.session) return;

    const url = buildUrl(this.config.url, '/api/sessions/crash');
    const headers = createHeaders(
      this.config.apiKey,
      this.config.token,
      this.config.apiVersion
    );

    await send({
      url,
      headers,
      data: {
        session_id: this.session.sessionId,
      },
      useBeacon: true,
    });
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const recordActivity = () => this.recordActivity();

    events.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    this.resetTimeout();
  }

  /**
   * Setup page unload handler
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.session) {
        this.sendSessionEnd();
      }
    });

    window.addEventListener('pagehide', () => {
      if (this.session) {
        this.sendSessionEnd();
      }
    });
  }

  /**
   * Reset the session timeout
   */
  private resetTimeout(): void {
    this.clearTimeout();

    this.timeoutId = setTimeout(() => {
      this.end();
    }, this.config.timeout);
  }

  /**
   * Clear the session timeout
   */
  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Format device info for API
   */
  private formatDeviceInfo(
    info: DeviceInfo
  ): Record<string, string | number | undefined> {
    return {
      browser: info.browser,
      browser_version: info.browserVersion,
      os: info.os,
      os_version: info.osVersion,
      device_type: info.deviceType,
      connection_type: info.connectionType,
      screen_width: info.screenWidth,
      screen_height: info.screenHeight,
    };
  }
}
