# Quick Start

Get the Nadi Browser SDK running in your application in under 5 minutes.

## Basic Setup

### Step 1: Import the SDK

```javascript
import Nadi from '@nadi/browser';
```

### Step 2: Initialize

Add this code as early as possible in your application (before any user interactions):

```javascript
Nadi.init({
  url: 'https://your-nadi-instance.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
  release: '1.0.0',
  environment: 'production',
});
```

That's it! The SDK will automatically:

- Start a new session
- Collect Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- Capture JavaScript errors
- Track user actions as breadcrumbs

## Getting Your Credentials

### Application Token

1. Log in to your Nadi dashboard
2. Navigate to **Applications**
3. Select your application or create a new one
4. Copy the **Application Token**

### Bearer Token

1. Navigate to **API Tokens** in your profile
2. Create a new token with appropriate permissions
3. Copy the **Bearer Token**

## Identifying Users

After a user logs in, identify them for better error tracking:

```javascript
const nadi = Nadi.getInstance();

// After successful login
nadi.setUser('user-123');
```

## Verifying It Works

Enable debug mode to see SDK activity in the console:

```javascript
Nadi.init({
  url: 'https://your-nadi-instance.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
  debug: true, // Enable debug logging
});
```

You should see messages like:

```text
[Nadi] Nadi SDK initialized {...}
[Nadi] Breadcrumb collection started
[Nadi] Session started {...}
[Nadi] Web Vitals collection started
[Nadi] Error tracking started
```

## Testing Error Capture

Trigger a test error to verify error tracking:

```javascript
// In browser console
throw new Error('Test error from Nadi SDK');
```

Check your Nadi dashboard - the error should appear within seconds.

## Testing Web Vitals

Web Vitals are sent when the user leaves the page. To test:

1. Load your page
2. Interact with it (click, scroll)
3. Navigate away or close the tab
4. Check your Nadi dashboard for vitals data

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>Welcome to My App</h1>

  <script src="https://unpkg.com/@nadi/browser/dist/nadi.umd.js"></script>
  <script>
    // Initialize as early as possible
    Nadi.init({
      url: 'https://your-nadi-instance.com',
      token: 'your-app-token',
      apiKey: 'your-bearer-token',
      release: '1.0.0',
      environment: 'production',
      debug: true,
    });

    // Identify user after login (example)
    function onUserLogin(user) {
      const nadi = Nadi.getInstance();
      nadi.setUser(user.id);
    }
  </script>
</body>
</html>
```

## Next Steps

- [Configuration](03-configuration.md) - Customize SDK behavior
- [Session Tracking](../02-features/01-session-tracking.md) - Learn about sessions
- [Web Vitals](../02-features/02-web-vitals.md) - Understand metrics collected
