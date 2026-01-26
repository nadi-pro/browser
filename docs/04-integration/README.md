# Integration

Framework-specific guides for integrating the Nadi Browser SDK.

## Overview

The SDK works with any JavaScript framework. This section provides optimized integration patterns for popular frameworks.

## Table of Contents

### [1. React](01-react.md)

Integration with React applications including Create React App.

### [2. Vue](02-vue.md)

Integration with Vue 2 and Vue 3 applications.

### [3. Next.js](03-nextjs.md)

Integration with Next.js (App Router and Pages Router).

## General Integration Pattern

For any framework, the integration follows this pattern:

```javascript
// 1. Initialize early in app lifecycle
Nadi.init({
  url: process.env.NADI_URL,
  appToken: process.env.NADI_APP_TOKEN,
  bearerToken: process.env.NADI_BEARER_TOKEN,
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
});

// 2. Set user after authentication
function onLogin(user) {
  Nadi.getInstance()?.setUser(user.id);
}

// 3. Add custom breadcrumbs at key points
function onCheckout() {
  Nadi.getInstance()?.addBreadcrumb('custom', 'Checkout started');
}

// 4. Handle framework errors
function errorHandler(error) {
  Nadi.getInstance()?.captureError(error);
}
```

## Environment Variables

All frameworks require environment variables:

| Variable | Description |
|----------|-------------|
| `NADI_URL` | Nadi instance URL |
| `NADI_APP_TOKEN` | Application token |
| `NADI_BEARER_TOKEN` | Bearer token |
| `APP_VERSION` | Your app version |

## Framework Comparison

| Feature | React | Vue | Next.js |
|---------|-------|-----|---------|
| Error Boundary | Yes | Yes (plugin) | Yes |
| SSR Support | N/A | N/A | Yes |
| Auto-init | Manual | Plugin | Layout |

## Related Documentation

- [Quick Start](../01-getting-started/02-quick-start.md) - Basic setup
- [Configuration](../01-getting-started/03-configuration.md) - Config options
- [Error Tracking](../02-features/03-error-tracking.md) - Error handling
