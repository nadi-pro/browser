# Documentation

Welcome to the Nadi Browser SDK documentation. This SDK provides Real User Monitoring (RUM) capabilities for web applications, including Core Web Vitals, error tracking, session management, and user action breadcrumbs.

## Overview

The Nadi Browser SDK (`@nadi/browser`) is a lightweight JavaScript library that automatically collects performance metrics and errors from your web application and sends them to your Nadi instance for analysis.

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

Advanced topics including sampling strategies and custom configurations.

## Quick Start

New to Nadi? Start with [Getting Started](01-getting-started/01-installation.md).

```javascript
import Nadi from '@nadi/browser';

Nadi.init({
  url: 'https://your-nadi-instance.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
});
```

## Finding Information

- **Installation**: Check [Getting Started](01-getting-started/README.md)
- **Feature details**: Check [Features](02-features/README.md)
- **API methods**: Check [API Reference](03-api-reference/README.md)
- **Framework setup**: Check [Integration](04-integration/README.md)

## Related Resources

- [GitHub Repository](https://github.com/cleaniquecoders/nadi-js)
- [Nadi Platform Documentation](https://docs.nadi.pro)
- [Web Vitals Documentation](https://web.dev/vitals/)

---

**Version**: 1.0.0 | **Last Updated**: January 2026
