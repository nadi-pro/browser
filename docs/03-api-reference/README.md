# API Reference

Complete API documentation for the Nadi Browser SDK.

## Overview

The SDK exports a main `Nadi` class and several types and utility functions.

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
import Nadi from '@nadi/browser';

const nadi = Nadi.init({
  url: 'https://nadi.example.com',
  appToken: 'your-app-token',
  bearerToken: 'your-bearer-token',
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
nadi.captureError(error, context);   // Capture an error
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

### Lifecycle

```javascript
nadi.stop(); // Stop all collectors
```

## Imports

```javascript
// Default import
import Nadi from '@nadi/browser';

// Named imports
import {
  Nadi,
  NadiConfig,
  Breadcrumb,
  BreadcrumbType,
  SessionData,
  VitalMetric,
  DeviceInfo,
  ErrorPayload,
  VitalsPayload,
  getDeviceInfo,
  getPageUrl,
  getRoutePattern,
  getMetricThresholds,
  getMetricRating,
} from '@nadi/browser';
```

## Related Documentation

- [Configuration](../01-getting-started/03-configuration.md) - Config options
- [Features](../02-features/README.md) - Feature details
