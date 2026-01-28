# Installation

This guide covers the different ways to install the Nadi Browser SDK in your project.

## Package Manager

### npm

```bash
npm install @nadi-pro/browser
```

### yarn

```bash
yarn add @nadi-pro/browser
```

### pnpm

```bash
pnpm add @nadi-pro/browser
```

## CDN

For quick prototyping or non-bundled applications, use the UMD build via CDN:

```html
<script src="https://unpkg.com/@nadi-pro/browser/dist/nadi.umd.js"></script>
```

The SDK will be available globally as `Nadi`:

```html
<script>
  Nadi.init({
    url: 'https://your-nadi-instance.com',
    token: 'your-app-token',
    apiKey: 'your-bearer-token',
  });
</script>
```

## Build Formats

The SDK is distributed in three formats:

| Format | File | Use Case |
|--------|------|----------|
| UMD | `dist/nadi.umd.js` | Browser `<script>` tag, AMD |
| ESM | `dist/nadi.esm.js` | Modern bundlers (Vite, Rollup, webpack) |
| CJS | `dist/nadi.cjs.js` | Node.js, older bundlers |

Modern bundlers automatically select the correct format based on your import syntax.

## TypeScript Support

The SDK includes TypeScript definitions out of the box. No additional `@types` package is required.

```typescript
import Nadi, { NadiConfig, VitalMetric } from '@nadi-pro/browser';

const config: NadiConfig = {
  url: 'https://your-nadi-instance.com',
  token: 'your-app-token',
  apiKey: 'your-bearer-token',
};

Nadi.init(config);
```

## Verifying Installation

After installation, verify by checking the package in your `node_modules`:

```bash
ls node_modules/@nadi-pro/browser
```

Or import and check the version:

```javascript
import Nadi from '@nadi-pro/browser';
console.log('Nadi SDK loaded');
```

## Bundle Size

The SDK is designed to be lightweight:

| Build | Size | Gzipped |
|-------|------|---------|
| UMD   | ~25KB | ~8KB   |
| ESM   | ~20KB | ~7KB   |

> **Note**: The UMD build includes the `web-vitals` dependency, while ESM/CJS builds expect it to be provided by your bundler.

## Next Steps

- [Quick Start](02-quick-start.md) - Initialize the SDK
- [Configuration](03-configuration.md) - Customize behavior
