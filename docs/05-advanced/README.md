# Advanced

Advanced topics and configurations for the Nadi Browser SDK.

## Overview

This section covers advanced usage patterns, performance optimization, and customization options.

## Table of Contents

### [1. Sampling](01-sampling.md)

Strategies for reducing data volume on high-traffic sites.

### [2. Custom Transport](02-custom-transport.md)

Advanced transport configuration and custom implementations.

## When to Use Advanced Features

Consider advanced configurations when:

- **High traffic** - Millions of page views per day
- **Cost optimization** - Reducing API calls
- **Custom requirements** - Special network or security needs
- **Performance tuning** - Minimizing SDK overhead

## Quick Reference

### Sampling

```javascript
Nadi.init({
  // ...
  sampleRate: 0.1, // 10% of sessions
});
```

### Manual Control

```javascript
Nadi.init({
  // ...
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
