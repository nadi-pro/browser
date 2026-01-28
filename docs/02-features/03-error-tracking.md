# Error Tracking

The SDK automatically captures JavaScript errors and unhandled promise rejections.

## Overview

Error tracking captures:

- **Runtime errors** - Uncaught exceptions
- **Promise rejections** - Unhandled promise failures
- **Manual captures** - Errors you explicitly capture

Each error includes stack trace, breadcrumbs, and session context.

## Automatic Capture

### JavaScript Errors

The SDK listens to the global `error` event:

```javascript
// Automatically captured
throw new Error('Something went wrong');

// Also captured
button.addEventListener('click', () => {
  undefinedFunction(); // ReferenceError
});
```

### Unhandled Promise Rejections

```javascript
// Automatically captured
Promise.reject('Failed to load data');

// Also captured
async function fetchData() {
  throw new Error('Network error');
}
fetchData(); // Unhandled if no .catch()
```

## Manual Capture

### Capture Error

Capture errors within try-catch blocks:

```javascript
const nadi = Nadi.getInstance();

try {
  riskyOperation();
} catch (error) {
  await nadi.captureError(error, {
    context: 'checkout',
    orderId: '12345',
  });
}
```

### Capture Message

Capture non-error messages:

```javascript
const nadi = Nadi.getInstance();

if (response.status === 500) {
  await nadi.captureMessage('Server returned 500', {
    url: response.url,
    status: response.status,
  });
}
```

## Error Payload

Each error includes:

```typescript
interface ErrorPayload {
  message: string;       // Error message
  stack?: string;        // Stack trace
  filename?: string;     // Source file
  lineno?: number;       // Line number
  colno?: number;        // Column number
  type?: string;         // Error type (TypeError, etc.)
  sessionId?: string;    // Current session
  pageUrl: string;       // Page URL
  userAgent: string;     // Browser user agent
  breadcrumbs: Breadcrumb[]; // Recent user actions
}
```

## Configuration

### Disable Auto Capture

```javascript
Nadi.init({
  // ...
  autoErrors: false, // Only capture manually
});
```

## Error Filtering

The SDK automatically ignores:

### Cross-Origin Script Errors

```javascript
// Ignored: "Script error." without filename
// These come from scripts on other domains
```

### Browser Extension Errors

```javascript
// Ignored: Errors from chrome-extension://, moz-extension://
```

### Common Third-Party Scripts

```javascript
// Ignored: Errors from:
// - googletagmanager.com
// - google-analytics.com
// - facebook.net
// - doubleclick.net
```

## Error Grouping

Errors are grouped (deduplicated) on the server by:

- Error message
- Filename
- Line number

This means multiple occurrences of the same error are counted but not stored separately.

## Stack Traces

### Source Maps

For readable stack traces in production, use source maps. The SDK sends raw stack traces -
your Nadi instance processes them.

### Stack Trace Example

```text
TypeError: Cannot read property 'name' of undefined
    at UserProfile.render (app.js:42:15)
    at Component.update (framework.js:123:8)
    at handleClick (app.js:28:5)
```

## Breadcrumbs in Errors

Errors automatically include recent breadcrumbs:

```json
{
  "message": "Cannot read property 'name' of undefined",
  "breadcrumbs": [
    { "type": "click", "message": "Click on button#submit" },
    { "type": "fetch", "message": "POST /api/users - 200" },
    { "type": "navigation", "message": "Navigate to /profile" }
  ]
}
```

This provides context for debugging.

## API Endpoint

Errors are sent to:

```text
POST /api/rum/errors
```

## Examples

### Catching Async Errors

```javascript
const nadi = Nadi.getInstance();

async function loadUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    await nadi.captureError(error, {
      userId,
      operation: 'loadUserData',
    });
    throw error; // Re-throw if needed
  }
}
```

### Error Boundaries (React)

```javascript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    const nadi = Nadi.getInstance();
    nadi.captureError(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Vue Error Handler

```javascript
app.config.errorHandler = (error, instance, info) => {
  const nadi = Nadi.getInstance();
  nadi.captureError(error, {
    component: instance?.$options?.name,
    info,
  });
};
```

### Critical Error Handling

```javascript
const nadi = Nadi.getInstance();

async function handlePayment(paymentData) {
  try {
    await processPayment(paymentData);
  } catch (error) {
    // Capture the error
    await nadi.captureError(error, {
      type: 'payment_failure',
      amount: paymentData.amount,
    });

    // Mark as crash for stability metrics
    await nadi.reportCrash();

    // Show error to user
    showPaymentError(error);
  }
}
```

## Best Practices

### 1. Add Context to Errors

Include relevant data for debugging:

```javascript
try {
  await updateUser(userId, data);
} catch (error) {
  nadi.captureError(error, {
    userId,
    action: 'updateUser',
    data: sanitize(data), // Remove sensitive info
  });
}
```

### 2. Don't Capture Expected Errors

Avoid noise from expected conditions:

```javascript
try {
  const user = await findUser(id);
  if (!user) {
    // Don't capture - this is expected
    return null;
  }
} catch (error) {
  // Do capture - this is unexpected
  nadi.captureError(error);
}
```

### 3. Sanitize Sensitive Data

Never include passwords, tokens, or PII:

```javascript
nadi.captureError(error, {
  userId: user.id,
  // email: user.email,  // Don't include PII
  // password: password,  // Never include passwords
});
```

### 4. Use Error Types

Create specific error types for better grouping:

```javascript
class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
  }
}

throw new PaymentError('Card declined', 'CARD_DECLINED');
```

## Next Steps

- [Breadcrumbs](04-breadcrumbs.md) - User action tracking
- [Session Tracking](01-session-tracking.md) - Session context
- [API Reference](../03-api-reference/01-nadi-class.md) - Full API
