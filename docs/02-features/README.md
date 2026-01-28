# Features

This section provides detailed documentation for each feature of the Nadi Browser SDK.

## Overview

The SDK includes comprehensive Real User Monitoring features organized into three categories:

### Core Features

| Feature | Description | Auto-enabled |
|---------|-------------|--------------|
| Session Tracking | Track user sessions and stability metrics | Yes |
| Web Vitals | Collect Core Web Vitals performance metrics | Yes |
| Error Tracking | Capture JavaScript errors and rejections | Yes |
| Breadcrumbs | Track user actions for debugging context | Yes |

### Performance Features

| Feature | Description | Auto-enabled |
|---------|-------------|--------------|
| Resource Timing | Track slow assets (scripts, CSS, images) | Yes |
| Long Tasks | Detect main thread blocking | Yes |
| Page Load | Complete page load waterfall | Yes |
| Network Requests | Track fetch/XHR performance | Yes |

### User Behavior Features

| Feature | Description | Auto-enabled |
|---------|-------------|--------------|
| Rage Clicks | Detect user frustration | Yes |
| Scroll Depth | Track content engagement | No |
| Memory Tracking | Monitor JS heap usage (Chrome) | No |

## Table of Contents

### [1. Session Tracking](01-session-tracking.md)

User session management for stability metrics and crash-free rate calculations.

### [2. Web Vitals](02-web-vitals.md)

Core Web Vitals collection including LCP, INP, CLS, FCP, and TTFB.

### [3. Error Tracking](03-error-tracking.md)

JavaScript error capture with stack traces and context.

### [4. Breadcrumbs](04-breadcrumbs.md)

User action tracking for debugging and error context.

### [5. Performance Tracking](05-performance-tracking.md)

Resource timing, long tasks, and page load waterfall.

### [6. User Behavior](06-user-behavior.md)

Rage clicks, scroll depth, and memory monitoring.

## Feature Dependencies

```text
┌─────────────────────────────────────────────────────────┐
│                      Breadcrumbs                        │
│              (Required by Error Tracking)               │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐   ┌───────────┐   ┌──────────────┐
│   Sessions  │   │  Errors   │   │   Tracing    │
└──────┬──────┘   └─────┬─────┘   └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │Web Vitals │ │ Resources │ │Long Tasks │ │Page Load│ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │Rage Clicks│ │  Scroll   │ │  Memory   │             │
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
│                     Privacy Manager                     │
│                  (Masks all PII data)                   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  Nadi Server  │
                  └───────────────┘
```

## Disabling Features

You can disable any feature during initialization:

```javascript
Nadi.init({
  url: 'https://your-nadi-instance.com',
  apiKey: 'your-sanctum-token',
  appKey: 'your-application-key',

  // Core features
  autoSession: false,     // Disable session tracking
  autoVitals: false,      // Disable Web Vitals
  autoErrors: false,      // Disable error tracking
  autoBreadcrumbs: false, // Disable breadcrumbs

  // Performance features
  resourceTracking: false,    // Disable resource timing
  longTaskTracking: false,    // Disable long task detection
  pageLoadTracking: false,    // Disable page load tracking
  networkRequestTracking: false, // Disable network tracking

  // User behavior features
  rageClickDetection: false,  // Disable rage click detection
  scrollDepthTracking: false, // Already disabled by default
  memoryTracking: false,      // Already disabled by default
});
```

## Related Documentation

- [Configuration](../01-getting-started/03-configuration.md) - All configuration options
- [API Reference](../03-api-reference/README.md) - Complete API documentation
- [Advanced](../05-advanced/README.md) - Tracing, privacy, and sampling
