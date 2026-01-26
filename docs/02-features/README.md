# Features

This section provides detailed documentation for each feature of the Nadi Browser SDK.

## Overview

The SDK includes four main features that work together to provide comprehensive Real User Monitoring:

| Feature | Description | Auto-enabled |
|---------|-------------|--------------|
| Session Tracking | Track user sessions and stability metrics | Yes |
| Web Vitals | Collect Core Web Vitals performance metrics | Yes |
| Error Tracking | Capture JavaScript errors and rejections | Yes |
| Breadcrumbs | Track user actions for debugging context | Yes |

## Table of Contents

### [1. Session Tracking](01-session-tracking.md)

User session management for stability metrics and crash-free rate calculations.

### [2. Web Vitals](02-web-vitals.md)

Core Web Vitals collection including LCP, INP, CLS, FCP, and TTFB.

### [3. Error Tracking](03-error-tracking.md)

JavaScript error capture with stack traces and context.

### [4. Breadcrumbs](04-breadcrumbs.md)

User action tracking for debugging and error context.

## Feature Dependencies

```text
┌─────────────────┐
│   Breadcrumbs   │◄──── Required by Error Tracking
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│    Sessions     │────►│   Web Vitals    │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│ Error Tracking  │     │   Nadi Server   │
└─────────────────┘     └─────────────────┘
```

- **Breadcrumbs** are included with error reports
- **Sessions** provide context for all other features
- All features send data to the Nadi server

## Disabling Features

You can disable any feature during initialization:

```javascript
Nadi.init({
  url: 'https://your-nadi-instance.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
  autoSession: false,     // Disable session tracking
  autoVitals: false,      // Disable Web Vitals
  autoErrors: false,      // Disable error tracking
  autoBreadcrumbs: false, // Disable breadcrumbs
});
```

## Related Documentation

- [Configuration](../01-getting-started/03-configuration.md) - All configuration options
- [API Reference](../03-api-reference/README.md) - Complete API documentation
