# @nadi-pro/browser

JavaScript SDK for Nadi - Real User Monitoring (RUM) for web applications.

## Features

- **Core Web Vitals** - LCP, INP, CLS, FCP, TTFB
- **Session Tracking** - Stability metrics and crash-free rate
- **Error Capture** - JavaScript errors with stack traces
- **Breadcrumbs** - User action tracking
- **Lightweight** - < 10KB gzipped

## Installation

```bash
npm install @nadi-pro/browser
```

## Quick Start

```javascript
import Nadi from '@nadi-pro/browser';

Nadi.init({
  url: 'https://your-nadi-instance.com',
  apiKey: 'your-sanctum-token',
  appKey: 'your-application-key',
});
```

## Documentation

See the full documentation at [docs/README.md](docs/README.md).

## License

MIT
