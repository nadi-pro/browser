# Web Vitals

The SDK automatically collects Core Web Vitals using Google's `web-vitals` library.

## Overview

Core Web Vitals are a set of metrics that measure real-world user experience for loading, interactivity, and visual stability.

## Metrics Collected

| Metric | Name | Description | Unit |
|--------|------|-------------|------|
| **LCP** | Largest Contentful Paint | Loading performance | ms |
| **INP** | Interaction to Next Paint | Interactivity | ms |
| **CLS** | Cumulative Layout Shift | Visual stability | score |
| **FCP** | First Contentful Paint | Initial render | ms |
| **TTFB** | Time to First Byte | Server response | ms |

## Performance Thresholds

Each metric has three ratings:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2500ms | 2500-4000ms | >4000ms |
| INP | ≤200ms | 200-500ms | >500ms |
| CLS | ≤0.1 | 0.1-0.25 | >0.25 |
| FCP | ≤1800ms | 1800-3000ms | >3000ms |
| TTFB | ≤800ms | 800-1800ms | >1800ms |

## How It Works

```text
Page Load
    │
    ▼
┌─────────────────────────────────┐
│     web-vitals library          │
│  Measures LCP, INP, CLS, etc.   │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│     VitalsCollector             │
│  Collects and stores metrics    │
└─────────────────────────────────┘
    │
    ▼ (on page hide/unload)
┌─────────────────────────────────┐
│     Nadi Server                 │
│  Receives vitals via sendBeacon │
└─────────────────────────────────┘
```

## Configuration

### Disable Auto Collection

```javascript
Nadi.init({
  // ...
  autoVitals: false,
});
```

### Sample Rate

Reduce data volume on high-traffic sites:

```javascript
Nadi.init({
  // ...
  sampleRate: 0.1, // Collect from 10% of sessions
});
```

## API Methods

### Get Collected Metrics

```javascript
const nadi = Nadi.getInstance();

const vitals = nadi.getVitals();
// [
//   { name: "LCP", value: 1200.5, rating: "good" },
//   { name: "CLS", value: 0.05, rating: "good" },
//   { name: "INP", value: 150, rating: "good" }
// ]
```

### Flush Metrics Immediately

Force send metrics without waiting for page unload:

```javascript
const nadi = Nadi.getInstance();

await nadi.flushVitals();
```

## Metric Details

### LCP (Largest Contentful Paint)

Measures when the largest content element becomes visible.

**What triggers LCP**:

- `<img>` elements
- `<image>` inside `<svg>`
- `<video>` poster images
- Elements with `background-image`
- Block-level text elements

**Improving LCP**:

- Optimize images (WebP, lazy loading)
- Preload critical resources
- Use CDN for assets
- Minimize render-blocking resources

### INP (Interaction to Next Paint)

Measures responsiveness to user interactions.

**What triggers INP**:

- Click/tap events
- Key presses
- Other discrete input events

**Improving INP**:

- Break up long tasks
- Use `requestIdleCallback`
- Optimize event handlers
- Reduce main thread work

### CLS (Cumulative Layout Shift)

Measures visual stability by tracking unexpected layout shifts.

**What causes CLS**:

- Images without dimensions
- Ads, embeds, iframes
- Dynamically injected content
- Web fonts causing FOIT/FOUT

**Improving CLS**:

- Set image dimensions
- Reserve space for ads
- Avoid inserting content above existing content
- Use `font-display: optional`

### FCP (First Contentful Paint)

Measures when the first content is rendered.

**Improving FCP**:

- Reduce server response time
- Eliminate render-blocking resources
- Preload critical fonts
- Use efficient cache policies

### TTFB (Time to First Byte)

Measures server response time.

**Improving TTFB**:

- Optimize server code
- Use CDN
- Implement caching
- Reduce redirects

## Metric Data Structure

```typescript
interface VitalMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'FID';
  value: number;
  delta?: number;  // Change from previous value
  rating?: 'good' | 'needs-improvement' | 'poor';
}
```

## When Metrics Are Sent

Metrics are automatically sent when:

1. **Page becomes hidden** - `visibilitychange` event
2. **Page unloads** - `pagehide` event
3. **Manual flush** - `flushVitals()` called

The SDK uses `navigator.sendBeacon()` for reliable delivery.

## Utility Functions

### Get Metric Thresholds

```javascript
import { getMetricThresholds } from '@nadi/browser';

const lcpThresholds = getMetricThresholds('LCP');
// { good: 2500, poor: 4000 }
```

### Get Metric Rating

```javascript
import { getMetricRating } from '@nadi/browser';

const rating = getMetricRating('LCP', 1500);
// "good"
```

## API Endpoint

Web Vitals are sent to:

```text
POST /api/rum/vitals
```

Payload:

```json
{
  "metrics": [
    { "name": "LCP", "value": 1200.5, "rating": "good" },
    { "name": "CLS", "value": 0.05, "rating": "good" }
  ],
  "sessionId": "sess_abc123",
  "pageUrl": "https://example.com/dashboard",
  "route": "/dashboard",
  "deviceInfo": {
    "browser": "Chrome",
    "deviceType": "desktop"
  }
}
```

## Best Practices

### 1. Monitor P75 Values

Focus on the 75th percentile for each metric:

```text
P75 = 75% of users have this value or better
```

### 2. Track by Page/Route

Use route information for page-specific analysis:

```javascript
// SDK automatically extracts route from URL
// /users/123 → /users/:id
```

### 3. Segment by Device Type

Compare metrics across device types:

- Desktop vs Mobile vs Tablet
- Fast connections vs slow connections

### 4. Set Realistic Sample Rates

For high-traffic sites:

```javascript
Nadi.init({
  sampleRate: 0.01, // 1% for very high traffic
  // ...
});
```

## Next Steps

- [Error Tracking](03-error-tracking.md) - Error capture
- [Sampling](../05-advanced/01-sampling.md) - Advanced sampling
- [API Reference](../03-api-reference/01-nadi-class.md) - Full API
