# Next.js Integration

Guide for integrating the Nadi Browser SDK with Next.js applications.

## Installation

```bash
npm install @nadi/browser
```

## Important: Client-Side Only

The Nadi SDK runs in the browser only. In Next.js, you must ensure it only runs on the client side.

## App Router (Next.js 13+)

### Initialize in Layout

Create a client component for initialization:

```typescript
// lib/nadi.ts
'use client';

import Nadi from '@nadi/browser';

let initialized = false;

export function initNadi() {
  if (typeof window === 'undefined' || initialized) return null;

  initialized = true;

  return Nadi.init({
    url: process.env.NEXT_PUBLIC_NADI_URL!,
    appKey: process.env.NEXT_PUBLIC_NADI_APP_KEY!,
    apiKey: process.env.NEXT_PUBLIC_NADI_API_KEY!,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    environment: process.env.NODE_ENV,
    debug: process.env.NODE_ENV === 'development',
  });
}

export function getNadi() {
  return Nadi.getInstance();
}
```

### Provider Component

```typescript
// components/NadiProvider.tsx
'use client';

import { useEffect } from 'react';
import { initNadi } from '@/lib/nadi';

export function NadiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initNadi();
  }, []);

  return <>{children}</>;
}
```

### Add to Root Layout

```typescript
// app/layout.tsx
import { NadiProvider } from '@/components/NadiProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NadiProvider>{children}</NadiProvider>
      </body>
    </html>
  );
}
```

### Error Boundary

```typescript
// components/ErrorBoundary.tsx
'use client';

import React from 'react';
import Nadi from '@nadi/browser';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const nadi = Nadi.getInstance();
    if (nadi) {
      nadi.captureError(error, {
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  return (
    <div className="error-page">
      <h2>Something went wrong</h2>
      <pre>{error?.message}</pre>
    </div>
  );
}
```

### User Identification Hook

```typescript
// hooks/useNadiUser.ts
'use client';

import { useEffect } from 'react';
import Nadi from '@nadi/browser';

export function useNadiUser(userId: string | undefined) {
  useEffect(() => {
    if (userId) {
      const nadi = Nadi.getInstance();
      nadi?.setUser(userId);
    }
  }, [userId]);
}
```

### Navigation Tracking

```typescript
// components/NadiNavigation.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Nadi from '@nadi/browser';

export function NadiNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const nadi = Nadi.getInstance();
    if (nadi && pathname) {
      nadi.addBreadcrumb('navigation', `Navigate to ${pathname}`, {
        pathname,
        search: searchParams.toString(),
      });
    }
  }, [pathname, searchParams]);

  return null;
}
```

Add to layout:

```typescript
// app/layout.tsx
import { Suspense } from 'react';
import { NadiProvider } from '@/components/NadiProvider';
import { NadiNavigation } from '@/components/NadiNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <NadiProvider>
            <Suspense fallback={null}>
              <NadiNavigation />
            </Suspense>
            {children}
          </NadiProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## Pages Router (Next.js 12 and earlier)

### Initialize in \_app.tsx

```typescript
// pages/_app.tsx
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Nadi from '@nadi/browser';

let nadiInitialized = false;

function initNadi() {
  if (typeof window === 'undefined' || nadiInitialized) return;
  nadiInitialized = true;

  Nadi.init({
    url: process.env.NEXT_PUBLIC_NADI_URL!,
    appKey: process.env.NEXT_PUBLIC_NADI_APP_KEY!,
    apiKey: process.env.NEXT_PUBLIC_NADI_API_KEY!,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    environment: process.env.NODE_ENV,
  });
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    initNadi();

    // Track route changes
    const handleRouteChange = (url: string) => {
      const nadi = Nadi.getInstance();
      nadi?.addBreadcrumb('navigation', `Navigate to ${url}`, { url });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return <Component {...pageProps} />;
}
```

### Error Page Integration

```typescript
// pages/_error.tsx
import { useEffect } from 'react';
import { NextPageContext } from 'next';
import Nadi from '@nadi/browser';

interface Props {
  statusCode: number;
  message?: string;
}

function Error({ statusCode, message }: Props) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nadi = Nadi.getInstance();
      nadi?.captureMessage(`Page error: ${statusCode}`, {
        statusCode,
        message,
      });
    }
  }, [statusCode, message]);

  return (
    <div>
      <h1>{statusCode}</h1>
      <p>{message || 'An error occurred'}</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, message: err?.message };
};

export default Error;
```

## Server Components

For Server Components, you cannot use Nadi directly. Use Client Components for any Nadi functionality:

```typescript
// app/dashboard/page.tsx (Server Component)
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const data = await fetchData(); // Server-side fetch

  return <DashboardClient data={data} />;
}
```

```typescript
// app/dashboard/DashboardClient.tsx
'use client';

import { useEffect } from 'react';
import Nadi from '@nadi/browser';

export function DashboardClient({ data }) {
  useEffect(() => {
    const nadi = Nadi.getInstance();
    nadi?.addBreadcrumb('custom', 'Dashboard loaded', {
      dataCount: data.length,
    });
  }, [data]);

  return <div>{/* Dashboard UI */}</div>;
}
```

## API Route Error Tracking

Track errors in API routes by sending them to a client-side handler:

```typescript
// app/api/example/route.ts
export async function GET() {
  try {
    const data = await fetchData();
    return Response.json(data);
  } catch (error) {
    // Log server-side
    console.error('API Error:', error);

    // Return error to client (which can capture it)
    return Response.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_NADI_URL=https://nadi.example.com
NEXT_PUBLIC_NADI_API_KEY=your-sanctum-token
NEXT_PUBLIC_NADI_APP_KEY=your-application-key
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> **Note**: Environment variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser.

## Complete App Router Example

```typescript
// app/layout.tsx
import { Suspense } from 'react';
import { NadiProvider } from '@/components/NadiProvider';
import { NadiNavigation } from '@/components/NadiNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <NadiProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                <NadiNavigation />
              </Suspense>
              {children}
            </AuthProvider>
          </NadiProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

```typescript
// components/AuthProvider.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Nadi from '@nadi/browser';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      const nadi = Nadi.getInstance();
      nadi?.setUser(session.user.id);
    }
  }, [session?.user?.id]);

  return <>{children}</>;
}
```

## Next Steps

- [React Integration](01-react.md) - React patterns
- [Vue Integration](02-vue.md) - Vue setup
- [Error Tracking](../02-features/03-error-tracking.md) - Error details
