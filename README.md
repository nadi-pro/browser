# @nadi/browser

JavaScript SDK for Nadi - Real User Monitoring (RUM) for web applications.

## Features

- **Core Web Vitals** - LCP, INP, CLS, FCP, TTFB tracking
- **Session Tracking** - Stability metrics and crash-free rate
- **Error Capture** - JavaScript errors and unhandled promise rejections
- **Breadcrumbs** - User action tracking (clicks, navigation, console, fetch)
- **Lightweight** - < 10KB gzipped

## Installation

```bash
npm install @nadi/browser
# or
yarn add @nadi/browser
# or
pnpm add @nadi/browser
```

## Quick Start

```javascript
import Nadi from '@nadi/browser';

// Initialize the SDK
Nadi.init({
  url: 'https://your-nadi-instance.com',
  appToken: 'your-app-token',
  bearerToken: 'your-bearer-token',
  release: '1.0.0',
  environment: 'production',
});
```

That's it! The SDK will automatically:
- Start a session
- Collect Core Web Vitals
- Capture JavaScript errors
- Track user interactions as breadcrumbs

## Configuration

```javascript
Nadi.init({
  // Required
  url: 'https://your-nadi-instance.com',
  appToken: 'your-app-token',
  bearerToken: 'your-bearer-token',

  // Optional
  apiVersion: 'v1',           // API version (default: 'v1')
  release: '1.0.0',           // Your app version
  environment: 'production',  // production, staging, development
  debug: false,               // Enable debug logging

  // Auto-tracking (all default to true)
  autoSession: true,          // Auto session tracking
  autoVitals: true,           // Auto Web Vitals collection
  autoErrors: true,           // Auto error capture
  autoBreadcrumbs: true,      // Auto breadcrumb collection

  // Limits
  maxBreadcrumbs: 50,         // Max breadcrumbs to keep
  sessionTimeout: 30,         // Session timeout in minutes
  sampleRate: 1.0,            // Sample rate for vitals (0-1)
});
```

## API Reference

### User Identification

```javascript
const nadi = Nadi.getInstance();

// Set user after login
nadi.setUser('user-123');
```

### Manual Error Capture

```javascript
const nadi = Nadi.getInstance();

// Capture an error
try {
  riskyOperation();
} catch (error) {
  nadi.captureError(error, {
    context: 'checkout',
    orderId: '12345'
  });
}

// Capture a message
nadi.captureMessage('Payment failed', {
  reason: 'insufficient_funds',
  amount: 99.99
});
```

### Custom Breadcrumbs

```javascript
const nadi = Nadi.getInstance();

// Add a custom breadcrumb
nadi.addBreadcrumb('custom', 'User added item to cart', {
  productId: 'SKU-123',
  quantity: 2
});

// Get all breadcrumbs
const breadcrumbs = nadi.getBreadcrumbs();

// Clear breadcrumbs
nadi.clearBreadcrumbs();
```

### Session Management

```javascript
const nadi = Nadi.getInstance();

// Get current session
const session = nadi.getSession();
console.log(session.sessionId);

// Get session ID only
const sessionId = nadi.getSessionId();

// Report a crash
nadi.reportCrash();
```

### Web Vitals

```javascript
const nadi = Nadi.getInstance();

// Get collected vitals
const vitals = nadi.getVitals();
// [{ name: 'LCP', value: 1200, rating: 'good' }, ...]

// Force send vitals immediately
await nadi.flushVitals();
```

### Cleanup

```javascript
const nadi = Nadi.getInstance();

// Stop all tracking
await nadi.stop();
```

## CDN Usage

```html
<script src="https://unpkg.com/@nadi/browser/dist/nadi.umd.js"></script>
<script>
  Nadi.init({
    url: 'https://your-nadi-instance.com',
    appToken: 'your-app-token',
    bearerToken: 'your-bearer-token',
  });
</script>
```

## Framework Integration

### React

```javascript
// src/nadi.js
import Nadi from '@nadi/browser';

export const initNadi = () => {
  Nadi.init({
    url: process.env.REACT_APP_NADI_URL,
    appToken: process.env.REACT_APP_NADI_TOKEN,
    bearerToken: process.env.REACT_APP_NADI_BEARER,
    release: process.env.REACT_APP_VERSION,
  });
};

// src/index.js
import { initNadi } from './nadi';
initNadi();
```

### Vue

```javascript
// src/plugins/nadi.js
import Nadi from '@nadi/browser';

export default {
  install() {
    Nadi.init({
      url: import.meta.env.VITE_NADI_URL,
      appToken: import.meta.env.VITE_NADI_TOKEN,
      bearerToken: import.meta.env.VITE_NADI_BEARER,
      release: import.meta.env.VITE_APP_VERSION,
    });
  }
};

// src/main.js
import nadiPlugin from './plugins/nadi';
app.use(nadiPlugin);
```

### Next.js

```javascript
// lib/nadi.js
'use client';

import Nadi from '@nadi/browser';

let initialized = false;

export function initNadi() {
  if (typeof window === 'undefined' || initialized) return;

  initialized = true;
  Nadi.init({
    url: process.env.NEXT_PUBLIC_NADI_URL,
    appToken: process.env.NEXT_PUBLIC_NADI_TOKEN,
    bearerToken: process.env.NEXT_PUBLIC_NADI_BEARER,
    release: process.env.NEXT_PUBLIC_VERSION,
  });
}

// app/layout.js
'use client';
import { useEffect } from 'react';
import { initNadi } from '@/lib/nadi';

export default function RootLayout({ children }) {
  useEffect(() => {
    initNadi();
  }, []);

  return <html><body>{children}</body></html>;
}
```

## Breadcrumb Types

| Type | Description | Auto-captured |
|------|-------------|---------------|
| `click` | User clicks | Yes |
| `navigation` | Route changes | Yes |
| `console` | Console logs | Yes |
| `fetch` | Fetch requests | Yes |
| `xhr` | XHR requests | Yes |
| `error` | Errors | Yes |
| `custom` | Custom events | Manual |

## Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2500ms | 2500-4000ms | >4000ms |
| INP | ≤200ms | 200-500ms | >500ms |
| CLS | ≤0.1 | 0.1-0.25 | >0.25 |
| FCP | ≤1800ms | 1800-3000ms | >3000ms |
| TTFB | ≤800ms | 800-1800ms | >1800ms |

## License

MIT
