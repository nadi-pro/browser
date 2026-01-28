# Utilities

Exported utility functions for advanced usage.

## Device Utilities

### getDeviceInfo()

Get information about the current device and browser.

```typescript
function getDeviceInfo(): DeviceInfo
```

**Returns:** `DeviceInfo` object

**Example:**

```javascript
import { getDeviceInfo } from '@nadi-pro/browser';

const device = getDeviceInfo();
console.log(device);
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

**Use Cases:**

- Custom analytics
- Feature detection
- A/B testing by device type

---

## URL Utilities

### getPageUrl()

Get the current page URL.

```typescript
function getPageUrl(): string
```

**Returns:** Current `window.location.href` or empty string

**Example:**

```javascript
import { getPageUrl } from '@nadi-pro/browser';

const url = getPageUrl();
// "https://example.com/users/123?tab=settings"
```

---

### getRoutePattern()

Get a normalized route pattern from the current URL.

```typescript
function getRoutePattern(): string
```

**Returns:** URL path with numeric IDs replaced

**Example:**

```javascript
import { getRoutePattern } from '@nadi-pro/browser';

// URL: https://example.com/users/123/posts/456
const route = getRoutePattern();
// "/users/:id/posts/:id"
```

**Use Cases:**

- Grouping errors by route
- Analyzing performance by page type
- Route-based filtering

---

## Web Vitals Utilities

### getMetricThresholds(metricName)

Get the threshold values for a Web Vital metric.

```typescript
function getMetricThresholds(metricName: string): {
  good: number;
  poor: number;
}
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `metricName` | `string` | Metric name (LCP, INP, CLS, etc.) |

**Returns:** Object with `good` and `poor` threshold values

**Example:**

```javascript
import { getMetricThresholds } from '@nadi-pro/browser';

const lcpThresholds = getMetricThresholds('LCP');
// { good: 2500, poor: 4000 }

const clsThresholds = getMetricThresholds('CLS');
// { good: 0.1, poor: 0.25 }
```

**Threshold Values:**

| Metric | Good | Poor |
|--------|------|------|
| LCP | 2500 | 4000 |
| INP | 200 | 500 |
| CLS | 0.1 | 0.25 |
| FCP | 1800 | 3000 |
| TTFB | 800 | 1800 |
| FID | 100 | 300 |

---

### getMetricRating(metricName, value)

Get the rating for a specific metric value.

```typescript
function getMetricRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor'
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `metricName` | `string` | Metric name |
| `value` | `number` | Metric value |

**Returns:** Rating string

**Example:**

```javascript
import { getMetricRating } from '@nadi-pro/browser';

// LCP examples
getMetricRating('LCP', 1500);  // "good"
getMetricRating('LCP', 3000);  // "needs-improvement"
getMetricRating('LCP', 5000);  // "poor"

// CLS examples
getMetricRating('CLS', 0.05);  // "good"
getMetricRating('CLS', 0.15);  // "needs-improvement"
getMetricRating('CLS', 0.30);  // "poor"
```

---

## Usage Examples

### Custom Analytics Integration

```javascript
import { getDeviceInfo, getPageUrl, getRoutePattern } from '@nadi-pro/browser';

function trackCustomEvent(eventName, data) {
  const enrichedData = {
    ...data,
    device: getDeviceInfo(),
    url: getPageUrl(),
    route: getRoutePattern(),
    timestamp: Date.now(),
  };

  sendToAnalytics(eventName, enrichedData);
}
```

### Performance Dashboard

```javascript
import { getMetricThresholds, getMetricRating } from '@nadi-pro/browser';

function displayVitalStatus(name, value) {
  const thresholds = getMetricThresholds(name);
  const rating = getMetricRating(name, value);

  return {
    name,
    value,
    rating,
    thresholds,
    isGood: rating === 'good',
    isPoor: rating === 'poor',
  };
}

// Usage
const lcpStatus = displayVitalStatus('LCP', 2100);
// {
//   name: "LCP",
//   value: 2100,
//   rating: "good",
//   thresholds: { good: 2500, poor: 4000 },
//   isGood: true,
//   isPoor: false
// }
```

### Device-Specific Logic

```javascript
import { getDeviceInfo } from '@nadi-pro/browser';

function getOptimalImageSize() {
  const device = getDeviceInfo();

  if (device.deviceType === 'mobile') {
    return { width: 640, quality: 75 };
  }

  if (device.deviceType === 'tablet') {
    return { width: 1024, quality: 80 };
  }

  return { width: 1920, quality: 85 };
}
```

### Route-Based Error Grouping

```javascript
import { getRoutePattern } from '@nadi-pro/browser';

function getErrorGroup(error) {
  return {
    message: error.message,
    route: getRoutePattern(),
    groupKey: `${getRoutePattern()}:${error.name}`,
  };
}

// Different URLs group together
// /users/123 and /users/456 both become /users/:id
```

---

## Importing

```javascript
// Named imports
import {
  getDeviceInfo,
  getPageUrl,
  getRoutePattern,
  getMetricThresholds,
  getMetricRating,
} from '@nadi-pro/browser';
```

## Next Steps

- [Types](02-types.md) - Type definitions
- [Nadi Class](01-nadi-class.md) - Main API
- [Web Vitals](../02-features/02-web-vitals.md) - Vitals feature
