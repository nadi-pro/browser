# Configuration

Complete reference for all configuration options available when initializing the Nadi SDK.

## Configuration Object

```typescript
interface NadiConfig {
  // Required
  url: string;
  token: string;
  apiKey: string;

  // Optional
  apiVersion?: string;
  debug?: boolean;
  autoSession?: boolean;
  autoVitals?: boolean;
  autoErrors?: boolean;
  autoBreadcrumbs?: boolean;
  maxBreadcrumbs?: number;
  sessionTimeout?: number;
  release?: string;
  environment?: string;
  sampleRate?: number;
}
```

## Required Options

### url

- **Type**: `string`
- **Required**: Yes

The base URL of your Nadi instance.

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  // ...
});
```

### token

- **Type**: `string`
- **Required**: Yes

Your application token from the Nadi dashboard. Used to identify which application is sending data.

```javascript
Nadi.init({
  token: 'app_abc123xyz',
  // ...
});
```

### apiKey

- **Type**: `string`
- **Required**: Yes

Your Sanctum API key for API authentication.

```javascript
Nadi.init({
  apiKey: 'your-sanctum-token',
  // ...
});
```

## Optional Options

### apiVersion

- **Type**: `string`
- **Default**: `'v1'`

The API version to use for requests.

```javascript
Nadi.init({
  apiVersion: 'v1',
  // ...
});
```

### debug

- **Type**: `boolean`
- **Default**: `false`

Enable debug logging to the browser console. Useful during development.

```javascript
Nadi.init({
  debug: process.env.NODE_ENV === 'development',
  // ...
});
```

### autoSession

- **Type**: `boolean`
- **Default**: `true`

Automatically start session tracking on initialization.

```javascript
Nadi.init({
  autoSession: true, // Session starts automatically
  // ...
});
```

### autoVitals

- **Type**: `boolean`
- **Default**: `true`

Automatically collect Core Web Vitals (LCP, INP, CLS, FCP, TTFB).

```javascript
Nadi.init({
  autoVitals: true, // Web Vitals collected automatically
  // ...
});
```

### autoErrors

- **Type**: `boolean`
- **Default**: `true`

Automatically capture JavaScript errors and unhandled promise rejections.

```javascript
Nadi.init({
  autoErrors: true, // Errors captured automatically
  // ...
});
```

### autoBreadcrumbs

- **Type**: `boolean`
- **Default**: `true`

Automatically track user actions (clicks, navigation, console logs, fetch/XHR).

```javascript
Nadi.init({
  autoBreadcrumbs: true, // Breadcrumbs captured automatically
  // ...
});
```

### maxBreadcrumbs

- **Type**: `number`
- **Default**: `50`

Maximum number of breadcrumbs to keep in memory. Oldest breadcrumbs are removed when limit is reached.

```javascript
Nadi.init({
  maxBreadcrumbs: 100, // Keep more breadcrumbs
  // ...
});
```

### sessionTimeout

- **Type**: `number`
- **Default**: `30`

Session timeout in minutes. Session ends after this period of inactivity.

```javascript
Nadi.init({
  sessionTimeout: 60, // 1 hour timeout
  // ...
});
```

### release

- **Type**: `string`
- **Default**: `''`

Your application version. Used for release health tracking.

```javascript
Nadi.init({
  release: '1.2.3',
  // ...
});
```

### environment

- **Type**: `string`
- **Default**: `'production'`

The environment name. Common values: `production`, `staging`, `development`.

```javascript
Nadi.init({
  environment: process.env.NODE_ENV || 'production',
  // ...
});
```

### sampleRate

- **Type**: `number`
- **Default**: `1.0`

Sample rate for Web Vitals collection (0.0 to 1.0). Use to reduce data volume on high-traffic sites.

```javascript
Nadi.init({
  sampleRate: 0.1, // Collect vitals for 10% of sessions
  // ...
});
```

## Environment Variables

A common pattern is to use environment variables for configuration:

```javascript
Nadi.init({
  url: process.env.NADI_URL,
  token: process.env.NADI_TOKEN,
  apiKey: process.env.NADI_API_KEY,
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development',
});
```

### Vite

```javascript
Nadi.init({
  url: import.meta.env.VITE_NADI_URL,
  token: import.meta.env.VITE_NADI_TOKEN,
  apiKey: import.meta.env.VITE_NADI_API_KEY,
});
```

### Create React App

```javascript
Nadi.init({
  url: process.env.REACT_APP_NADI_URL,
  token: process.env.REACT_APP_NADI_TOKEN,
  apiKey: process.env.REACT_APP_NADI_API_KEY,
});
```

### Next.js

```javascript
Nadi.init({
  url: process.env.NEXT_PUBLIC_NADI_URL,
  token: process.env.NEXT_PUBLIC_NADI_TOKEN,
  apiKey: process.env.NEXT_PUBLIC_NADI_API_KEY,
});
```

## Configuration Examples

### Minimal Configuration

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
});
```

### Production Configuration

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
  release: '2.1.0',
  environment: 'production',
  sampleRate: 0.5, // 50% sampling for high traffic
});
```

### Development Configuration

```javascript
Nadi.init({
  url: 'https://nadi-staging.example.com',
  token: 'your-dev-app-token',
  apiKey: 'your-dev-bearer-token',
  release: '2.1.0-dev',
  environment: 'development',
  debug: true,
  sampleRate: 1.0, // Full collection in dev
});
```

### Manual Control Configuration

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
  autoSession: false, // Manually start sessions
  autoVitals: false,  // Manually trigger vitals
  autoErrors: true,   // Still capture errors automatically
  autoBreadcrumbs: true,
});
```

## Next Steps

- [Session Tracking](../02-features/01-session-tracking.md) - Configure sessions
- [Web Vitals](../02-features/02-web-vitals.md) - Configure metrics
- [Sampling](../05-advanced/01-sampling.md) - Advanced sampling strategies
