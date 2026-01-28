/**
 * Trace context for distributed tracing
 */
export interface TraceContext {
  /** 32 hex character trace ID */
  traceId: string;
  /** 16 hex character span ID */
  spanId: string;
  /** Whether the trace is sampled */
  sampled: boolean;
  /** Trace state (vendor-specific key-value pairs) */
  traceState?: string;
}

/**
 * Correlated request for linking frontend events to backend traces
 */
export interface CorrelatedRequest {
  /** Trace ID from the request */
  traceId: string;
  /** Span ID from the request */
  spanId: string;
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Start time (performance.now()) */
  startTime: number;
  /** End time (performance.now()) */
  endTime: number;
  /** HTTP status code */
  status: number;
  /** Request duration in ms */
  duration: number;
}

/**
 * Sampling rule for advanced sampling
 */
export interface SamplingRuleConfig {
  /** Rule name */
  name: string;
  /** Sample rate (0-1) */
  rate: number;
  /** Priority (higher = evaluated first) */
  priority: number;
  /** Conditions for rule matching */
  conditions?: {
    routes?: string[];
    deviceTypes?: string[];
    connectionTypes?: string[];
  };
}

/**
 * Nadi SDK Configuration
 */
export interface NadiConfig {
  /** Nadi API endpoint URL */
  url: string;
  /** Sanctum personal access token for authentication */
  apiKey: string;
  /** Application token from Nadi dashboard (for Nadi-App-Token header) */
  appKey: string;
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

  // Phase 1: Essential Features
  /** Enable resource timing tracking (default: true) */
  resourceTracking?: boolean;
  /** Resource duration threshold in ms (default: 500) */
  resourceThresholdMs?: number;
  /** Enable long task tracking (default: true) */
  longTaskTracking?: boolean;
  /** Long task duration threshold in ms (default: 50) */
  longTaskThresholdMs?: number;

  // Phase 2: Advanced Features
  /** Enable rage click detection (default: true) */
  rageClickDetection?: boolean;
  /** Minimum clicks to trigger rage click (default: 3) */
  rageClickThreshold?: number;
  /** Time window for rage click detection in ms (default: 1000) */
  rageClickWindowMs?: number;
  /** Enable network request tracking (default: true) */
  networkRequestTracking?: boolean;
  /** Network request duration threshold in ms (default: 1000) */
  networkRequestThresholdMs?: number;
  /** Enable memory tracking - Chrome only (default: false) */
  memoryTracking?: boolean;
  /** Memory sample interval in ms (default: 30000) */
  memorySampleIntervalMs?: number;
  /** Enable scroll depth tracking (default: false) */
  scrollDepthTracking?: boolean;
  /** First-party domains for attribution */
  firstPartyDomains?: string[];
  /** Enable page load waterfall tracking (default: true) */
  pageLoadTracking?: boolean;

  // Phase 3: Distributed Tracing
  /** Enable distributed tracing (default: false) */
  tracingEnabled?: boolean;
  /** URLs/patterns to propagate trace headers to */
  propagateTraceUrls?: (string | RegExp)[];
  /** Custom trace state to include */
  traceState?: string;

  // Phase 3: Privacy & Data Masking
  /** Enable privacy masking (default: true) */
  privacyEnabled?: boolean;
  /** URL parameters to always mask */
  sensitiveUrlParams?: string[];
  /** Masking strategy: redact, partial, or hash */
  maskingStrategy?: 'redact' | 'partial' | 'hash';
  /** Custom PII patterns to detect */
  customPIIPatterns?: Record<string, RegExp>;
  /** Fields to always mask in objects */
  sensitiveFields?: string[];

  // Phase 3: Advanced Sampling
  /** Custom sampling rules */
  samplingRules?: SamplingRuleConfig[];
  /** Always sample sessions with errors (default: true) */
  alwaysSampleErrors?: boolean;
  /** Always sample slow sessions (default: true) */
  alwaysSampleSlowSessions?: boolean;
  /** Threshold in ms to consider a session slow (default: 5000) */
  slowSessionThresholdMs?: number;
  /** Enable adaptive sampling based on error rate */
  adaptiveSampling?: boolean;
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
  /** Trace ID for distributed tracing */
  traceId?: string;
  /** Span ID for distributed tracing */
  spanId?: string;
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
  /** Runtime environment (javascript, nodejs, etc.) */
  runtime?: string;
  sessionId?: string;
  pageUrl: string;
  userAgent: string;
  breadcrumbs: Breadcrumb[];
  /** Trace ID for distributed tracing */
  traceId?: string;
  /** Span ID for distributed tracing */
  spanId?: string;
  /** Release version for source map resolution */
  release?: string;
  /** Correlated API requests that preceded this error */
  correlatedRequests?: CorrelatedRequest[];
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

/**
 * Resource timing entry
 */
export interface ResourceEntry {
  url: string;
  initiatorType: string;
  duration: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  protocol?: string;
  dnsLookup?: number;
  tcpConnect?: number;
  sslTime?: number;
  ttfb?: number;
  contentDownload?: number;
  cacheHit?: boolean;
}

/**
 * Resource timing payload
 */
export interface ResourcePayload {
  resources: Array<{
    url: string;
    initiator_type: string;
    duration: number;
    transfer_size?: number;
    encoded_body_size?: number;
    decoded_body_size?: number;
    protocol?: string;
    dns_lookup?: number;
    tcp_connect?: number;
    ssl_time?: number;
    ttfb?: number;
    content_download?: number;
    cache_hit?: boolean;
  }>;
  session_id?: string;
  page_url?: string;
  /** Trace ID for distributed tracing */
  trace_id?: string;
  /** Span ID for distributed tracing */
  span_id?: string;
}

/**
 * Long task entry
 */
export interface LongTaskEntry {
  startTime: number;
  duration: number;
  attributionName?: string;
  attributionType?: string;
  containerType?: string;
  containerName?: string;
}

/**
 * Long tasks payload
 */
export interface LongTasksPayload {
  tasks: Array<{
    start_time: number;
    duration: number;
    attribution_name?: string;
    attribution_type?: string;
    container_type?: string;
    container_name?: string;
  }>;
  session_id?: string;
  page_url?: string;
}

/**
 * Custom event entry
 */
export interface CustomEventEntry {
  name: string;
  category?: string;
  value?: number;
  duration?: number;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

/**
 * Custom events payload
 */
export interface CustomEventsPayload {
  events: CustomEventEntry[];
  session_id?: string;
  page_url?: string;
}

/**
 * Rage click entry
 */
export interface RageClickEntry {
  selector?: string;
  tagName?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  clickCount: number;
  windowMs: number;
  xPosition?: number;
  yPosition?: number;
}

/**
 * Rage clicks payload
 */
export interface RageClicksPayload {
  clicks: Array<{
    selector?: string;
    tag_name?: string;
    element_id?: string;
    element_class?: string;
    element_text?: string;
    click_count: number;
    window_ms: number;
    x_position?: number;
    y_position?: number;
  }>;
  session_id?: string;
  page_url?: string;
}

/**
 * Network request entry
 */
export interface NetworkRequestEntry {
  url: string;
  method: string;
  statusCode?: number;
  duration: number;
  ttfb?: number;
  requestSize?: number;
  responseSize?: number;
  contentType?: string;
  isError?: boolean;
  errorMessage?: string;
  isFirstParty?: boolean;
}

/**
 * Network requests payload
 */
export interface NetworkRequestsPayload {
  requests: Array<{
    url: string;
    method: string;
    status_code?: number;
    duration: number;
    ttfb?: number;
    request_size?: number;
    response_size?: number;
    content_type?: string;
    is_error?: boolean;
    error_message?: string;
    is_first_party?: boolean;
    /** Trace ID from request/response headers */
    trace_id?: string;
    /** Span ID from request/response headers */
    span_id?: string;
  }>;
  session_id?: string;
  page_url?: string;
  /** Trace ID for distributed tracing */
  trace_id?: string;
  /** Span ID for distributed tracing */
  span_id?: string;
}

/**
 * Page load entry
 */
export interface PageLoadEntry {
  navigationType?: string;
  dnsLookup?: number;
  tcpConnect?: number;
  sslTime?: number;
  ttfb?: number;
  responseTime?: number;
  domInteractive?: number;
  domContentLoaded?: number;
  domComplete?: number;
  loadEvent?: number;
  totalLoadTime?: number;
  resourceCount?: number;
  scriptCount?: number;
  stylesheetCount?: number;
  imageCount?: number;
  totalTransferSize?: number;
  deviceType?: string;
  connectionType?: string;
}

/**
 * Page load payload
 */
export interface PageLoadPayload {
  navigation_type?: string;
  dns_lookup?: number;
  tcp_connect?: number;
  ssl_time?: number;
  ttfb?: number;
  response_time?: number;
  dom_interactive?: number;
  dom_content_loaded?: number;
  dom_complete?: number;
  load_event?: number;
  total_load_time?: number;
  resource_count?: number;
  script_count?: number;
  stylesheet_count?: number;
  image_count?: number;
  total_transfer_size?: number;
  device_type?: string;
  connection_type?: string;
  session_id?: string;
  page_url?: string;
  /** Trace ID for distributed tracing */
  trace_id?: string;
  /** Span ID for distributed tracing */
  span_id?: string;
}

/**
 * Memory sample entry
 */
export interface MemorySampleEntry {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  heapUsagePercent?: number;
  sampleIndex?: number;
}

/**
 * Memory samples payload
 */
export interface MemorySamplesPayload {
  samples: Array<{
    used_js_heap_size?: number;
    total_js_heap_size?: number;
    js_heap_size_limit?: number;
    heap_usage_percent?: number;
    sample_index?: number;
  }>;
  session_id?: string;
  page_url?: string;
}

/**
 * User interaction types
 */
export type InteractionType = 'scroll' | 'form' | 'visibility';

/**
 * User interaction entry
 */
export interface UserInteractionEntry {
  type: InteractionType;
  maxScrollDepth?: number;
  scrollDistancePx?: number;
  formId?: string;
  formName?: string;
  formInteractionTime?: number;
  formSubmitted?: boolean;
  formFieldCount?: number;
  elementSelector?: string;
  timeToVisible?: number;
  timeVisible?: number;
  visibilityPercent?: number;
  metadata?: Record<string, unknown>;
}

/**
 * User interactions payload
 */
export interface UserInteractionsPayload {
  interactions: Array<{
    type: InteractionType;
    max_scroll_depth?: number;
    scroll_distance_px?: number;
    form_id?: string;
    form_name?: string;
    form_interaction_time?: number;
    form_submitted?: boolean;
    form_field_count?: number;
    element_selector?: string;
    time_to_visible?: number;
    time_visible?: number;
    visibility_percent?: number;
    metadata?: Record<string, unknown>;
  }>;
  session_id?: string;
  page_url?: string;
}
