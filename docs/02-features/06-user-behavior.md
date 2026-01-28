# User Behavior Tracking

Track user behavior patterns including rage clicks, scroll depth, and memory usage.

## Overview

Understanding how users interact with your application helps identify usability issues and engagement patterns.

## Rage Click Detection

Detect rapid repeated clicks that indicate user frustration.

### Configuration

```javascript
Nadi.init({
  rageClickDetection: true,    // Enable rage click detection
  rageClickThreshold: 3,       // Minimum clicks to trigger
  rageClickWindowMs: 1000,     // Time window in milliseconds
  // ...
});
```

### What Triggers Rage Clicks

A rage click is detected when:

- User clicks the same element 3+ times (configurable)
- Within a 1-second window (configurable)
- On elements that don't respond as expected

### Data Collected

| Field | Description |
|-------|-------------|
| `selector` | CSS selector of the element |
| `tagName` | HTML tag name |
| `elementId` | Element ID if present |
| `elementClass` | Element classes |
| `elementText` | Truncated element text |
| `clickCount` | Number of clicks |
| `windowMs` | Time window |
| `xPosition` | X coordinate |
| `yPosition` | Y coordinate |

### Common Causes

- Unresponsive buttons
- Slow form submissions
- Broken links
- Missing click handlers
- Confusing UI elements

### Configuration Examples

```javascript
// Sensitive: detect early signs of frustration
Nadi.init({
  rageClickThreshold: 2,
  rageClickWindowMs: 500,
});

// Conservative: only obvious rage clicks
Nadi.init({
  rageClickThreshold: 5,
  rageClickWindowMs: 2000,
});
```

## Scroll Depth Tracking

Measure how far users scroll on your pages.

### Configuration

```javascript
Nadi.init({
  scrollDepthTracking: true,   // Enable scroll tracking
  // ...
});
```

### Data Collected

| Field | Description |
|-------|-------------|
| `maxScrollDepth` | Maximum scroll percentage (0-100) |
| `scrollDistancePx` | Total pixels scrolled |

### Use Cases

- Content engagement metrics
- Article completion rates
- Landing page optimization
- Identifying content drop-off points

### Understanding Scroll Metrics

```text
Page Top (0%)
     │
     │  User scrolled to 75%
     ▼
     ████████████████████████████████
     █ Visible Content              █
     ████████████████████████████████
     │
     │
     ▼
Page Bottom (100%)
```

## Memory Monitoring

Track JavaScript heap memory usage (Chrome only).

### Configuration

```javascript
Nadi.init({
  memoryTracking: true,           // Enable memory tracking
  memorySampleIntervalMs: 30000,  // Sample every 30 seconds
  // ...
});
```

### Browser Support

Memory tracking uses the `performance.memory` API, which is only available in Chromium-based browsers:

- Chrome
- Edge
- Opera
- Brave

### Data Collected

| Field | Description |
|-------|-------------|
| `usedJSHeapSize` | Currently used heap memory |
| `totalJSHeapSize` | Total allocated heap |
| `jsHeapSizeLimit` | Maximum heap size |
| `heapUsagePercent` | Usage as percentage |

### Understanding Memory Metrics

```javascript
// Memory sample example
{
  usedJSHeapSize: 15728640,      // 15 MB used
  totalJSHeapSize: 33554432,     // 32 MB allocated
  jsHeapSizeLimit: 2147483648,   // 2 GB limit
  heapUsagePercent: 46.9         // 47% of allocated
}
```

### Detecting Memory Leaks

Watch for patterns like:

- Continuously increasing `usedJSHeapSize`
- `heapUsagePercent` approaching 100%
- Memory not decreasing after navigation

## Custom Event Tracking

Track custom events and timing in your application.

### API

```javascript
const nadi = Nadi.getInstance();

// Track a custom event
nadi.trackEvent(
  'checkout_started',      // Event name
  'conversion',            // Category (optional)
  99.99,                   // Value (optional)
  { plan: 'premium' }      // Tags (optional)
);

// Track a timing event
nadi.trackTiming(
  'api_response',          // Timing name
  245,                     // Duration in ms
  { endpoint: '/users' }   // Tags (optional)
);
```

### Use Cases

```javascript
// Feature usage
nadi.trackEvent('dark_mode_enabled', 'settings');

// Business events
nadi.trackEvent('subscription_upgraded', 'revenue', 49.99, {
  fromPlan: 'basic',
  toPlan: 'premium',
});

// Performance timing
const start = performance.now();
await heavyOperation();
nadi.trackTiming('heavy_operation', performance.now() - start);

// API timing
nadi.trackTiming('search_api', response.duration, {
  resultCount: response.results.length,
});
```

## Visibility Tracking

Track when elements become visible to users.

### Data Collected

| Field | Description |
|-------|-------------|
| `elementSelector` | CSS selector |
| `timeToVisible` | Time until element visible |
| `timeVisible` | Duration element was visible |
| `visibilityPercent` | Percentage of element visible |

## Best Practices

### 1. Enable Appropriate Features

```javascript
// Content-heavy sites (blogs, news)
Nadi.init({
  scrollDepthTracking: true,
  rageClickDetection: true,
});

// E-commerce sites
Nadi.init({
  rageClickDetection: true,
  networkRequestTracking: true,
});

// SPAs with potential memory issues
Nadi.init({
  memoryTracking: true,
  memorySampleIntervalMs: 15000,
});
```

### 2. Combine with Custom Events

```javascript
// Track form abandonment
formElement.addEventListener('blur', () => {
  if (!formCompleted) {
    nadi.trackEvent('form_abandoned', 'engagement', null, {
      formId: formElement.id,
      fieldsCompleted: completedCount,
    });
  }
});
```

### 3. Set Up Alerts

Configure server-side alerts for:

- High rage click rates on specific pages
- Sudden memory usage increases
- Low scroll depth on important content

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/rum/rage-clicks` | Rage click events |
| `/api/rum/interactions` | Scroll and visibility data |
| `/api/rum/memory` | Memory samples |
| `/api/rum/events` | Custom events |

## Related Documentation

- [Breadcrumbs](04-breadcrumbs.md) - Action tracking
- [Error Tracking](03-error-tracking.md) - Error context
- [Configuration](../01-getting-started/03-configuration.md) - All options
