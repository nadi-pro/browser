# Privacy & Data Masking

PII detection, masking, and data scrubbing configuration for compliance with GDPR, CCPA,
and other privacy regulations.

## Overview

The SDK includes built-in privacy protection that automatically detects and masks personally
identifiable information (PII) before data leaves the browser.

## How It Works

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Action    │ ──► │ Privacy Manager │ ──► │   Nadi Server   │
│                 │     │                 │     │                 │
│ email@test.com  │     │ [EMAIL]         │     │ [EMAIL]         │
│ 555-123-4567    │     │ [PHONE]         │     │ [PHONE]         │
│ 4111...1111     │     │ [CREDIT_CARD]   │     │ [CREDIT_CARD]   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Configuration

### Basic Setup

```javascript
Nadi.init({
  url: 'https://nadi.example.com',
  apiKey: 'your-api-key',
  appKey: 'your-app-key',

  // Privacy is enabled by default
  privacyEnabled: true,
});
```

### Full Configuration

```javascript
Nadi.init({
  privacyEnabled: true,

  // URL parameters to always mask
  sensitiveUrlParams: ['token', 'key', 'secret', 'password', 'auth'],

  // Masking strategy
  maskingStrategy: 'partial',  // 'redact' | 'partial' | 'hash'

  // Object fields to always mask
  sensitiveFields: ['ssn', 'credit_card', 'password', 'secret'],

  // Custom PII patterns
  customPIIPatterns: {
    employeeId: /EMP-\d{6}/g,
    accountNumber: /ACC-[A-Z]{2}\d{8}/g,
  },
});
```

## Built-in PII Detection

The SDK automatically detects and masks:

| PII Type | Pattern | Example | Masked |
|----------|---------|---------|--------|
| Email | `user@domain.com` | `john@test.com` | `[EMAIL]` |
| Phone | Various formats | `555-123-4567` | `[PHONE]` |
| Credit Card | 13-19 digits | `4111111111111111` | `[CREDIT_CARD]` |
| SSN | XXX-XX-XXXX | `123-45-6789` | `[SSN]` |
| IP Address | IPv4/IPv6 | `192.168.1.1` | `[IP_ADDRESS]` |

## Masking Strategies

### redact (Default)

Complete replacement with type indicator:

```javascript
maskingStrategy: 'redact'

// Input: 'Contact john@example.com'
// Output: 'Contact [EMAIL]'
```

### partial

Show partial data for identification:

```javascript
maskingStrategy: 'partial'

// Input: 'Contact john@example.com'
// Output: 'Contact j***@***.com'

// Input: '4111111111111111'
// Output: '4111********1111'
```

### hash

One-way hash for correlation without exposure:

```javascript
maskingStrategy: 'hash'

// Input: 'Contact john@example.com'
// Output: 'Contact [EMAIL:a1b2c3...]'
```

## API Methods

### scrubUrl(url)

Remove PII from URLs.

```javascript
const nadi = Nadi.getInstance();

const scrubbed = nadi.scrubUrl(
  'https://example.com/users?email=test@test.com&token=abc123'
);
// 'https://example.com/users?email=[REDACTED]&token=[REDACTED]'
```

### maskPII(text)

Mask PII in text.

```javascript
const masked = nadi.maskPII('Call 555-123-4567 or email test@example.com');
// 'Call [PHONE] or email [EMAIL]'
```

### detectPII(text)

Detect PII without masking.

```javascript
const result = nadi.detectPII('Contact john@test.com at 555-123-4567');

// {
//   hasPII: true,
//   types: ['email', 'phone'],
//   count: 2
// }
```

## URL Scrubbing

### Sensitive URL Parameters

```javascript
Nadi.init({
  sensitiveUrlParams: [
    'token',
    'key',
    'secret',
    'password',
    'auth',
    'api_key',
    'access_token',
    'refresh_token',
  ],
});
```

**Before scrubbing:**

```text
https://api.example.com/login?token=abc123&redirect=/dashboard
```

**After scrubbing:**

```text
https://api.example.com/login?token=[REDACTED]&redirect=/dashboard
```

## Sensitive Fields

Mask specific fields in objects:

```javascript
Nadi.init({
  sensitiveFields: [
    'password',
    'ssn',
    'creditCard',
    'credit_card',
    'cardNumber',
    'cvv',
    'secret',
    'token',
  ],
});
```

These fields are masked in:

- Error context data
- Breadcrumb data
- Custom event metadata

## Custom PII Patterns

Add patterns specific to your domain:

```javascript
Nadi.init({
  customPIIPatterns: {
    // Employee IDs
    employeeId: /EMP-\d{6}/g,

    // Internal account numbers
    accountNumber: /ACC-[A-Z]{2}\d{8}/g,

    // Custom member IDs
    memberId: /MBR-[A-Z0-9]{10}/g,

    // Healthcare identifiers
    patientId: /PAT-\d{10}/g,
  },
});
```

Custom patterns are masked as `[CUSTOM:name]`:

```javascript
const masked = nadi.maskPII('Employee EMP-123456 created account ACC-US12345678');
// 'Employee [CUSTOM:employeeId] created account [CUSTOM:accountNumber]'
```

## What Gets Masked

### Automatically Masked

- Error messages and stack traces
- Breadcrumb messages and data
- URL parameters (sensitive ones)
- Custom event data
- Network request URLs

### Not Masked

- Session IDs
- Device information
- Page routes
- Performance metrics

## Usage Patterns

### Form Submission Tracking

```javascript
// Safe: field names only, not values
nadi.addBreadcrumb('custom', 'Form submitted', {
  formId: 'checkout-form',
  fieldsCompleted: ['email', 'phone', 'address'],  // Names only
});

// Unsafe: includes actual values
nadi.addBreadcrumb('custom', 'Form submitted', {
  email: formData.email,  // Will be masked automatically
  phone: formData.phone,  // Will be masked automatically
});
```

### Error Context

```javascript
try {
  await processPayment(cardData);
} catch (error) {
  // Privacy manager automatically masks sensitive fields
  await nadi.captureError(error, {
    orderId: order.id,           // Safe: not PII
    cardNumber: cardData.number, // Masked: [CREDIT_CARD]
    email: user.email,           // Masked: [EMAIL]
  });
}
```

### Custom Masking Before SDK

```javascript
// Pre-mask sensitive data before passing to SDK
function safeContext(data) {
  return {
    ...data,
    email: data.email ? '[REDACTED]' : undefined,
    phone: data.phone ? '[REDACTED]' : undefined,
  };
}

nadi.trackEvent('checkout', 'conversion', 99.99, safeContext({
  email: user.email,
  country: user.country,  // Safe
}));
```

## Best Practices

### 1. Enable Privacy by Default

```javascript
// Always enable in production
Nadi.init({
  privacyEnabled: true,  // Default, but explicit is good
});
```

### 2. Define All Sensitive Fields

```javascript
// Be thorough with sensitive fields
sensitiveFields: [
  'password', 'passwd', 'pwd',
  'ssn', 'social_security',
  'creditCard', 'credit_card', 'cardNumber', 'card_number',
  'cvv', 'cvc', 'securityCode',
  'secret', 'token', 'apiKey', 'api_key',
  'privateKey', 'private_key',
],
```

### 3. Use Partial Masking for Debugging

```javascript
// Partial masking helps identify issues while protecting data
maskingStrategy: 'partial'

// 'j***@***.com' helps identify which user
// '[EMAIL]' provides no identification
```

### 4. Add Domain-Specific Patterns

```javascript
// Add patterns for your industry
customPIIPatterns: {
  // Healthcare
  npi: /\d{10}/g,  // National Provider Identifier
  mrn: /MRN-\d{8}/g,  // Medical Record Number

  // Finance
  routingNumber: /\d{9}/g,  // Bank routing
  accountId: /\d{10,17}/g,  // Bank account

  // Retail
  loyaltyId: /LYL-[A-Z0-9]{12}/g,
},
```

### 5. Test Privacy Masking

```javascript
// In development, verify masking works
if (process.env.NODE_ENV === 'development') {
  const nadi = Nadi.getInstance();
  console.log('Test masking:', nadi.maskPII('Email: test@test.com'));
  console.log('Test URL:', nadi.scrubUrl('https://api.com?token=secret'));
}
```

## Compliance Considerations

### GDPR

- Enable `privacyEnabled: true`
- Use `maskingStrategy: 'redact'` for full removal
- Add all EU-specific identifiers to custom patterns

### CCPA

- Mask all personal information categories
- Consider `maskingStrategy: 'hash'` for correlation without exposure

### HIPAA

- Add healthcare-specific patterns (MRN, NPI, etc.)
- Use strict `sensitiveFields` configuration
- Consider disabling certain tracking features entirely

## Troubleshooting

### PII Not Being Masked

Check if privacy is enabled:

```javascript
const nadi = Nadi.getInstance();
const detection = nadi.detectPII('test@test.com');
console.log('PII detected:', detection);
```

### Custom Patterns Not Working

Ensure patterns use the global flag:

```javascript
// Correct
customPIIPatterns: {
  myPattern: /PATTERN/g,  // Global flag required
}

// Incorrect
customPIIPatterns: {
  myPattern: /PATTERN/,  // Missing global flag
}
```

### Sensitive Fields Not Masked

Verify field names match exactly (case-sensitive):

```javascript
sensitiveFields: ['creditCard']  // Won't match 'CreditCard' or 'credit_card'

// Be thorough
sensitiveFields: ['creditCard', 'CreditCard', 'credit_card', 'creditcard']
```

## Related Documentation

- [Configuration](../01-getting-started/03-configuration.md) - All options
- [Error Tracking](../02-features/03-error-tracking.md) - Error context
- [Breadcrumbs](../02-features/04-breadcrumbs.md) - Action tracking
