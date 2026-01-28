# Configuration

Complete reference for all configuration options available when initializing the Nadi SDK.

## Configuration Object

```typescript
interface NadiConfig {
  // Required
  url: string;
  apiKey: string;
  appKey: string;

  // Core Options
  apiVersion?: string;
  debug?: boolean;
  release?: string;
  environment?: string;

  // Auto-tracking Options
  autoSession?: boolean;
  autoVitals?: boolean;
  autoErrors?: boolean;
  autoBreadcrumbs?: boolean;
  maxBreadcrumbs?: number;
  sessionTimeout?: number;
  sampleRate?: number;

  // Performance Tracking
  resourceTracking?: boolean;
  resourceThresholdMs?: number;
  longTaskTracking?: boolean;
  longTaskThresholdMs?: number;
  pageLoadTracking?: boolean;

  // User Behavior Tracking
  rageClickDetection?: boolean;
  rageClickThreshold?: number;
  rageClickWindowMs?: number;
  networkRequestTracking?: boolean;
  networkRequestThresholdMs?: number;
  memoryTracking?: boolean;
  memorySampleIntervalMs?: number;
  scrollDepthTracking?: boolean;
  firstPartyDomains?: string[];

  // Distributed Tracing
  tracingEnabled?: boolean;
  propagateTraceUrls?: (string | RegExp)[];
  traceState?: string;

  // Privacy & Data Masking
  privacyEnabled?: boolean;
  sensitiveUrlParams?: string[];
  maskingStrategy?: 'redact' | 'partial' | 'hash';
  customPIIPatterns?: Record<string, RegExp>;
  sensitiveFields?: string[];

  // Advanced Sampling
  samplingRules?: SamplingRuleConfig[];
  alwaysSampleErrors?: boolean;
  alwaysSampleSlowSessions?: boolean;
  slowSessionThresholdMs?: number;
  adaptiveSampling?: boolean;
}
```

## Required Options

### url

- **Type**: `string`
- **Required**: Yes

The base URL of your Nadi instance.

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  // ...
});
```

### appKey

- **Type**: `string`
- **Required**: Yes

Your application key from the Nadi dashboard. Used to identify which application is sending
data (sent as `Nadi-App-Token` header).

```javascript
Nadi.init({
  appKey: 'your-application-key',
  // ...
});
```

### apiKey

- **Type**: `string`
- **Required**: Yes

Your Sanctum API key for API authentication.

```javascript
Nadi.init({
  apiKey: 'your-sanctum-token',
  // ...
});
```

## Optional Options

### apiVersion

- **Type**: `string`
- **Default**: `'v1'`

The API version to use for requests.

```javascript
Nadi.init({
  apiVersion: 'v1',
  // ...
});
```

### debug

- **Type**: `boolean`
- **Default**: `false`

Enable debug logging to the browser console. Useful during development.

```javascript
Nadi.init({
  debug: process.env.NODE_ENV === 'development',
  // ...
});
```

### autoSession

- **Type**: `boolean`
- **Default**: `true`

Automatically start session tracking on initialization.

```javascript
Nadi.init({
  autoSession: true, // Session starts automatically
  // ...
});
```

### autoVitals

- **Type**: `boolean`
- **Default**: `true`

Automatically collect Core Web Vitals (LCP, INP, CLS, FCP, TTFB).

```javascript
Nadi.init({
  autoVitals: true, // Web Vitals collected automatically
  // ...
});
```

### autoErrors

- **Type**: `boolean`
- **Default**: `true`

Automatically capture JavaScript errors and unhandled promise rejections.

```javascript
Nadi.init({
  autoErrors: true, // Errors captured automatically
  // ...
});
```

### autoBreadcrumbs

- **Type**: `boolean`
- **Default**: `true`

Automatically track user actions (clicks, navigation, console logs, fetch/XHR).

```javascript
Nadi.init({
  autoBreadcrumbs: true, // Breadcrumbs captured automatically
  // ...
});
```

### maxBreadcrumbs

- **Type**: `number`
- **Default**: `50`

Maximum number of breadcrumbs to keep in memory. Oldest breadcrumbs are removed when limit is reached.

```javascript
Nadi.init({
  maxBreadcrumbs: 100, // Keep more breadcrumbs
  // ...
});
```

### sessionTimeout

- **Type**: `number`
- **Default**: `30`

Session timeout in minutes. Session ends after this period of inactivity.

```javascript
Nadi.init({
  sessionTimeout: 60, // 1 hour timeout
  // ...
});
```

### release

- **Type**: `string`
- **Default**: `''`

Your application version. Used for release health tracking.

```javascript
Nadi.init({
  release: '1.2.3',
  // ...
});
```

### environment

- **Type**: `string`
- **Default**: `'production'`

The environment name. Common values: `production`, `staging`, `development`.

```javascript
Nadi.init({
  environment: process.env.NODE_ENV || 'production',
  // ...
});
```

### sampleRate

- **Type**: `number`
- **Default**: `1.0`

Sample rate for Web Vitals collection (0.0 to 1.0). Use to reduce data volume on high-traffic sites.

```javascript
Nadi.init({
  sampleRate: 0.1, // Collect vitals for 10% of sessions
  // ...
});
```

## Performance Tracking Options

### resourceTracking

- **Type**: `boolean`
- **Default**: `true`

Enable tracking of slow resources (scripts, stylesheets, images).

### resourceThresholdMs

- **Type**: `number`
- **Default**: `500`

Minimum resource duration in milliseconds to track.

### longTaskTracking

- **Type**: `boolean`
- **Default**: `true`

Enable detection of long tasks that block the main thread.

### longTaskThresholdMs

- **Type**: `number`
- **Default**: `50`

Minimum task duration in milliseconds to consider as a long task.

### pageLoadTracking

- **Type**: `boolean`
- **Default**: `true`

Enable page load waterfall tracking with timing breakdown.

```javascript
Nadi.init({
  resourceTracking: true,
  resourceThresholdMs: 300,     // Track resources taking > 300ms
  longTaskTracking: true,
  longTaskThresholdMs: 100,     // Track tasks blocking > 100ms
  pageLoadTracking: true,
  // ...
});
```

## User Behavior Tracking Options

### rageClickDetection

- **Type**: `boolean`
- **Default**: `true`

Enable detection of rage clicks (rapid repeated clicks indicating frustration).

### rageClickThreshold

- **Type**: `number`
- **Default**: `3`

Minimum number of clicks to trigger rage click detection.

### rageClickWindowMs

- **Type**: `number`
- **Default**: `1000`

Time window in milliseconds for rage click detection.

### scrollDepthTracking

- **Type**: `boolean`
- **Default**: `false`

Enable scroll depth tracking for engagement metrics.

### memoryTracking

- **Type**: `boolean`
- **Default**: `false`

Enable JavaScript heap memory monitoring (Chrome only).

### memorySampleIntervalMs

- **Type**: `number`
- **Default**: `30000`

Interval in milliseconds between memory samples.

### networkRequestTracking

- **Type**: `boolean`
- **Default**: `true`

Enable tracking of network requests (fetch/XHR).

### networkRequestThresholdMs

- **Type**: `number`
- **Default**: `1000`

Minimum request duration in milliseconds to track.

### firstPartyDomains

- **Type**: `string[]`
- **Default**: `[]`

List of first-party domains for attribution in network requests.

```javascript
Nadi.init({
  rageClickDetection: true,
  rageClickThreshold: 5,
  scrollDepthTracking: true,
  memoryTracking: true,
  firstPartyDomains: ['api.example.com', 'cdn.example.com'],
  // ...
});
```

## Distributed Tracing Options

### tracingEnabled

- **Type**: `boolean`
- **Default**: `false`

Enable distributed tracing with W3C Trace Context headers.

### propagateTraceUrls

- **Type**: `(string | RegExp)[]`
- **Default**: `[]`

URLs or patterns to propagate trace headers to.

### traceState

- **Type**: `string`
- **Default**: `''`

Custom trace state string to include in headers.

```javascript
Nadi.init({
  tracingEnabled: true,
  propagateTraceUrls: [
    'https://api.example.com',
    /^https:\/\/.*\.example\.com/,
  ],
  traceState: 'vendor=value',
  // ...
});
```

## Privacy Options

### privacyEnabled

- **Type**: `boolean`
- **Default**: `true`

Enable automatic PII detection and masking.

### sensitiveUrlParams

- **Type**: `string[]`
- **Default**: `[]`

URL parameters to always mask (e.g., `token`, `key`).

### maskingStrategy

- **Type**: `'redact' | 'partial' | 'hash'`
- **Default**: `'redact'`

Strategy for masking detected PII.

### sensitiveFields

- **Type**: `string[]`
- **Default**: `[]`

Object field names to always mask.

### customPIIPatterns

- **Type**: `Record<string, RegExp>`
- **Default**: `{}`

Custom regex patterns for PII detection.

```javascript
Nadi.init({
  privacyEnabled: true,
  sensitiveUrlParams: ['token', 'secret', 'api_key'],
  maskingStrategy: 'partial',
  sensitiveFields: ['ssn', 'credit_card'],
  customPIIPatterns: {
    employeeId: /EMP-\d{6}/g,
  },
  // ...
});
```

## Advanced Sampling Options

### samplingRules

- **Type**: `SamplingRuleConfig[]`
- **Default**: `undefined`

Custom sampling rules with conditions and priorities.

### alwaysSampleErrors

- **Type**: `boolean`
- **Default**: `true`

Force sampling for sessions with errors.

### alwaysSampleSlowSessions

- **Type**: `boolean`
- **Default**: `true`

Force sampling for slow sessions.

### slowSessionThresholdMs

- **Type**: `number`
- **Default**: `5000`

Threshold in milliseconds to consider a session slow.

### adaptiveSampling

- **Type**: `boolean`
- **Default**: `false`

Enable adaptive sampling based on error rate.

```javascript
Nadi.init({
  sampleRate: 0.1,
  samplingRules: [
    {
      name: 'checkout-pages',
      rate: 1.0,  // Always sample checkout
      priority: 10,
      conditions: { routes: ['/checkout', '/payment'] },
    },
    {
      name: 'mobile-users',
      rate: 0.5,
      priority: 5,
      conditions: { deviceTypes: ['mobile'] },
    },
  ],
  alwaysSampleErrors: true,
  alwaysSampleSlowSessions: true,
  slowSessionThresholdMs: 3000,
  // ...
});
```

## Environment Variables

A common pattern is to use environment variables for configuration:

```javascript
Nadi.init({
  url: process.env.NADI_URL,
  appKey: process.env.NADI_APP_KEY,
  apiKey: process.env.NADI_API_KEY,
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development',
});
```

### Vite

```javascript
Nadi.init({
  url: import.meta.env.VITE_NADI_URL,
  appKey: import.meta.env.VITE_NADI_APP_KEY,
  apiKey: import.meta.env.VITE_NADI_API_KEY,
});
```

### Create React App

```javascript
Nadi.init({
  url: process.env.REACT_APP_NADI_URL,
  appKey: process.env.REACT_APP_NADI_APP_KEY,
  apiKey: process.env.REACT_APP_NADI_API_KEY,
});
```

### Next.js

```javascript
Nadi.init({
  url: process.env.NEXT_PUBLIC_NADI_URL,
  appKey: process.env.NEXT_PUBLIC_NADI_APP_KEY,
  apiKey: process.env.NEXT_PUBLIC_NADI_API_KEY,
});
```

## Configuration Examples

### Minimal Configuration

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  appKey: 'your-app-key',
  apiKey: 'your-bearer-token',
});
```

### Production Configuration

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  appKey: 'your-app-key',
  apiKey: 'your-bearer-token',
  release: '2.1.0',
  environment: 'production',
  sampleRate: 0.5, // 50% sampling for high traffic
});
```

### Development Configuration

```javascript
Nadi.init({
  url: 'https://nadi-staging.example.com',
  appKey: 'your-dev-app-key',
  apiKey: 'your-dev-bearer-token',
  release: '2.1.0-dev',
  environment: 'development',
  debug: true,
  sampleRate: 1.0, // Full collection in dev
});
```

### Manual Control Configuration

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  appKey: 'your-app-key',
  apiKey: 'your-bearer-token',
  autoSession: false, // Manually start sessions
  autoVitals: false,  // Manually trigger vitals
  autoErrors: true,   // Still capture errors automatically
  autoBreadcrumbs: true,
});
```

### Full-Featured Configuration

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  apiKey: 'your-bearer-token',
  appKey: 'your-app-key',
  release: '2.1.0',
  environment: 'production',

  // Performance
  resourceTracking: true,
  resourceThresholdMs: 300,
  longTaskTracking: true,
  pageLoadTracking: true,

  // User behavior
  rageClickDetection: true,
  scrollDepthTracking: true,
  memoryTracking: true,
  firstPartyDomains: ['api.example.com'],

  // Distributed tracing
  tracingEnabled: true,
  propagateTraceUrls: ['https://api.example.com'],

  // Privacy
  privacyEnabled: true,
  sensitiveUrlParams: ['token', 'key'],
  maskingStrategy: 'partial',

  // Sampling
  sampleRate: 0.1,
  alwaysSampleErrors: true,
  alwaysSampleSlowSessions: true,
});
```

## Next Steps

- [Session Tracking](../02-features/01-session-tracking.md) - Configure sessions
- [Web Vitals](../02-features/02-web-vitals.md) - Configure metrics
- [Sampling](../05-advanced/01-sampling.md) - Advanced sampling strategies
- [Distributed Tracing](../05-advanced/03-distributed-tracing.md) - Backend correlation
- [Privacy](../05-advanced/04-privacy.md) - PII masking configuration
