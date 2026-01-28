# Nadi Class

The main class for the Nadi Browser SDK. Uses the singleton pattern.

## Static Methods

### Nadi.init(config)

Initialize the SDK. Must be called once before using other methods.

```typescript
static init(config: NadiConfig): Nadi
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `NadiConfig` | Configuration object |

**Returns:** `Nadi` instance

**Example:**

```javascript
const nadi = Nadi.init({
  url: 'https://nadi.example.com',
  apiKey: 'your-sanctum-token',
  appKey: 'your-application-key',
  release: '1.0.0',
  environment: 'production',
});
```

**Notes:**

- Can only be called once
- Subsequent calls return existing instance with a warning

---

### Nadi.getInstance()

Get the singleton instance after initialization.

```typescript
static getInstance(): Nadi | null
```

**Returns:** `Nadi` instance or `null` if not initialized

**Example:**

```javascript
const nadi = Nadi.getInstance();
if (nadi) {
  nadi.setUser('user-123');
}
```

---

## Instance Methods

### Session Methods

#### getSession()

Get the current session data.

```typescript
getSession(): SessionData | null
```

**Returns:** `SessionData` object or `null`

**Example:**

```javascript
const session = nadi.getSession();
console.log(session?.sessionId);
console.log(session?.deviceInfo);
```

---

#### getSessionId()

Get the current session ID.

```typescript
getSessionId(): string | undefined
```

**Returns:** Session ID string or `undefined`

**Example:**

```javascript
const sessionId = nadi.getSessionId();
// "sess_1706234567_abc123"
```

---

#### setUser(userId)

Set the user identifier for the current session.

```typescript
setUser(userId: string): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `userId` | `string` | User identifier |

**Example:**

```javascript
// After user logs in
nadi.setUser('user-123');
nadi.setUser(user.id.toString());
```

---

#### reportCrash()

Report a crash and end the session.

```typescript
async reportCrash(): Promise<void>
```

**Example:**

```javascript
try {
  await criticalOperation();
} catch (error) {
  await nadi.captureError(error);
  await nadi.reportCrash();
}
```

---

### Error Methods

#### captureError(error, context?)

Capture an error with optional context.

```typescript
async captureError(
  error: Error,
  context?: Record<string, unknown>
): Promise<void>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `error` | `Error` | The error to capture |
| `context` | `Record<string, unknown>` | Optional context data |

**Example:**

```javascript
try {
  await processOrder(orderId);
} catch (error) {
  await nadi.captureError(error, {
    orderId,
    userId: currentUser.id,
  });
}
```

---

#### captureMessage(message, context?)

Capture a message as an error.

```typescript
async captureMessage(
  message: string,
  context?: Record<string, unknown>
): Promise<void>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `message` | `string` | The message to capture |
| `context` | `Record<string, unknown>` | Optional context data |

**Example:**

```javascript
if (response.status >= 500) {
  await nadi.captureMessage('Server error', {
    url: response.url,
    status: response.status,
  });
}
```

---

### Breadcrumb Methods

#### addBreadcrumb(type, message, data?)

Add a custom breadcrumb.

```typescript
addBreadcrumb(
  type: BreadcrumbType,
  message: string,
  data?: Record<string, unknown>
): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `type` | `BreadcrumbType` | Breadcrumb type |
| `message` | `string` | Description |
| `data` | `Record<string, unknown>` | Optional additional data |

**Breadcrumb Types:**

- `'click'`
- `'navigation'`
- `'console'`
- `'fetch'`
- `'xhr'`
- `'error'`
- `'custom'`

**Example:**

```javascript
nadi.addBreadcrumb('custom', 'User completed checkout', {
  orderId: '12345',
  total: 99.99,
});
```

---

#### getBreadcrumbs()

Get all breadcrumbs.

```typescript
getBreadcrumbs(): Breadcrumb[]
```

**Returns:** Array of `Breadcrumb` objects

**Example:**

```javascript
const breadcrumbs = nadi.getBreadcrumbs();
console.log(breadcrumbs.length);
```

---

#### clearBreadcrumbs()

Clear all breadcrumbs.

```typescript
clearBreadcrumbs(): void
```

**Example:**

```javascript
// After handling an error
nadi.clearBreadcrumbs();
```

---

### Vitals Methods

#### getVitals()

Get collected Web Vitals metrics.

```typescript
getVitals(): VitalMetric[]
```

**Returns:** Array of `VitalMetric` objects

**Example:**

```javascript
const vitals = nadi.getVitals();
vitals.forEach((metric) => {
  console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
});
```

---

#### flushVitals()

Send collected metrics immediately.

```typescript
async flushVitals(): Promise<void>
```

**Example:**

```javascript
// Before SPA navigation
await nadi.flushVitals();
```

---

### Lifecycle Methods

#### stop()

Stop all collectors and end the session.

```typescript
async stop(): Promise<void>
```

**Example:**

```javascript
// When unmounting app
await nadi.stop();
```

---

#### flush()

Flush all collected data immediately.

```typescript
async flush(): Promise<void>
```

**Example:**

```javascript
// Before SPA navigation
await nadi.flush();
```

---

### Custom Event Methods

#### trackEvent(name, category?, value?, tags?)

Track a custom event.

```typescript
trackEvent(
  name: string,
  category?: string,
  value?: number,
  tags?: Record<string, string>
): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | Event name |
| `category` | `string` | Optional category |
| `value` | `number` | Optional numeric value |
| `tags` | `Record<string, string>` | Optional key-value tags |

**Example:**

```javascript
nadi.trackEvent('checkout_completed', 'conversion', 99.99, {
  plan: 'premium',
  currency: 'USD',
});
```

---

#### trackTiming(name, duration, tags?)

Track a timing event.

```typescript
trackTiming(
  name: string,
  duration: number,
  tags?: Record<string, string>
): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | Timing name |
| `duration` | `number` | Duration in milliseconds |
| `tags` | `Record<string, string>` | Optional tags |

**Example:**

```javascript
const start = performance.now();
await heavyOperation();
nadi.trackTiming('heavy_operation', performance.now() - start);
```

---

### Tracing Methods

#### getTraceContext()

Get the current distributed trace context.

```typescript
getTraceContext(): TraceContext | null
```

**Returns:** `TraceContext` object or `null` if tracing is disabled.

**Example:**

```javascript
const context = nadi.getTraceContext();
// { traceId: '...', spanId: '...', sampled: true }
```

---

#### getTraceId()

Get the current trace ID.

```typescript
getTraceId(): string | null
```

**Returns:** Trace ID string or `null`

---

#### getTraceHeaders(url)

Get W3C Trace Context headers for an outgoing request.

```typescript
getTraceHeaders(url: string): Record<string, string>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `url` | `string` | Target URL |

**Returns:** Headers object (empty if URL not in propagate list)

**Example:**

```javascript
const headers = nadi.getTraceHeaders('https://api.example.com/data');
// { traceparent: '00-traceid-spanid-01', tracestate: '...' }

fetch('https://api.example.com/data', { headers });
```

---

#### adoptTraceContext(context)

Adopt an existing trace context from server-rendered page.

```typescript
adoptTraceContext(context: TraceContext): void
```

**Example:**

```javascript
// From server-rendered meta tag
const traceId = document.querySelector('meta[name="trace-id"]')?.content;
if (traceId) {
  nadi.adoptTraceContext({
    traceId,
    spanId: generateSpanId(),
    sampled: true,
  });
}
```

---

### Privacy Methods

#### scrubUrl(url)

Remove PII from a URL.

```typescript
scrubUrl(url: string): string
```

**Example:**

```javascript
const scrubbed = nadi.scrubUrl('https://example.com?email=user@test.com');
// 'https://example.com?email=[REDACTED]'
```

---

#### maskPII(text)

Mask PII in text.

```typescript
maskPII(text: string): string
```

**Example:**

```javascript
const masked = nadi.maskPII('Contact john@example.com');
// 'Contact [EMAIL]'
```

---

#### detectPII(text)

Detect PII presence in text.

```typescript
detectPII(text: string): { hasPII: boolean; types: string[]; count: number }
```

**Example:**

```javascript
const result = nadi.detectPII('Call 555-123-4567 or email test@test.com');
// { hasPII: true, types: ['phone', 'email'], count: 2 }
```

---

### Sampling Methods

#### shouldSampleSession()

Check if the current session should be sampled.

```typescript
shouldSampleSession(): boolean
```

---

#### getSamplingDecision()

Get the current sampling decision with details.

```typescript
getSamplingDecision(): { sampled: boolean; reason: string; rate: number } | null
```

**Example:**

```javascript
const decision = nadi.getSamplingDecision();
// { sampled: true, reason: 'error_occurred', rate: 1.0 }
```

---

#### forceSampleSession()

Force the current session to be sampled.

```typescript
forceSampleSession(): void
```

**Example:**

```javascript
// Force sampling for important users
if (user.isPremium) {
  nadi.forceSampleSession();
}
```

---

## Complete Example

```javascript
import Nadi from '@nadi-pro/browser';

// Initialize with full configuration
Nadi.init({
  url: 'https://nadi.example.com',
  apiKey: 'your-sanctum-token',
  appKey: 'your-application-key',
  release: '2.1.0',
  environment: 'production',
  tracingEnabled: true,
  propagateTraceUrls: ['https://api.example.com'],
  privacyEnabled: true,
});

// Get instance
const nadi = Nadi.getInstance();

// User authentication
async function handleLogin(credentials) {
  try {
    const user = await auth.login(credentials);
    nadi.setUser(user.id);
    nadi.addBreadcrumb('custom', 'User logged in', {
      method: 'email',
    });
    nadi.trackEvent('login_success', 'auth');
    return user;
  } catch (error) {
    await nadi.captureError(error, {
      action: 'login',
    });
    nadi.trackEvent('login_failed', 'auth');
    throw error;
  }
}

// API call with tracing
async function fetchUserData(userId) {
  const headers = nadi.getTraceHeaders('https://api.example.com');

  const start = performance.now();
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    headers,
  });
  nadi.trackTiming('api_fetch_user', performance.now() - start);

  return response.json();
}

// Error handling
async function processPayment(data) {
  try {
    nadi.addBreadcrumb('custom', 'Payment started', {
      amount: data.amount,
    });

    const result = await paymentService.process(data);

    nadi.trackEvent('payment_completed', 'conversion', data.amount, {
      currency: data.currency,
    });

    return result;
  } catch (error) {
    await nadi.captureError(error, {
      action: 'payment',
      amount: data.amount,
    });
    nadi.trackEvent('payment_failed', 'conversion');
    await nadi.reportCrash();
    throw error;
  }
}

// Cleanup
window.addEventListener('beforeunload', async () => {
  await nadi.flush();
  await nadi.stop();
});
```

## Next Steps

- [Types](02-types.md) - Type definitions
- [Utilities](03-utilities.md) - Utility functions
