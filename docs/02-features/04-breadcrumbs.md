# Breadcrumbs

Breadcrumbs track user actions leading up to an error, providing context for debugging.

## Overview

The SDK automatically captures:

- **Clicks** - Button clicks, link clicks
- **Navigation** - Route changes, history events
- **Console** - Console logs, warnings, errors
- **Fetch** - HTTP requests via `fetch()`
- **XHR** - HTTP requests via `XMLHttpRequest`

## How It Works

```text
User Actions
    │
    ▼
┌─────────────────┐
│ BreadcrumbCollector │
│  (circular buffer)  │
└─────────────────┘
    │
    ▼ (on error)
┌─────────────────┐
│   Error Report   │
│ + breadcrumbs    │
└─────────────────┘
```

Breadcrumbs are stored in a circular buffer (default: 50 items). When an error occurs,
recent breadcrumbs are included in the error report.

## Breadcrumb Types

| Type | Description | Example |
|------|-------------|---------|
| `click` | User clicks | "Click on button#submit" |
| `navigation` | Route changes | "Navigate to /dashboard" |
| `console` | Console output | "[error] Failed to load" |
| `fetch` | Fetch requests | "GET /api/users - 200" |
| `xhr` | XHR requests | "POST /api/login - 401" |
| `error` | Error occurred | "Error captured" |
| `custom` | Manual breadcrumb | Your custom message |

## Configuration

### Disable Auto Breadcrumbs

```javascript
Nadi.init({
  // ...
  autoBreadcrumbs: false,
});
```

### Max Breadcrumbs

```javascript
Nadi.init({
  // ...
  maxBreadcrumbs: 100, // Keep more (default: 50)
});
```

## API Methods

### Add Custom Breadcrumb

```javascript
const nadi = Nadi.getInstance();

nadi.addBreadcrumb('custom', 'User started checkout', {
  cartItems: 3,
  total: 99.99,
});
```

### Get All Breadcrumbs

```javascript
const nadi = Nadi.getInstance();

const breadcrumbs = nadi.getBreadcrumbs();
// [
//   { type: "click", message: "Click on button#add-to-cart", timestamp: ... },
//   { type: "fetch", message: "POST /api/cart - 200", timestamp: ... },
//   { type: "custom", message: "User started checkout", timestamp: ... }
// ]
```

### Clear Breadcrumbs

```javascript
const nadi = Nadi.getInstance();

nadi.clearBreadcrumbs();
```

## Breadcrumb Data Structure

```typescript
interface Breadcrumb {
  type: BreadcrumbType;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}
```

## Auto-Captured Details

### Click Tracking

```javascript
// Click on <button id="submit">Save</button>
{
  type: "click",
  message: "Click on button#submit: \"Save\"",
  data: {
    selector: "button#submit",
    tagName: "button",
    id: "submit"
  }
}
```

### Navigation Tracking

```javascript
// Navigate to /dashboard
{
  type: "navigation",
  message: "Navigate to /dashboard",
  data: {
    url: "https://example.com/dashboard",
    method: "pushState" // or "popstate", "replaceState"
  }
}
```

### Console Tracking

```javascript
// console.error('Failed to load user')
{
  type: "console",
  message: "[error] Failed to load user",
  data: {
    level: "error"
  }
}
```

### Fetch Tracking

```javascript
// fetch('/api/users')
{
  type: "fetch",
  message: "GET /api/users - 200",
  data: {
    url: "/api/users",
    method: "GET",
    status: 200
  }
}
```

### XHR Tracking

```javascript
// XMLHttpRequest to /api/data
{
  type: "xhr",
  message: "POST /api/data - 201",
  data: {
    url: "/api/data",
    method: "POST",
    status: 201
  }
}
```

## Examples

### Tracking User Flow

```javascript
const nadi = Nadi.getInstance();

// User views product
nadi.addBreadcrumb('custom', 'Viewed product', {
  productId: 'SKU-123',
  productName: 'Widget Pro',
});

// User adds to cart
nadi.addBreadcrumb('custom', 'Added to cart', {
  productId: 'SKU-123',
  quantity: 2,
});

// User starts checkout
nadi.addBreadcrumb('custom', 'Started checkout', {
  cartTotal: 199.98,
  itemCount: 2,
});
```

### Tracking Form Steps

```javascript
const nadi = Nadi.getInstance();

function handleStepChange(step, data) {
  nadi.addBreadcrumb('custom', `Form step: ${step}`, {
    step,
    valid: data.isValid,
  });
}
```

### Tracking Feature Usage

```javascript
const nadi = Nadi.getInstance();

function trackFeature(feature, action) {
  nadi.addBreadcrumb('custom', `${feature}: ${action}`, {
    feature,
    action,
    timestamp: Date.now(),
  });
}

// Usage
trackFeature('Export', 'Started PDF export');
trackFeature('Export', 'Completed PDF export');
```

## Breadcrumbs in Error Reports

When an error occurs, breadcrumbs provide the "trail" of user actions:

```json
{
  "message": "Cannot read property 'items' of undefined",
  "type": "TypeError",
  "breadcrumbs": [
    {
      "type": "navigation",
      "message": "Navigate to /cart",
      "timestamp": 1706234560000
    },
    {
      "type": "fetch",
      "message": "GET /api/cart - 200",
      "timestamp": 1706234561000
    },
    {
      "type": "click",
      "message": "Click on button#checkout",
      "timestamp": 1706234565000
    },
    {
      "type": "fetch",
      "message": "POST /api/checkout - 500",
      "timestamp": 1706234566000
    }
  ]
}
```

## Best Practices

### 1. Add Context at Key Points

```javascript
// Login
nadi.addBreadcrumb('custom', 'User logged in', { method: 'email' });

// Important actions
nadi.addBreadcrumb('custom', 'User upgraded plan', { plan: 'pro' });

// Feature toggles
nadi.addBreadcrumb('custom', 'Feature enabled', { feature: 'darkMode' });
```

### 2. Include Relevant Data

```javascript
// Good - includes useful context
nadi.addBreadcrumb('custom', 'Search performed', {
  query: searchTerm,
  resultsCount: results.length,
  filters: activeFilters,
});

// Bad - no context
nadi.addBreadcrumb('custom', 'Search');
```

### 3. Don't Include Sensitive Data

```javascript
// Good - no sensitive data
nadi.addBreadcrumb('custom', 'Payment submitted', {
  amount: 99.99,
  currency: 'USD',
});

// Bad - includes sensitive data
nadi.addBreadcrumb('custom', 'Payment submitted', {
  cardNumber: '4111...', // Never include!
  cvv: '123', // Never include!
});
```

### 4. Use Descriptive Messages

```javascript
// Good - descriptive
nadi.addBreadcrumb('custom', 'User changed shipping address to California');

// Bad - vague
nadi.addBreadcrumb('custom', 'Address changed');
```

## Next Steps

- [Error Tracking](03-error-tracking.md) - How breadcrumbs are used
- [API Reference](../03-api-reference/01-nadi-class.md) - Full API
- [Configuration](../01-getting-started/03-configuration.md) - Options
