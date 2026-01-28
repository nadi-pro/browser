# Distributed Tracing

Correlate frontend events with backend traces using W3C Trace Context.

## Overview

Distributed tracing connects frontend performance and errors to backend services, providing
end-to-end visibility across your entire stack.

## How It Works

```text
┌─────────────┐     traceparent header     ┌─────────────┐
│   Browser   │ ──────────────────────────► │   Backend   │
│  (Nadi SDK) │                             │   Service   │
│             │                             │             │
│  traceId:   │                             │  traceId:   │
│  abc123...  │                             │  abc123...  │
│             │                             │             │
│  spanId:    │     Same trace context      │  spanId:    │
│  def456...  │ ◄────────────────────────── │  ghi789...  │
└─────────────┘                             └─────────────┘
```

## Configuration

### Basic Setup

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  apiKey: 'your-api-key',
  appKey: 'your-app-key',

  // Enable tracing
  tracingEnabled: true,

  // URLs to propagate trace headers to
  propagateTraceUrls: [
    'https://api.example.com',
  ],
});
```

### Advanced Setup

```javascript
Nadi.init({
  tracingEnabled: true,

  // Multiple patterns
  propagateTraceUrls: [
    'https://api.example.com',
    /^https:\/\/.*\.example\.com\/api/,  // Regex pattern
    'https://cdn.example.com',
  ],

  // Custom trace state
  traceState: 'myvendor=myvalue',
});
```

## W3C Trace Context Headers

The SDK propagates standard W3C Trace Context headers:

### traceparent

```text
00-{trace-id}-{span-id}-{trace-flags}
00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

| Part | Description |
|------|-------------|
| `00` | Version (always 00) |
| `trace-id` | 32 hex characters (128-bit) |
| `span-id` | 16 hex characters (64-bit) |
| `trace-flags` | 01 = sampled, 00 = not sampled |

### tracestate

Optional vendor-specific key-value pairs:

```text
vendor1=value1,vendor2=value2
```

## API Methods

### getTraceContext()

Get the current trace context.

```javascript
const nadi = Nadi.getInstance();
const context = nadi.getTraceContext();

// {
//   traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
//   spanId: '00f067aa0ba902b7',
//   sampled: true,
//   traceState: 'myvendor=myvalue'
// }
```

### getTraceId()

Get just the trace ID.

```javascript
const traceId = nadi.getTraceId();
// '4bf92f3577b34da6a3ce929d0e0e4736'
```

### getTraceHeaders(url)

Get headers for an outgoing request.

```javascript
const headers = nadi.getTraceHeaders('https://api.example.com/users');

// If URL matches propagateTraceUrls:
// {
//   traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
//   tracestate: 'myvendor=myvalue'
// }

// If URL doesn't match:
// {}
```

### adoptTraceContext(context)

Adopt a trace context from the server (for server-rendered pages).

```javascript
// Server renders trace context in HTML
// <meta name="trace-id" content="abc123...">
// <meta name="span-id" content="def456...">

const traceId = document.querySelector('meta[name="trace-id"]')?.content;
const spanId = document.querySelector('meta[name="span-id"]')?.content;

if (traceId && spanId) {
  nadi.adoptTraceContext({
    traceId,
    spanId,
    sampled: true,
  });
}
```

## Usage Patterns

### Manual Fetch Integration

```javascript
const nadi = Nadi.getInstance();

async function fetchAPI(endpoint) {
  const url = `https://api.example.com${endpoint}`;
  const headers = nadi.getTraceHeaders(url);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  return response.json();
}
```

### Axios Interceptor

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
});

api.interceptors.request.use((config) => {
  const nadi = Nadi.getInstance();
  if (nadi) {
    const url = `${config.baseURL}${config.url}`;
    const traceHeaders = nadi.getTraceHeaders(url);
    config.headers = {
      ...config.headers,
      ...traceHeaders,
    };
  }
  return config;
});
```

### GraphQL Client

```javascript
import { ApolloClient, ApolloLink } from '@apollo/client';

const tracingLink = new ApolloLink((operation, forward) => {
  const nadi = Nadi.getInstance();
  if (nadi) {
    const headers = nadi.getTraceHeaders('https://api.example.com/graphql');
    operation.setContext(({ headers: existingHeaders }) => ({
      headers: {
        ...existingHeaders,
        ...headers,
      },
    }));
  }
  return forward(operation);
});

const client = new ApolloClient({
  link: ApolloLink.from([tracingLink, httpLink]),
});
```

## Backend Integration

### Node.js / Express

```javascript
const { trace, context, SpanKind } = require('@opentelemetry/api');

app.use((req, res, next) => {
  const traceparent = req.headers['traceparent'];

  if (traceparent) {
    // Parse and use the trace context
    const [version, traceId, spanId, flags] = traceparent.split('-');

    // Create span with parent context
    const tracer = trace.getTracer('my-service');
    const span = tracer.startSpan('http-request', {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
      },
    });

    // Store for later use
    req.traceId = traceId;
    req.spanId = span.spanContext().spanId;
  }

  next();
});
```

### Laravel / PHP

```php
use Illuminate\Http\Request;

class TraceMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $traceparent = $request->header('traceparent');

        if ($traceparent) {
            [$version, $traceId, $spanId, $flags] = explode('-', $traceparent);

            // Store in context
            app()->instance('trace.id', $traceId);
            app()->instance('trace.parent_span', $spanId);
        }

        return $next($request);
    }
}
```

## Error Correlation

When errors occur, they include correlated requests:

```javascript
// Error payload includes:
{
  message: 'Failed to fetch user data',
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '00f067aa0ba902b7',
  correlatedRequests: [
    {
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: 'abc123...',
      url: 'https://api.example.com/users/123',
      method: 'GET',
      status: 500,
      duration: 1234,
    }
  ]
}
```

## Best Practices

### 1. Only Propagate to Trusted Services

```javascript
// Good: specific trusted URLs
propagateTraceUrls: [
  'https://api.example.com',
  'https://internal-service.example.com',
]

// Bad: too broad
propagateTraceUrls: [
  /.*/,  // Propagates to ALL URLs including third parties
]
```

### 2. Use Regex for Dynamic Subdomains

```javascript
propagateTraceUrls: [
  /^https:\/\/api-[a-z]+\.example\.com/,  // api-us.example.com, api-eu.example.com
]
```

### 3. Include Vendor Trace State

```javascript
Nadi.init({
  traceState: 'nadi=browser,version=2.0',
});
```

### 4. Handle Server-Rendered Contexts

```javascript
// In your layout/template
useEffect(() => {
  const metaTrace = document.querySelector('meta[name="trace-id"]');
  if (metaTrace) {
    nadi.adoptTraceContext({
      traceId: metaTrace.content,
      spanId: document.querySelector('meta[name="span-id"]')?.content,
      sampled: true,
    });
  }
}, []);
```

## Troubleshooting

### Headers Not Being Sent

Check that your URL matches the `propagateTraceUrls` pattern:

```javascript
const nadi = Nadi.getInstance();

// Debug: check if URL matches
console.log('Headers:', nadi.getTraceHeaders('https://api.example.com/test'));
// If empty {}, URL doesn't match any pattern
```

### CORS Issues

Ensure your backend allows the trace headers:

```javascript
// Backend CORS configuration
app.use(cors({
  allowedHeaders: ['traceparent', 'tracestate', 'Content-Type'],
}));
```

### Missing Trace Context

Ensure tracing is enabled:

```javascript
const context = nadi.getTraceContext();
console.log('Tracing enabled:', context !== null);
```

## Related Documentation

- [Configuration](../01-getting-started/03-configuration.md) - All options
- [API Reference](../03-api-reference/01-nadi-class.md) - Tracing methods
- [Error Tracking](../02-features/03-error-tracking.md) - Error correlation
