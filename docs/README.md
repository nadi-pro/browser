# Documentation

Welcome to the Nadi Browser SDK documentation. This SDK provides comprehensive Real User
Monitoring (RUM) capabilities for web applications.

## Overview

The Nadi Browser SDK (`@nadi-pro/browser`) is a lightweight JavaScript library that automatically
collects performance metrics, errors, and user behavior data from your web application and sends
them to your Nadi instance for analysis.

## Key Features

- **Core Web Vitals** - LCP, INP, CLS, FCP, TTFB tracking
- **Session Tracking** - User sessions and stability metrics
- **Error Capture** - JavaScript errors with stack traces and context
- **Breadcrumbs** - User action tracking for debugging
- **Resource Timing** - Slow asset detection
- **Long Task Detection** - Main thread blocking identification
- **Page Load Waterfall** - Complete page load breakdown
- **Rage Click Detection** - User frustration indicators
- **Memory Monitoring** - Heap usage tracking (Chrome)
- **Scroll Depth Tracking** - User engagement metrics
- **Distributed Tracing** - Backend correlation with W3C Trace Context
- **Privacy Masking** - PII detection and redaction

## Documentation Structure

### [01. Getting Started](01-getting-started/README.md)

Installation, quick start guide, and configuration options.

### [02. Features](02-features/README.md)

Detailed documentation for each feature: sessions, Web Vitals, errors, and breadcrumbs.

### [03. API Reference](03-api-reference/README.md)

Complete API documentation including the Nadi class, types, and utility functions.

### [04. Integration](04-integration/README.md)

Framework-specific integration guides for React, Vue, Next.js, and more.

### [05. Advanced](05-advanced/README.md)

Advanced topics including sampling strategies, distributed tracing, and privacy configuration.

## Quick Start

New to Nadi? Start with [Getting Started](01-getting-started/01-installation.md).

```javascript
import Nadi from '@nadi-pro/browser';

Nadi.init({
  url: 'https://your-nadi-instance.com',
  apiKey: 'your-sanctum-token',
  appKey: 'your-application-key',
});
```

## Finding Information

- **Installation**: Check [Getting Started](01-getting-started/README.md)
- **Feature details**: Check [Features](02-features/README.md)
- **API methods**: Check [API Reference](03-api-reference/README.md)
- **Framework setup**: Check [Integration](04-integration/README.md)
- **Advanced topics**: Check [Advanced](05-advanced/README.md)

## Related Resources

- [GitHub Repository](https://github.com/nadi-pro/browser)
- [Nadi Platform Documentation](https://docs.nadi.pro)
- [Web Vitals Documentation](https://web.dev/vitals/)

---

**Version**: 2.0.0 | **Last Updated**: January 2026
