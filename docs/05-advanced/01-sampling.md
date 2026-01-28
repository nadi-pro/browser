# Sampling

Strategies for reducing data volume while maintaining statistical significance.

## Overview

For high-traffic applications, collecting data from every user can be:

- **Expensive** - Storage and API costs
- **Overwhelming** - Too much data to analyze
- **Unnecessary** - Statistical sampling provides accurate insights

The Nadi SDK provides multiple sampling mechanisms:

- **Global sample rate** - Simple percentage-based sampling
- **Sampling rules** - Condition-based sampling with priorities
- **Error sampling** - Always capture sessions with errors
- **Slow session sampling** - Always capture slow sessions
- **Adaptive sampling** - Dynamic rate based on error rate

## Sample Rate Configuration

The `sampleRate` option controls Web Vitals collection:

```javascript
Nadi.init({
  sampleRate: 0.1, // Collect from 10% of sessions
});
```

### Sample Rate Values

| Value | Collection Rate | Use Case |
|-------|-----------------|----------|
| `1.0` | 100% | Low traffic, development |
| `0.5` | 50% | Medium traffic |
| `0.1` | 10% | High traffic |
| `0.01` | 1% | Very high traffic |
| `0.001` | 0.1% | Massive scale |

## How Sampling Works

```javascript
// Simplified sampling logic
function shouldSample(sampleRate) {
  return Math.random() < sampleRate;
}

// Called once per session
if (shouldSample(config.sampleRate)) {
  // Collect Web Vitals for this session
  startVitalsCollection();
}
```

> **Note**: Sampling is determined at session start. A sampled session collects all vitals;
> an unsampled session collects none.

## What Gets Sampled

| Feature | Sampled | Notes |
|---------|---------|-------|
| Web Vitals | Yes | Controlled by `sampleRate` |
| Sessions | No | Always tracked for stability |
| Errors | No | Always captured |
| Breadcrumbs | No | Always collected |

## Calculating Required Sample Size

For statistically significant results:

### Formula

```text
Sample Size = (Z² × p × (1-p)) / E²

Where:
Z = Z-score (1.96 for 95% confidence)
p = Expected proportion (0.5 for maximum variance)
E = Margin of error (e.g., 0.05 for ±5%)
```

### Quick Reference

| Daily Users | 95% Confidence (±5%) | Recommended Rate |
|-------------|----------------------|------------------|
| 1,000 | 278 | 100% |
| 10,000 | 370 | 10% |
| 100,000 | 383 | 1% |
| 1,000,000 | 384 | 0.1% |

## Traffic-Based Sampling

Adjust sampling based on traffic levels:

```javascript
function getSampleRate() {
  const dailyUsers = estimateDailyUsers();

  if (dailyUsers < 10000) return 1.0;
  if (dailyUsers < 100000) return 0.1;
  if (dailyUsers < 1000000) return 0.01;
  return 0.001;
}

Nadi.init({
  // ...
  sampleRate: getSampleRate(),
});
```

## Environment-Based Sampling

Different rates for different environments:

```javascript
function getSampleRate() {
  switch (process.env.NODE_ENV) {
    case 'development':
      return 1.0; // Always collect in dev
    case 'staging':
      return 0.5; // 50% in staging
    case 'production':
      return 0.1; // 10% in production
    default:
      return 1.0;
  }
}

Nadi.init({
  // ...
  sampleRate: getSampleRate(),
});
```

## Feature-Based Sampling

Sample specific features more heavily:

```javascript
// Core vitals - light sampling
Nadi.init({
  sampleRate: 0.1,
});

// But always capture errors
// Errors are not sampled - always captured
```

## Consistent User Sampling

For user-consistent sampling across sessions:

```javascript
function getConsistentSampleRate(userId, baseRate) {
  if (!userId) return baseRate;

  // Hash user ID to get consistent 0-1 value
  const hash = hashString(userId);
  const threshold = hash / 0xffffffff;

  return threshold < baseRate;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

## Monitoring Sample Quality

Ensure your sample is representative:

### Check Device Distribution

```javascript
// Server-side analysis
const vitals = await getVitals(lastWeek);

const deviceBreakdown = vitals.reduce((acc, v) => {
  acc[v.deviceType] = (acc[v.deviceType] || 0) + 1;
  return acc;
}, {});

console.log('Device distribution:', deviceBreakdown);
// Should roughly match your actual traffic
```

### Check Geographic Distribution

```javascript
// Compare sampled vs total sessions by region
const sampledRegions = getSampledRegions();
const actualRegions = getActualRegions();

// Look for significant differences
```

## Best Practices

### 1. Start High, Reduce Gradually

```javascript
// Week 1: Full collection
sampleRate: 1.0

// Week 2: After baseline established
sampleRate: 0.5

// Week 3+: Optimized for traffic
sampleRate: 0.1
```

### 2. Never Sample Errors

Errors should always be captured:

```javascript
Nadi.init({
  sampleRate: 0.1, // Only affects vitals
  autoErrors: true, // Always capture errors
});
```

### 3. Maintain Minimum Sample Size

Ensure at least ~400 samples per metric per day:

```javascript
const dailyUsers = 1000000;
const minSamples = 400;
const minRate = minSamples / dailyUsers; // 0.0004

// Use at least minRate
sampleRate: Math.max(0.0004, desiredRate);
```

### 4. Document Your Sampling Strategy

```javascript
/**
 * Sampling Strategy:
 * - Production: 1% (1M+ daily users)
 * - Staging: 50%
 * - Development: 100%
 *
 * Rationale: With 1M daily users, 1% gives ~10,000 samples,
 * well above the 400 minimum for statistical significance.
 */
```

## Advanced Sampling Rules

Define condition-based sampling rules with priorities.

### Configuration

```javascript
Nadi.init({
  sampleRate: 0.1,  // Default: 10%

  samplingRules: [
    {
      name: 'checkout-pages',
      rate: 1.0,      // Always sample checkout
      priority: 10,   // Higher priority = evaluated first
      conditions: {
        routes: ['/checkout', '/payment', '/cart'],
      },
    },
    {
      name: 'mobile-users',
      rate: 0.5,      // 50% for mobile
      priority: 5,
      conditions: {
        deviceTypes: ['mobile'],
      },
    },
    {
      name: 'slow-connections',
      rate: 0.8,      // 80% for slow connections
      priority: 5,
      conditions: {
        connectionTypes: ['2g', '3g', 'slow-2g'],
      },
    },
  ],
});
```

### Rule Conditions

| Condition | Description | Example |
|-----------|-------------|---------|
| `routes` | URL path prefixes | `['/checkout', '/api']` |
| `deviceTypes` | Device categories | `['mobile', 'tablet']` |
| `connectionTypes` | Network types | `['4g', 'wifi']` |

### Priority System

Rules are evaluated in priority order (highest first):

```javascript
samplingRules: [
  { name: 'critical', priority: 100, rate: 1.0, ... },   // Checked first
  { name: 'important', priority: 50, rate: 0.5, ... },   // Checked second
  { name: 'default', priority: 1, rate: 0.1, ... },      // Checked last
]
```

## Error Sampling

Always capture sessions where errors occur:

```javascript
Nadi.init({
  sampleRate: 0.1,           // Normal: 10%
  alwaysSampleErrors: true,  // Sessions with errors: 100%
});
```

### How It Works

1. Session starts with normal sample rate decision
2. If an error occurs, session is forced to be sampled
3. All subsequent data for that session is captured

```javascript
// Manually force sampling
const nadi = Nadi.getInstance();
nadi.forceSampleSession();
```

## Slow Session Sampling

Capture sessions with poor performance:

```javascript
Nadi.init({
  sampleRate: 0.1,
  alwaysSampleSlowSessions: true,
  slowSessionThresholdMs: 5000,  // Sessions > 5s load time
});
```

### Threshold Guidelines

| Threshold | Use Case |
|-----------|----------|
| 3000ms | Aggressive: catch most slow sessions |
| 5000ms | Default: clearly slow experiences |
| 10000ms | Conservative: only very slow sessions |

## Adaptive Sampling

Automatically adjust sampling based on error rate:

```javascript
Nadi.init({
  sampleRate: 0.1,
  adaptiveSampling: true,
});
```

### How It Works

- Error rate increases → Sample rate increases
- Error rate decreases → Sample rate normalizes
- Helps capture more data during incidents

## API Methods

### shouldSampleSession()

Check if the current session is being sampled:

```javascript
const nadi = Nadi.getInstance();
const isSampled = nadi.shouldSampleSession();
```

### getSamplingDecision()

Get detailed sampling decision:

```javascript
const decision = nadi.getSamplingDecision();
// {
//   sampled: true,
//   reason: 'rule:checkout-pages',
//   rate: 1.0
// }
```

### forceSampleSession()

Force the session to be sampled:

```javascript
// Force sampling for VIP users
if (user.isVIP) {
  nadi.forceSampleSession();
}
```

## Complete Configuration Example

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  apiKey: 'your-api-key',
  appKey: 'your-app-key',

  // Base sampling
  sampleRate: 0.1,  // 10% default

  // Smart sampling
  alwaysSampleErrors: true,
  alwaysSampleSlowSessions: true,
  slowSessionThresholdMs: 5000,
  adaptiveSampling: true,

  // Rule-based sampling
  samplingRules: [
    // Critical flows: always sample
    {
      name: 'conversion-funnel',
      rate: 1.0,
      priority: 100,
      conditions: {
        routes: ['/checkout', '/payment', '/signup'],
      },
    },

    // Mobile users: higher sampling
    {
      name: 'mobile',
      rate: 0.5,
      priority: 50,
      conditions: {
        deviceTypes: ['mobile'],
      },
    },

    // API routes: moderate sampling
    {
      name: 'api-pages',
      rate: 0.3,
      priority: 25,
      conditions: {
        routes: ['/api/', '/dashboard/'],
      },
    },
  ],
});
```

## Troubleshooting

### No Data Appearing

If no vitals appear, check:

1. **Sample rate too low** - Increase temporarily
2. **Session too short** - Vitals need time to collect
3. **Network issues** - Check browser console
4. **Check sampling decision** - Use `getSamplingDecision()`

### Inconsistent Results

If results vary significantly:

1. **Sample size too small** - Increase rate
2. **Traffic patterns** - Check time-of-day effects
3. **Seasonal variations** - Compare same periods

### Rule Not Matching

Debug sampling rules:

```javascript
const decision = nadi.getSamplingDecision();
console.log('Sampling decision:', decision);
// Check 'reason' field to see which rule matched
```

## Next Steps

- [Custom Transport](02-custom-transport.md) - Transport configuration
- [Distributed Tracing](03-distributed-tracing.md) - Backend correlation
- [Web Vitals](../02-features/02-web-vitals.md) - Vitals details
- [Configuration](../01-getting-started/03-configuration.md) - All options
