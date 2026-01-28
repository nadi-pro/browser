# Types

TypeScript type definitions exported by the SDK.

## NadiConfig

Configuration for initializing the SDK.

```typescript
interface NadiConfig {
  /** Nadi API endpoint URL */
  url: string;

  /** Sanctum personal access token for authentication */
  apiKey: string;

  /** Application token from Nadi dashboard (for Nadi-App-Token header) */
  appKey: string;

  /** API version (default: 'v1') */
  apiVersion?: string;

  /** Enable debug logging (default: false) */
  debug?: boolean;

  /** Auto-start session tracking (default: true) */
  autoSession?: boolean;

  /** Auto-capture Web Vitals (default: true) */
  autoVitals?: boolean;

  /** Auto-capture JS errors (default: true) */
  autoErrors?: boolean;

  /** Auto-capture breadcrumbs (default: true) */
  autoBreadcrumbs?: boolean;

  /** Maximum breadcrumbs to keep (default: 50) */
  maxBreadcrumbs?: number;

  /** Session timeout in minutes (default: 30) */
  sessionTimeout?: number;

  /** Release version for tracking */
  release?: string;

  /** Environment (default: 'production') */
  environment?: string;

  /** Sample rate for Web Vitals (0-1, default: 1.0) */
  sampleRate?: number;

  // Performance tracking
  /** Enable resource timing tracking (default: true) */
  resourceTracking?: boolean;
  /** Resource duration threshold in ms (default: 500) */
  resourceThresholdMs?: number;
  /** Enable long task tracking (default: true) */
  longTaskTracking?: boolean;
  /** Long task duration threshold in ms (default: 50) */
  longTaskThresholdMs?: number;
  /** Enable page load waterfall tracking (default: true) */
  pageLoadTracking?: boolean;

  // User behavior tracking
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

  // Distributed tracing
  /** Enable distributed tracing (default: false) */
  tracingEnabled?: boolean;
  /** URLs/patterns to propagate trace headers to */
  propagateTraceUrls?: (string | RegExp)[];
  /** Custom trace state to include */
  traceState?: string;

  // Privacy & data masking
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

  // Advanced sampling
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
```

---

## BreadcrumbType

Union type for breadcrumb categories.

```typescript
type BreadcrumbType =
  | 'click'
  | 'navigation'
  | 'console'
  | 'fetch'
  | 'xhr'
  | 'error'
  | 'custom';
```

| Type | Description |
|------|-------------|
| `'click'` | User click events |
| `'navigation'` | Route/page changes |
| `'console'` | Console output |
| `'fetch'` | Fetch API requests |
| `'xhr'` | XMLHttpRequest requests |
| `'error'` | Error occurred |
| `'custom'` | Custom breadcrumbs |

---

## Breadcrumb

A single breadcrumb entry.

```typescript
interface Breadcrumb {
  type: BreadcrumbType;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}
```

---

## DeviceInfo

Device and browser information.

```typescript
interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  connectionType?: string;
  screenWidth?: number;
  screenHeight?: number;
}
```

---

## SessionData

Current session information.

```typescript
interface SessionData {
  sessionId: string;
  userId?: string;
  deviceId?: string;
  startedAt: number;
  lastActivityAt: number;
  releaseVersion?: string;
  environment?: string;
  deviceInfo: DeviceInfo;
}
```

---

## VitalMetric

A Core Web Vital measurement.

```typescript
interface VitalMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'FID';
  value: number;
  delta?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}
```

---

## TraceContext

Distributed tracing context.

```typescript
interface TraceContext {
  /** 32 hex character trace ID */
  traceId: string;
  /** 16 hex character span ID */
  spanId: string;
  /** Whether the trace is sampled */
  sampled: boolean;
  /** Trace state (vendor-specific key-value pairs) */
  traceState?: string;
}
```

---

## CorrelatedRequest

Request linked to a trace for error correlation.

```typescript
interface CorrelatedRequest {
  traceId: string;
  spanId: string;
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  status: number;
  duration: number;
}
```

---

## SamplingRuleConfig

Custom sampling rule configuration.

```typescript
interface SamplingRuleConfig {
  name: string;
  rate: number;
  priority: number;
  conditions?: {
    routes?: string[];
    deviceTypes?: string[];
    connectionTypes?: string[];
  };
}
```

---

## ResourceEntry

Resource timing entry.

```typescript
interface ResourceEntry {
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
```

---

## LongTaskEntry

Long task detection entry.

```typescript
interface LongTaskEntry {
  startTime: number;
  duration: number;
  attributionName?: string;
  attributionType?: string;
  containerType?: string;
  containerName?: string;
}
```

---

## PageLoadEntry

Page load timing entry.

```typescript
interface PageLoadEntry {
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
```

---

## RageClickEntry

Rage click detection entry.

```typescript
interface RageClickEntry {
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
```

---

## NetworkRequestEntry

Network request tracking entry.

```typescript
interface NetworkRequestEntry {
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
```

---

## MemorySampleEntry

Memory monitoring entry (Chrome only).

```typescript
interface MemorySampleEntry {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  heapUsagePercent?: number;
  sampleIndex?: number;
}
```

---

## CustomEventEntry

Custom event entry.

```typescript
interface CustomEventEntry {
  name: string;
  category?: string;
  value?: number;
  duration?: number;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}
```

---

## InteractionType

User interaction type.

```typescript
type InteractionType = 'scroll' | 'form' | 'visibility';
```

---

## UserInteractionEntry

User interaction tracking entry.

```typescript
interface UserInteractionEntry {
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
```

---

## Payload Types

### VitalsPayload

```typescript
interface VitalsPayload {
  metrics: VitalMetric[];
  sessionId?: string;
  pageUrl: string;
  route?: string;
  deviceInfo?: Partial<DeviceInfo>;
  countryCode?: string;
  traceId?: string;
  spanId?: string;
}
```

### ErrorPayload

```typescript
interface ErrorPayload {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  type?: string;
  runtime?: string;
  sessionId?: string;
  pageUrl: string;
  userAgent: string;
  breadcrumbs: Breadcrumb[];
  traceId?: string;
  spanId?: string;
  release?: string;
  correlatedRequests?: CorrelatedRequest[];
}
```

---

## Importing Types

```typescript
import type {
  NadiConfig,
  Breadcrumb,
  BreadcrumbType,
  SessionData,
  VitalMetric,
  DeviceInfo,
  TraceContext,
  CorrelatedRequest,
  SamplingRuleConfig,
  ResourceEntry,
  LongTaskEntry,
  PageLoadEntry,
  RageClickEntry,
  NetworkRequestEntry,
  MemorySampleEntry,
  CustomEventEntry,
  InteractionType,
  UserInteractionEntry,
  ErrorPayload,
  VitalsPayload,
} from '@nadi-pro/browser';
```

## Next Steps

- [Utilities](03-utilities.md) - Utility functions
- [Nadi Class](01-nadi-class.md) - Main API
