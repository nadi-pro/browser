# Vue Integration

Guide for integrating the Nadi Browser SDK with Vue applications.

## Installation

```bash
npm install @nadi-pro/browser
```

## Vue 3 Setup

### Plugin Creation

Create a Vue plugin for Nadi:

```javascript
// src/plugins/nadi.js
import Nadi from '@nadi-pro/browser';

export default {
  install(app, options) {
    // Initialize SDK
    Nadi.init({
      url: options.url || import.meta.env.VITE_NADI_URL,
      appKey: options.appKey || import.meta.env.VITE_NADI_APP_KEY,
      apiKey: options.apiKey || import.meta.env.VITE_NADI_API_KEY,
      release: options.release || import.meta.env.VITE_APP_VERSION,
      environment: options.environment || import.meta.env.MODE,
      debug: import.meta.env.DEV,
    });

    // Global error handler
    app.config.errorHandler = (error, instance, info) => {
      const nadi = Nadi.getInstance();
      if (nadi) {
        nadi.captureError(error, {
          component: instance?.$options?.name,
          info,
        });
      }
      console.error(error);
    };

    // Provide instance globally
    app.config.globalProperties.$nadi = Nadi.getInstance();
    app.provide('nadi', Nadi.getInstance());
  },
};
```

### Register Plugin

```javascript
// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import nadiPlugin from './plugins/nadi';

const app = createApp(App);

app.use(nadiPlugin, {
  url: import.meta.env.VITE_NADI_URL,
  appKey: import.meta.env.VITE_NADI_APP_KEY,
  apiKey: import.meta.env.VITE_NADI_API_KEY,
});

app.use(router);
app.mount('#app');
```

## Vue 2 Setup

### Plugin Creation

```javascript
// src/plugins/nadi.js
import Nadi from '@nadi-pro/browser';

export default {
  install(Vue, options) {
    Nadi.init({
      url: options.url || process.env.VUE_APP_NADI_URL,
      appKey: options.appKey || process.env.VUE_APP_NADI_APP_KEY,
      apiKey: options.apiKey || process.env.VUE_APP_NADI_API_KEY,
      release: options.release || process.env.VUE_APP_VERSION,
      environment: process.env.NODE_ENV,
    });

    Vue.config.errorHandler = (error, vm, info) => {
      const nadi = Nadi.getInstance();
      if (nadi) {
        nadi.captureError(error, {
          component: vm?.$options?.name,
          info,
        });
      }
      console.error(error);
    };

    Vue.prototype.$nadi = Nadi.getInstance();
  },
};
```

### Register Plugin

```javascript
// src/main.js
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import nadiPlugin from './plugins/nadi';

Vue.use(nadiPlugin);

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
```

## Composition API

### useNadi Composable

```javascript
// src/composables/useNadi.js
import { inject } from 'vue';
import Nadi from '@nadi-pro/browser';

export function useNadi() {
  const nadi = inject('nadi') || Nadi.getInstance();

  const setUser = (userId) => {
    nadi?.setUser(userId);
  };

  const addBreadcrumb = (type, message, data) => {
    nadi?.addBreadcrumb(type, message, data);
  };

  const captureError = async (error, context) => {
    await nadi?.captureError(error, context);
  };

  const captureMessage = async (message, context) => {
    await nadi?.captureMessage(message, context);
  };

  return {
    nadi,
    setUser,
    addBreadcrumb,
    captureError,
    captureMessage,
  };
}
```

### Usage in Components

```vue
<script setup>
import { onMounted } from 'vue';
import { useNadi } from '@/composables/useNadi';
import { useAuth } from '@/composables/useAuth';

const { addBreadcrumb, captureError, setUser } = useNadi();
const { user } = useAuth();

// Set user when authenticated
onMounted(() => {
  if (user.value?.id) {
    setUser(user.value.id);
  }
});

async function handleSubmit() {
  addBreadcrumb('custom', 'Form submitted', { formId: 'contact' });

  try {
    await submitForm();
  } catch (error) {
    await captureError(error, { form: 'contact' });
  }
}
</script>
```

## Options API

### Mixin

```javascript
// src/mixins/nadi.js
export default {
  methods: {
    $addBreadcrumb(type, message, data) {
      this.$nadi?.addBreadcrumb(type, message, data);
    },
    async $captureError(error, context) {
      await this.$nadi?.captureError(error, context);
    },
  },
};
```

### Usage

```vue
<script>
import nadiMixin from '@/mixins/nadi';

export default {
  mixins: [nadiMixin],

  methods: {
    async handleClick() {
      this.$addBreadcrumb('custom', 'Button clicked');

      try {
        await this.doSomething();
      } catch (error) {
        await this.$captureError(error);
      }
    },
  },
};
</script>
```

## Router Integration

Track route changes automatically:

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Nadi from '@nadi-pro/browser';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Your routes
  ],
});

router.afterEach((to, from) => {
  const nadi = Nadi.getInstance();
  if (nadi) {
    nadi.addBreadcrumb('navigation', `Navigate to ${to.path}`, {
      from: from.path,
      to: to.path,
      params: to.params,
    });
  }
});

export default router;
```

## User Identification

Watch for authentication changes:

```vue
<script setup>
import { watch } from 'vue';
import { useNadi } from '@/composables/useNadi';
import { useAuthStore } from '@/stores/auth';

const { setUser } = useNadi();
const authStore = useAuthStore();

watch(
  () => authStore.user,
  (user) => {
    if (user?.id) {
      setUser(user.id);
    }
  },
  { immediate: true }
);
</script>
```

## Pinia Store Integration

```javascript
// src/stores/nadi.js
import { defineStore } from 'pinia';
import Nadi from '@nadi-pro/browser';

export const useNadiStore = defineStore('nadi', {
  getters: {
    instance: () => Nadi.getInstance(),
    sessionId: () => Nadi.getInstance()?.getSessionId(),
  },

  actions: {
    setUser(userId) {
      this.instance?.setUser(userId);
    },

    addBreadcrumb(type, message, data) {
      this.instance?.addBreadcrumb(type, message, data);
    },

    async captureError(error, context) {
      await this.instance?.captureError(error, context);
    },
  },
});
```

## Environment Variables

### Vite (.env)

```env
VITE_NADI_URL=https://nadi.example.com
VITE_NADI_API_KEY=your-sanctum-token
VITE_NADI_APP_KEY=your-application-key
VITE_APP_VERSION=1.0.0
```

### Vue CLI (.env)

```env
VUE_APP_NADI_URL=https://nadi.example.com
VUE_APP_NADI_API_KEY=your-sanctum-token
VUE_APP_NADI_APP_KEY=your-application-key
VUE_APP_VERSION=1.0.0
```

## Complete Example

```javascript
// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import nadiPlugin from './plugins/nadi';

const app = createApp(App);

app.use(createPinia());
app.use(nadiPlugin);
app.use(router);

app.mount('#app');
```

```vue
<!-- src/App.vue -->
<script setup>
import { watch } from 'vue';
import { useNadi } from '@/composables/useNadi';
import { useAuthStore } from '@/stores/auth';

const { setUser } = useNadi();
const authStore = useAuthStore();

watch(
  () => authStore.user,
  (user) => {
    if (user?.id) {
      setUser(user.id);
    }
  },
  { immediate: true }
);
</script>

<template>
  <RouterView />
</template>
```

## Next Steps

- [React Integration](01-react.md) - React setup
- [Next.js Integration](03-nextjs.md) - Next.js setup
- [Breadcrumbs](../02-features/04-breadcrumbs.md) - User tracking
