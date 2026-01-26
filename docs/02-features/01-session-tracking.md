# Session Tracking

Session tracking enables stability metrics like crash-free sessions and crash-free users rates.

## Overview

A session represents a single user visit to your application. The SDK automatically:

- Creates a new session on page load
- Tracks user activity to extend the session
- Ends the session on page unload or timeout
- Reports crashes when errors occur

## How Sessions Work

```text
┌─────────────────┐
│   Page Load     │  Session starts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Active      │  User interacting
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│  End   │ │ Crash  │
│(normal)│ │(error) │
└────────┘ └────────┘
```

## Session Data

Each session includes:

```typescript
interface SessionData {
  sessionId: string;      // Unique session identifier
  userId?: string;        // User identifier (if set)
  deviceId?: string;      // Persistent device identifier
  startedAt: number;      // Session start timestamp
  lastActivityAt: number; // Last activity timestamp
  releaseVersion?: string;
  environment?: string;
  deviceInfo: DeviceInfo;
}
```

## Configuration

### Session Timeout

Sessions end after a period of inactivity (default: 30 minutes):

```javascript
Nadi.init({
  // ...
  sessionTimeout: 60, // 60 minutes
});
```

### Disable Auto Session

Start sessions manually instead of automatically:

```javascript
Nadi.init({
  // ...
  autoSession: false,
});
```

## API Methods

### Get Current Session

```javascript
const nadi = Nadi.getInstance();

const session = nadi.getSession();
console.log(session.sessionId);    // "sess_abc123"
console.log(session.startedAt);    // 1706234567000
console.log(session.deviceInfo);   // { browser: "Chrome", ... }
```

### Get Session ID

```javascript
const nadi = Nadi.getInstance();

const sessionId = nadi.getSessionId();
// "sess_abc123"
```

### Set User

Associate a user with the current session:

```javascript
const nadi = Nadi.getInstance();

// After user logs in
nadi.setUser('user-123');
```

### Report Crash

Manually report a crash (session ends):

```javascript
const nadi = Nadi.getInstance();

// When a critical error occurs
await nadi.reportCrash();
```

## Session Lifecycle

### Activity Tracking

The SDK tracks these events to detect user activity:

- `mousedown`
- `keydown`
- `scroll`
- `touchstart`

Each activity event resets the session timeout timer.

### Session End

Sessions end when:

1. **Page unload** - User navigates away or closes tab
2. **Visibility change** - Page becomes hidden
3. **Timeout** - No activity for configured duration
4. **Crash** - `reportCrash()` is called

### Page Unload Handling

The SDK uses `navigator.sendBeacon()` for reliable session end reporting:

```javascript
// Automatically handled by SDK
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Session end sent via sendBeacon
  }
});
```

## Device Information

Sessions capture device context:

```typescript
interface DeviceInfo {
  browser: string;        // "Chrome"
  browserVersion: string; // "120"
  os: string;             // "macOS"
  osVersion: string;      // "14.2"
  deviceType: string;     // "desktop" | "mobile" | "tablet"
  connectionType?: string; // "4g" | "wifi"
  screenWidth?: number;   // 1920
  screenHeight?: number;  // 1080
}
```

## Stability Metrics

Sessions enable these metrics in Nadi:

### Crash-Free Sessions

```text
Crash-free sessions = (1 - crashed_sessions / total_sessions) × 100
```

### Crash-Free Users

```text
Crash-free users = (1 - users_with_crashes / total_users) × 100
```

## API Endpoints

Sessions use these Nadi API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions/start` | POST | Start a new session |
| `/api/sessions/end` | POST | End the current session |
| `/api/sessions/crash` | POST | Report a crash |

## Best Practices

### 1. Set User Early

Set the user identifier as soon as they authenticate:

```javascript
async function handleLogin(credentials) {
  const user = await authService.login(credentials);

  // Set user in Nadi
  const nadi = Nadi.getInstance();
  nadi.setUser(user.id);

  return user;
}
```

### 2. Report Critical Errors as Crashes

For errors that significantly impact user experience:

```javascript
async function handleCriticalError(error) {
  const nadi = Nadi.getInstance();

  // Capture the error
  await nadi.captureError(error);

  // Mark as crash for stability metrics
  await nadi.reportCrash();

  // Show error page
  showErrorPage();
}
```

### 3. Use Meaningful Release Versions

Track stability per release:

```javascript
Nadi.init({
  // ...
  release: process.env.APP_VERSION, // "2.1.0"
});
```

## Next Steps

- [Web Vitals](02-web-vitals.md) - Performance metrics
- [Error Tracking](03-error-tracking.md) - Error capture
- [API Reference](../03-api-reference/01-nadi-class.md) - Full API
