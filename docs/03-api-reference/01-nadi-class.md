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
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
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

## Complete Example

```javascript
import Nadi from '@nadi/browser';

// Initialize
Nadi.init({
  url: 'https://nadi.example.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
  release: '2.1.0',
  environment: 'production',
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
    return user;
  } catch (error) {
    await nadi.captureError(error, {
      action: 'login',
    });
    throw error;
  }
}

// Feature tracking
function trackFeature(name) {
  nadi.addBreadcrumb('custom', `Feature used: ${name}`);
}

// Error handling
async function processPayment(data) {
  try {
    const result = await paymentService.process(data);
    nadi.addBreadcrumb('custom', 'Payment processed', {
      amount: data.amount,
    });
    return result;
  } catch (error) {
    await nadi.captureError(error, {
      action: 'payment',
      amount: data.amount,
    });
    await nadi.reportCrash();
    throw error;
  }
}

// Cleanup
window.addEventListener('beforeunload', async () => {
  await nadi.stop();
});
```

## Next Steps

- [Types](02-types.md) - Type definitions
- [Utilities](03-utilities.md) - Utility functions
