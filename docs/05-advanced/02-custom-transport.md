# Custom Transport

Advanced transport configuration and customization options.

## Overview

The SDK uses two transport methods:

- **fetch** - Standard HTTP requests
- **sendBeacon** - Reliable delivery on page unload

## Default Transport Behavior

### Standard Requests

Regular data sends use `fetch`:

```javascript
// Internal SDK behavior
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Nadi-App-Token': token,
    'X-API-Version': apiVersion,
  },
  body: JSON.stringify(data),
  keepalive: true,
});
```

### Page Unload

For page unload (vitals, session end), the SDK uses `sendBeacon`:

```javascript
// Internal SDK behavior
const blob = new Blob([JSON.stringify(data)], {
  type: 'application/json',
});
navigator.sendBeacon(url, blob);
```

## API Headers

All requests include these headers:

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer {token}` | Sanctum auth token |
| `Nadi-App-Token` | `{token}` | Application identifier |
| `X-API-Version` | `v1` | API version |
| `Content-Type` | `application/json` | Payload format |

## Request Payload Sizes

Keep payloads under browser limits:

| Transport | Limit | Typical Use |
|-----------|-------|-------------|
| fetch | ~6MB | All normal requests |
| sendBeacon | 64KB | Page unload data |

The SDK keeps payloads small by:

- Limiting breadcrumbs (default: 50)
- Truncating long messages
- Sending only essential data

## Network Error Handling

The SDK handles network errors gracefully:

```javascript
// Internal behavior
try {
  await fetch(url, options);
} catch (error) {
  // Silently fail - don't interrupt user experience
  // Data is lost but app continues
}
```

## Offline Handling

Currently, the SDK does not queue data when offline. Data sent while offline is lost.

For offline support, consider:

```javascript
// Custom wrapper with offline queue
class OfflineQueue {
  private queue: any[] = [];

  async send(data: any) {
    if (navigator.onLine) {
      await this.flush();
      await sendToNadi(data);
    } else {
      this.queue.push(data);
    }
  }

  async flush() {
    while (this.queue.length > 0) {
      const data = this.queue.shift();
      await sendToNadi(data);
    }
  }
}

// Listen for online status
window.addEventListener('online', () => queue.flush());
```

## CORS Configuration

Ensure your Nadi instance allows requests from your domain:

```php
// Laravel CORS configuration
'allowed_origins' => ['https://yourapp.com'],
'allowed_methods' => ['POST', 'GET', 'OPTIONS'],
'allowed_headers' => [
    'Content-Type',
    'Authorization',
    'Nadi-App-Token',
    'X-API-Version',
],
```

## Content Security Policy

If using CSP, allow connections to your Nadi instance:

```html
<meta http-equiv="Content-Security-Policy"
  content="connect-src 'self' https://nadi.example.com">
```

Or in headers:

```text
Content-Security-Policy: connect-src 'self' https://nadi.example.com
```

## Proxy Configuration

For environments requiring a proxy:

```javascript
// Initialize with proxy URL
Nadi.init({
  url: 'https://your-proxy.com/nadi', // Proxy endpoint
  // ...
});
```

Proxy should forward to your Nadi instance.

## Request Timing

Typical request lifecycle:

```text
1. Event occurs (error, vitals collected)
2. SDK prepares payload (~1-5ms)
3. Request sent (async, non-blocking)
4. Response received (~50-500ms depending on network)
```

The SDK never blocks the main thread waiting for responses.

## Monitoring Transport

Enable debug mode to see transport activity:

```javascript
Nadi.init({
  // ...
  debug: true,
});
```

Console output:

```text
[Nadi] Session started {...}
[Nadi] Breadcrumb added {...}
[Nadi] Error captured {...}
[Nadi] Vitals flushed
```

## Custom Request Interceptor

For advanced use cases, you can intercept requests:

```javascript
// Wrap fetch globally (before Nadi.init)
const originalFetch = window.fetch;

window.fetch = async (url, options) => {
  // Check if Nadi request
  if (url.includes('nadi.example.com')) {
    // Add custom headers
    options.headers = {
      ...options.headers,
      'X-Custom-Header': 'value',
    };

    // Log for debugging
    console.log('Nadi request:', url, options);
  }

  return originalFetch(url, options);
};

// Then initialize Nadi
Nadi.init({...});
```

## Rate Limiting

The SDK respects server rate limits. If rate limited:

1. Request returns 429 status
2. Data is not retried (lost)
3. App continues normally

Configure server-side rate limits appropriately:

```php
// Laravel rate limiting
Route::middleware(['throttle:1000,1'])->group(function () {
    // 1000 requests per minute per application
});
```

## Best Practices

### 1. Use HTTPS Only

Always use HTTPS for your Nadi instance:

```javascript
Nadi.init({
  url: 'https://nadi.example.com', // Never http://
  // ...
});
```

### 2. Monitor Network Impact

Check that SDK requests don't impact user experience:

```javascript
// Use browser DevTools Network panel
// Filter by: nadi.example.com
// Verify: requests are small and fast
```

### 3. Handle Blocked Requests

Some ad blockers may block monitoring requests:

```javascript
// The SDK handles this gracefully
// No errors thrown, app continues
```

### 4. Test Page Unload

Verify data is sent on page unload:

1. Load page with debug mode
2. Interact with page
3. Navigate away
4. Check Nadi dashboard for received data

## Troubleshooting

### Requests Not Reaching Server

1. Check CORS configuration
2. Verify CSP allows connection
3. Check for ad blocker interference
4. Verify URLs are correct

### Partial Data Loss

1. Check `sendBeacon` support
2. Verify keepalive is working
3. Review payload sizes

### High Latency

1. Check network conditions
2. Verify CDN/geographic proximity
3. Review server performance

## Next Steps

- [Sampling](01-sampling.md) - Reduce request volume
- [Configuration](../01-getting-started/03-configuration.md) - All options
- [API Reference](../03-api-reference/README.md) - Full API
