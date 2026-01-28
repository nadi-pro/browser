# Performance Tracking

Advanced performance monitoring including resource timing, long tasks, and page load waterfall.

## Overview

Beyond Core Web Vitals, the SDK provides detailed performance tracking to identify specific bottlenecks in your application.

## Resource Timing

Track slow-loading resources like scripts, stylesheets, images, and fonts.

### Configuration

```javascript
Nadi.init({
  resourceTracking: true,      // Enable resource tracking
  resourceThresholdMs: 500,    // Track resources > 500ms
  // ...
});
```

### Data Collected

| Field | Description |
|-------|-------------|
| `url` | Resource URL |
| `initiatorType` | Type (script, css, img, fetch, etc.) |
| `duration` | Total load time |
| `transferSize` | Bytes transferred |
| `dnsLookup` | DNS resolution time |
| `tcpConnect` | TCP connection time |
| `sslTime` | SSL handshake time |
| `ttfb` | Time to first byte |
| `contentDownload` | Content download time |
| `cacheHit` | Whether resource was cached |

### Use Cases

- Identify slow third-party scripts
- Find large images affecting load time
- Detect CDN performance issues
- Monitor API endpoint latency

## Long Task Detection

Detect JavaScript tasks that block the main thread for more than 50ms.

### Configuration

```javascript
Nadi.init({
  longTaskTracking: true,     // Enable long task tracking
  longTaskThresholdMs: 50,    // Track tasks > 50ms (default)
  // ...
});
```

### Data Collected

| Field | Description |
|-------|-------------|
| `startTime` | When the task started |
| `duration` | How long it blocked |
| `attributionName` | Script/container name |
| `attributionType` | Type of attribution |
| `containerType` | iframe, window, etc. |

### Why 50ms?

- 50ms is the Long Task API threshold
- Tasks > 50ms cause noticeable jank
- Impacts INP (Interaction to Next Paint)
- Indicates optimization opportunities

### Common Causes

- Large JavaScript parsing
- Complex DOM operations
- Synchronous XHR
- Heavy computation in event handlers

## Page Load Waterfall

Comprehensive page load timing breakdown.

### Configuration

```javascript
Nadi.init({
  pageLoadTracking: true,     // Enable page load tracking
  // ...
});
```

### Data Collected

| Field | Description |
|-------|-------------|
| `navigationType` | navigate, reload, back_forward |
| `dnsLookup` | DNS resolution time |
| `tcpConnect` | TCP connection time |
| `sslTime` | SSL/TLS negotiation |
| `ttfb` | Time to first byte |
| `responseTime` | Response download time |
| `domInteractive` | Time to DOM interactive |
| `domContentLoaded` | DOMContentLoaded event |
| `domComplete` | DOM complete |
| `loadEvent` | Load event fired |
| `totalLoadTime` | Total page load time |
| `resourceCount` | Number of resources |
| `scriptCount` | Number of scripts |
| `stylesheetCount` | Number of stylesheets |
| `imageCount` | Number of images |
| `totalTransferSize` | Total bytes transferred |

### Understanding the Waterfall

```text
Navigation ─────────────────────────────────────────────────►
    │
    ├─ DNS Lookup ─────┐
    │                  │
    ├─ TCP Connect ────┤
    │                  │
    ├─ SSL Time ───────┤
    │                  │
    ├─ TTFB ───────────┤
    │                  │
    ├─ Response ───────┤
    │                  │
    ├─ DOM Interactive ┤
    │                  │
    ├─ DOMContentLoaded┤
    │                  │
    ├─ DOM Complete ───┤
    │                  │
    └─ Load Event ─────┘
```

## Network Request Tracking

Monitor fetch and XHR request performance.

### Configuration

```javascript
Nadi.init({
  networkRequestTracking: true,    // Enable network tracking
  networkRequestThresholdMs: 1000, // Track requests > 1s
  firstPartyDomains: [             // Identify first-party APIs
    'api.example.com',
    'cdn.example.com',
  ],
  // ...
});
```

### Data Collected

| Field | Description |
|-------|-------------|
| `url` | Request URL (scrubbed for PII) |
| `method` | HTTP method |
| `statusCode` | Response status |
| `duration` | Total request time |
| `ttfb` | Time to first byte |
| `requestSize` | Request body size |
| `responseSize` | Response body size |
| `contentType` | Response content type |
| `isError` | Whether request failed |
| `isFirstParty` | First-party domain |
| `traceId` | Distributed trace ID |

## Best Practices

### 1. Set Appropriate Thresholds

```javascript
// Development: capture more data
Nadi.init({
  resourceThresholdMs: 100,
  longTaskThresholdMs: 50,
  networkRequestThresholdMs: 500,
});

// Production: focus on significant issues
Nadi.init({
  resourceThresholdMs: 500,
  longTaskThresholdMs: 100,
  networkRequestThresholdMs: 2000,
});
```

### 2. Identify First-Party Domains

```javascript
Nadi.init({
  firstPartyDomains: [
    'api.myapp.com',
    'cdn.myapp.com',
    'assets.myapp.com',
  ],
});
```

### 3. Combine with Distributed Tracing

```javascript
Nadi.init({
  networkRequestTracking: true,
  tracingEnabled: true,
  propagateTraceUrls: ['https://api.myapp.com'],
});
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/rum/resources` | Resource timing data |
| `/api/rum/long-tasks` | Long task entries |
| `/api/rum/page-load` | Page load waterfall |
| `/api/rum/network` | Network request data |

## Related Documentation

- [Web Vitals](02-web-vitals.md) - Core Web Vitals metrics
- [Configuration](../01-getting-started/03-configuration.md) - All options
- [Distributed Tracing](../05-advanced/03-distributed-tracing.md) - Backend correlation
