# Types

TypeScript type definitions exported by the SDK.

## NadiConfig

Configuration for initializing the SDK.

```typescript
interface NadiConfig {
  /** Nadi API endpoint URL */
  url: string;

  /** Application token for authentication */
  appToken: string;

  /** Sanctum bearer token */
  bearerToken: string;

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
}
```

**Example:**

```typescript
import { NadiConfig } from '@nadi/browser';

const config: NadiConfig = {
  url: 'https://nadi.example.com',
  appToken: 'app-token',
  bearerToken: 'bearer-token',
  release: '1.0.0',
  environment: 'production',
};
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

**Values:**

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
  /** Breadcrumb type */
  type: BreadcrumbType;

  /** Human-readable message */
  message: string;

  /** Unix timestamp in milliseconds */
  timestamp: number;

  /** Additional contextual data */
  data?: Record<string, unknown>;
}
```

**Example:**

```typescript
import { Breadcrumb } from '@nadi/browser';

const breadcrumb: Breadcrumb = {
  type: 'custom',
  message: 'User clicked checkout',
  timestamp: Date.now(),
  data: {
    cartItems: 3,
    total: 99.99,
  },
};
```

---

## DeviceInfo

Device and browser information.

```typescript
interface DeviceInfo {
  /** Browser name */
  browser: string;

  /** Browser version */
  browserVersion: string;

  /** Operating system */
  os: string;

  /** OS version */
  osVersion: string;

  /** Device category */
  deviceType: 'desktop' | 'mobile' | 'tablet';

  /** Network connection type (if available) */
  connectionType?: string;

  /** Screen width in pixels */
  screenWidth?: number;

  /** Screen height in pixels */
  screenHeight?: number;
}
```

**Example:**

```typescript
import { DeviceInfo, getDeviceInfo } from '@nadi/browser';

const device: DeviceInfo = getDeviceInfo();
// {
//   browser: "Chrome",
//   browserVersion: "120",
//   os: "macOS",
//   osVersion: "14.2",
//   deviceType: "desktop",
//   connectionType: "4g",
//   screenWidth: 1920,
//   screenHeight: 1080
// }
```

---

## SessionData

Current session information.

```typescript
interface SessionData {
  /** Unique session identifier */
  sessionId: string;

  /** User identifier (if set) */
  userId?: string;

  /** Persistent device identifier */
  deviceId?: string;

  /** Session start timestamp */
  startedAt: number;

  /** Last activity timestamp */
  lastActivityAt: number;

  /** Application version */
  releaseVersion?: string;

  /** Environment name */
  environment?: string;

  /** Device information */
  deviceInfo: DeviceInfo;
}
```

**Example:**

```typescript
import Nadi, { SessionData } from '@nadi/browser';

const session: SessionData | null = Nadi.getInstance()?.getSession();
if (session) {
  console.log(`Session: ${session.sessionId}`);
  console.log(`Started: ${new Date(session.startedAt)}`);
}
```

---

## VitalMetric

A Core Web Vital measurement.

```typescript
interface VitalMetric {
  /** Metric name */
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'FID';

  /** Metric value */
  value: number;

  /** Change from previous measurement */
  delta?: number;

  /** Performance rating */
  rating?: 'good' | 'needs-improvement' | 'poor';
}
```

**Example:**

```typescript
import Nadi, { VitalMetric } from '@nadi/browser';

const vitals: VitalMetric[] = Nadi.getInstance()?.getVitals() || [];

vitals.forEach((vital) => {
  console.log(`${vital.name}: ${vital.value}ms (${vital.rating})`);
});
```

---

## VitalsPayload

Payload sent to the server for Web Vitals.

```typescript
interface VitalsPayload {
  /** Array of collected metrics */
  metrics: VitalMetric[];

  /** Session identifier */
  sessionId?: string;

  /** Full page URL */
  pageUrl: string;

  /** Normalized route pattern */
  route?: string;

  /** Device information */
  deviceInfo?: Partial<DeviceInfo>;

  /** User's country code */
  countryCode?: string;
}
```

---

## ErrorPayload

Payload sent to the server for errors.

```typescript
interface ErrorPayload {
  /** Error message */
  message: string;

  /** Stack trace */
  stack?: string;

  /** Source file URL */
  filename?: string;

  /** Line number */
  lineno?: number;

  /** Column number */
  colno?: number;

  /** Error type (e.g., "TypeError") */
  type?: string;

  /** Session identifier */
  sessionId?: string;

  /** Page URL where error occurred */
  pageUrl: string;

  /** Browser user agent string */
  userAgent: string;

  /** Recent user actions */
  breadcrumbs: Breadcrumb[];
}
```

---

## TransportOptions

Options for HTTP transport (internal use).

```typescript
interface TransportOptions {
  /** Target URL */
  url: string;

  /** HTTP headers */
  headers: Record<string, string>;

  /** Request body */
  data: unknown;

  /** Use sendBeacon instead of fetch */
  useBeacon?: boolean;
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
  ErrorPayload,
  VitalsPayload,
} from '@nadi/browser';
```

## Next Steps

- [Utilities](03-utilities.md) - Utility functions
- [Nadi Class](01-nadi-class.md) - Main API
