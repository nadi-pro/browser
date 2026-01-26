# React Integration

Guide for integrating the Nadi Browser SDK with React applications.

## Installation

```bash
npm install @nadi/browser
```

## Basic Setup

### Create React App

Create a file for Nadi initialization:

```javascript
// src/lib/nadi.js
import Nadi from '@nadi/browser';

let initialized = false;

export function initNadi() {
  if (initialized) return;
  initialized = true;

  Nadi.init({
    url: process.env.REACT_APP_NADI_URL,
    appToken: process.env.REACT_APP_NADI_APP_TOKEN,
    bearerToken: process.env.REACT_APP_NADI_BEARER_TOKEN,
    release: process.env.REACT_APP_VERSION,
    environment: process.env.NODE_ENV,
    debug: process.env.NODE_ENV === 'development',
  });
}

export function getNadi() {
  return Nadi.getInstance();
}
```

Initialize in your entry point:

```javascript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initNadi } from './lib/nadi';

// Initialize before rendering
initNadi();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### Vite

```javascript
// src/lib/nadi.js
import Nadi from '@nadi/browser';

export function initNadi() {
  Nadi.init({
    url: import.meta.env.VITE_NADI_URL,
    appToken: import.meta.env.VITE_NADI_APP_TOKEN,
    bearerToken: import.meta.env.VITE_NADI_BEARER_TOKEN,
    release: import.meta.env.VITE_APP_VERSION,
    environment: import.meta.env.MODE,
  });
}
```

## Error Boundary

Create an Error Boundary to capture React errors:

```jsx
// src/components/ErrorBoundary.jsx
import React from 'react';
import Nadi from '@nadi/browser';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const nadi = Nadi.getInstance();
    if (nadi) {
      nadi.captureError(error, {
        componentStack: errorInfo.componentStack,
        boundary: this.props.name || 'ErrorBoundary',
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

function ErrorFallback({ error }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error?.message}</pre>
    </div>
  );
}

export default ErrorBoundary;
```

Wrap your app:

```jsx
// src/App.jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}
```

## User Identification Hook

Create a hook for user management:

```javascript
// src/hooks/useNadiUser.js
import { useEffect } from 'react';
import Nadi from '@nadi/browser';

export function useNadiUser(user) {
  useEffect(() => {
    const nadi = Nadi.getInstance();
    if (nadi && user?.id) {
      nadi.setUser(user.id.toString());
    }
  }, [user?.id]);
}
```

Usage:

```jsx
// src/App.jsx
import { useAuth } from './hooks/useAuth';
import { useNadiUser } from './hooks/useNadiUser';

function App() {
  const { user } = useAuth();
  useNadiUser(user);

  return <Routes />;
}
```

## Custom Breadcrumb Hook

```javascript
// src/hooks/useNadiBreadcrumb.js
import { useCallback } from 'react';
import Nadi from '@nadi/browser';

export function useNadiBreadcrumb() {
  return useCallback((type, message, data) => {
    const nadi = Nadi.getInstance();
    if (nadi) {
      nadi.addBreadcrumb(type, message, data);
    }
  }, []);
}
```

Usage:

```jsx
function CheckoutPage() {
  const addBreadcrumb = useNadiBreadcrumb();

  const handleCheckout = async () => {
    addBreadcrumb('custom', 'Checkout started', { items: cart.length });

    try {
      await processCheckout();
      addBreadcrumb('custom', 'Checkout completed');
    } catch (error) {
      // Error is auto-captured
    }
  };

  return <button onClick={handleCheckout}>Checkout</button>;
}
```

## Route Change Tracking

Track route changes with React Router:

```jsx
// src/components/NadiRouteTracker.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Nadi from '@nadi/browser';

export function NadiRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    const nadi = Nadi.getInstance();
    if (nadi) {
      nadi.addBreadcrumb('navigation', `Navigate to ${location.pathname}`, {
        pathname: location.pathname,
        search: location.search,
      });
    }
  }, [location]);

  return null;
}
```

Add to your router:

```jsx
function App() {
  return (
    <Router>
      <NadiRouteTracker />
      <Routes>
        {/* Your routes */}
      </Routes>
    </Router>
  );
}
```

## Context Provider (Optional)

For advanced usage, create a context:

```jsx
// src/context/NadiContext.jsx
import React, { createContext, useContext, useMemo } from 'react';
import Nadi from '@nadi/browser';

const NadiContext = createContext(null);

export function NadiProvider({ children }) {
  const nadi = useMemo(() => Nadi.getInstance(), []);

  return (
    <NadiContext.Provider value={nadi}>
      {children}
    </NadiContext.Provider>
  );
}

export function useNadi() {
  return useContext(NadiContext);
}
```

## Environment Variables

### Create React App (.env)

```env
REACT_APP_NADI_URL=https://nadi.example.com
REACT_APP_NADI_APP_TOKEN=your-app-token
REACT_APP_NADI_BEARER_TOKEN=your-bearer-token
REACT_APP_VERSION=1.0.0
```

### Vite (.env)

```env
VITE_NADI_URL=https://nadi.example.com
VITE_NADI_APP_TOKEN=your-app-token
VITE_NADI_BEARER_TOKEN=your-bearer-token
VITE_APP_VERSION=1.0.0
```

## Complete Example

```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initNadi } from './lib/nadi';

initNadi();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
```

```jsx
// src/App.jsx
import { useAuth } from './hooks/useAuth';
import { useNadiUser } from './hooks/useNadiUser';
import { NadiRouteTracker } from './components/NadiRouteTracker';
import Routes from './Routes';

function App() {
  const { user } = useAuth();
  useNadiUser(user);

  return (
    <>
      <NadiRouteTracker />
      <Routes />
    </>
  );
}

export default App;
```

## Next Steps

- [Vue Integration](02-vue.md) - Vue setup
- [Next.js Integration](03-nextjs.md) - Next.js setup
- [Error Tracking](../02-features/03-error-tracking.md) - Error details
