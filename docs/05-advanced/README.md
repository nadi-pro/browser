# Advanced

Advanced topics and configurations for the Nadi Browser SDK.

## Overview

This section covers advanced usage patterns, performance optimization, and customization options.

## Table of Contents

### [1. Sampling](01-sampling.md)

Strategies for reducing data volume on high-traffic sites.

### [2. Custom Transport](02-custom-transport.md)

Advanced transport configuration and custom implementations.

### [3. Distributed Tracing](03-distributed-tracing.md)

Correlate frontend events with backend traces using W3C Trace Context.

### [4. Privacy](04-privacy.md)

PII detection, masking, and data scrubbing configuration.

## When to Use Advanced Features

Consider advanced configurations when:

- **High traffic** - Millions of page views per day
- **Cost optimization** - Reducing API calls
- **Backend correlation** - Connecting frontend errors to backend traces
- **Privacy compliance** - GDPR, CCPA, or other data protection requirements
- **Custom requirements** - Special network or security needs
- **Performance tuning** - Minimizing SDK overhead

## Quick Reference

### Sampling

```javascript
Nadi.init({
  sampleRate: 0.1,  // 10% of sessions
  alwaysSampleErrors: true,
  alwaysSampleSlowSessions: true,
  samplingRules: [
    { name: 'checkout', rate: 1.0, priority: 10, conditions: { routes: ['/checkout'] } },
  ],
});
```

### Distributed Tracing

```javascript
Nadi.init({
  tracingEnabled: true,
  propagateTraceUrls: ['https://api.example.com'],
  traceState: 'vendor=value',
});
```

### Privacy Masking

```javascript
Nadi.init({
  privacyEnabled: true,
  sensitiveUrlParams: ['token', 'key'],
  maskingStrategy: 'partial',
  sensitiveFields: ['ssn', 'credit_card'],
});
```

### Manual Control

```javascript
Nadi.init({
  autoSession: false,
  autoVitals: false,
  autoErrors: false,
  autoBreadcrumbs: false,
});
```

## Related Documentation

- [Configuration](../01-getting-started/03-configuration.md) - All options
- [Web Vitals](../02-features/02-web-vitals.md) - Vitals sampling
- [API Reference](../03-api-reference/README.md) - Full API
