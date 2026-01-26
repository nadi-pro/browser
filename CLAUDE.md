# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nadi-js is the official JavaScript/TypeScript SDK for Nadi - a Real User Monitoring (RUM) library for web applications. It provides browser-side monitoring including Core Web Vitals, session tracking, error capture, and user action breadcrumbs.

## Technology Stack

- **Language**: TypeScript
- **Build**: Rollup (UMD, ESM, CJS outputs)
- **Dependencies**: web-vitals (Google's Web Vitals library)
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier

## Development Commands

### Setup

```bash
# Install dependencies
npm install
```

### Development

```bash
# Build the SDK
npm run build

# Watch mode for development
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Architecture

### Source Structure

```
src/
├── index.ts        # Main entry point, Nadi class (singleton)
├── types.ts        # TypeScript interfaces and types
├── session.ts      # SessionManager - session lifecycle tracking
├── vitals.ts       # VitalsCollector - Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
├── errors.ts       # ErrorTracker - JS error and unhandled rejection capture
├── breadcrumbs.ts  # BreadcrumbCollector - user action tracking
├── transport.ts    # HTTP transport (sendBeacon/fetch)
└── utils.ts        # Utilities (device info, session ID generation)
```

### Key Components

**Nadi (index.ts)**
- Singleton pattern via `Nadi.init()` and `Nadi.getInstance()`
- Orchestrates all collectors
- Public API for manual error capture, breadcrumbs, etc.

**SessionManager (session.ts)**
- Manages session lifecycle (start, end, crash)
- Tracks user activity for session timeout
- Sends session data to `/api/sessions/*` endpoints

**VitalsCollector (vitals.ts)**
- Collects Core Web Vitals using web-vitals library
- Sends metrics on page unload via `/api/rum/vitals`
- Supports sampling rate configuration

**ErrorTracker (errors.ts)**
- Captures `error` and `unhandledrejection` events
- Filters out extension/cross-origin errors
- Sends errors to `/api/rum/errors`

**BreadcrumbCollector (breadcrumbs.ts)**
- Tracks clicks, navigation, console, fetch, XHR
- Maintains circular buffer (default 50 items)
- Included with error reports for context

### API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions/start` | POST | Start session |
| `/api/sessions/end` | POST | End session |
| `/api/sessions/crash` | POST | Report crash |
| `/api/rum/vitals` | POST | Send Web Vitals |
| `/api/rum/errors` | POST | Send JS errors |

### Authentication Headers

All requests include:
```
Authorization: Bearer {bearerToken}
Nadi-App-Token: {appToken}
Nadi-API-Version: v1
Content-Type: application/json
```

## Build Outputs

```
dist/
├── nadi.umd.js     # UMD build for browsers (global Nadi)
├── nadi.esm.js     # ES modules for bundlers
├── nadi.cjs.js     # CommonJS for Node
└── index.d.ts      # TypeScript declarations
```

## Code Standards

- Use TypeScript strict mode
- Export types from `types.ts`
- Use JSDoc comments for public APIs
- Keep bundle size < 10KB gzipped
- Support browsers with ES2020+ features

## Testing Guidelines

- Use Vitest for unit tests
- Mock `window`, `document`, `navigator` for browser APIs
- Test each collector independently
- Test the main Nadi class integration

## Important Notes

- This SDK runs in browsers only (check `typeof window`)
- Use `sendBeacon` for reliability on page unload
- Session ID is generated client-side (`sess_` prefix)
- Device ID persists in localStorage (`nadi_device_id`)
- Web Vitals are sent once per page load on visibility change
- Errors are deduplicated server-side by hash_family
