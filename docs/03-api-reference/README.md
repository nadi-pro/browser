# API Reference

Complete API documentation for the Nadi Browser SDK.

## Overview

The SDK exports a main `Nadi` class along with types, managers, and utility functions.

## Table of Contents

### [1. Nadi Class](01-nadi-class.md)

The main SDK class with all public methods.

### [2. Types](02-types.md)

TypeScript interfaces and type definitions.

### [3. Utilities](03-utilities.md)

Exported utility functions for advanced usage.

## Quick Reference

### Initialization

```javascript
import Nadi from '@nadi-pro/browser';

const nadi = Nadi.init({
  url: 'https://nadi.example.com',
  apiKey: 'your-sanctum-token',
  appKey: 'your-application-key',
});
```

### Get Instance

```javascript
const nadi = Nadi.getInstance();
```

### Session Methods

```javascript
nadi.getSession();     // Get session data
nadi.getSessionId();   // Get session ID
nadi.setUser(userId);  // Set user identifier
nadi.reportCrash();    // Report a crash
```

### Error Methods

```javascript
nadi.captureError(error, context);     // Capture an error
nadi.captureMessage(message, context); // Capture a message
```

### Breadcrumb Methods

```javascript
nadi.addBreadcrumb(type, message, data); // Add breadcrumb
nadi.getBreadcrumbs();                   // Get all breadcrumbs
nadi.clearBreadcrumbs();                 // Clear breadcrumbs
```

### Vitals Methods

```javascript
nadi.getVitals();   // Get collected metrics
nadi.flushVitals(); // Send metrics immediately
```

### Custom Events

```javascript
nadi.trackEvent(name, category, value, tags);  // Track custom event
nadi.trackTiming(name, duration, tags);        // Track timing event
```

### Distributed Tracing

```javascript
nadi.getTraceContext();              // Get current trace context
nadi.getTraceId();                   // Get current trace ID
nadi.getTraceHeaders(url);           // Get headers for outgoing request
nadi.adoptTraceContext(context);     // Adopt server-rendered trace
```

### Privacy

```javascript
nadi.scrubUrl(url);      // Remove PII from URL
nadi.maskPII(text);      // Mask PII in text
nadi.detectPII(text);    // Detect PII presence
```

### Sampling

```javascript
nadi.shouldSampleSession();    // Check if session is sampled
nadi.getSamplingDecision();    // Get sampling decision details
nadi.forceSampleSession();     // Force session to be sampled
```

### Lifecycle

```javascript
nadi.flush();  // Flush all pending data
nadi.stop();   // Stop all collectors
```

## Imports

```javascript
// Default import
import Nadi from '@nadi-pro/browser';

// Named imports - Types
import type {
  NadiConfig,
  Breadcrumb,
  BreadcrumbType,
  SessionData,
  VitalMetric,
  DeviceInfo,
  ErrorPayload,
  VitalsPayload,
  ResourceEntry,
  LongTaskEntry,
  CustomEventEntry,
  RageClickEntry,
  NetworkRequestEntry,
  PageLoadEntry,
  MemorySampleEntry,
  UserInteractionEntry,
  InteractionType,
  TraceContext,
  CorrelatedRequest,
  SamplingRuleConfig,
} from '@nadi-pro/browser';

// Named imports - Managers
import {
  TracingManager,
  PrivacyManager,
  SamplingManager,
} from '@nadi-pro/browser';

// Named imports - Utilities
import {
  getDeviceInfo,
  getPageUrl,
  getRoutePattern,
  getMetricThresholds,
  getMetricRating,
} from '@nadi-pro/browser';
```

## Related Documentation

- [Configuration](../01-getting-started/03-configuration.md) - Config options
- [Features](../02-features/README.md) - Feature details
- [Advanced](../05-advanced/README.md) - Tracing, privacy, sampling
