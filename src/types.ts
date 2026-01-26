/**
 * Nadi SDK Configuration
 */
export interface NadiConfig {
  /** Nadi API endpoint URL */
  url: string;
  /** Sanctum personal access token for authentication */
  apiKey: string;
  /** Application identifier token from Nadi dashboard */
  token: string;
  /** API version (default: 'v1') */
  apiVersion?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Auto-start session tracking */
  autoSession?: boolean;
  /** Auto-capture Web Vitals */
  autoVitals?: boolean;
  /** Auto-capture JS errors */
  autoErrors?: boolean;
  /** Auto-capture breadcrumbs */
  autoBreadcrumbs?: boolean;
  /** Maximum breadcrumbs to keep */
  maxBreadcrumbs?: number;
  /** Session timeout in minutes */
  sessionTimeout?: number;
  /** Release version for tracking */
  release?: string;
  /** Environment (production, staging, development) */
  environment?: string;
  /** Sample rate for Web Vitals (0-1) */
  sampleRate?: number;
}

/**
 * Breadcrumb types
 */
export type BreadcrumbType =
  | 'click'
  | 'navigation'
  | 'console'
  | 'fetch'
  | 'xhr'
  | 'error'
  | 'custom';

/**
 * Breadcrumb entry
 */
export interface Breadcrumb {
  type: BreadcrumbType;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Device information
 */
export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  connectionType?: string;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Session data
 */
export interface SessionData {
  sessionId: string;
  userId?: string;
  deviceId?: string;
  startedAt: number;
  lastActivityAt: number;
  releaseVersion?: string;
  environment?: string;
  deviceInfo: DeviceInfo;
}

/**
 * Web Vital metric
 */
export interface VitalMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'FID';
  value: number;
  delta?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Web Vitals payload
 */
export interface VitalsPayload {
  metrics: VitalMetric[];
  sessionId?: string;
  pageUrl: string;
  route?: string;
  deviceInfo?: Partial<DeviceInfo>;
  countryCode?: string;
}

/**
 * Error payload
 */
export interface ErrorPayload {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  type?: string;
  sessionId?: string;
  pageUrl: string;
  userAgent: string;
  breadcrumbs: Breadcrumb[];
}

/**
 * Transport options
 */
export interface TransportOptions {
  url: string;
  headers: Record<string, string>;
  data: unknown;
  useBeacon?: boolean;
}
