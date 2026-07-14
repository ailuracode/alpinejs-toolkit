---
name: test-environments
description: Configure environments like happy-dom for browser APIs
---

# Test Environments

> **Alpine Toolkit:** use `happy-dom` only. This repo does not install or configure `jsdom`.

## Available Environments

- `node` (default) - Node.js environment
- `happy-dom` - Simulated DOM (project default for Alpine integration tests)
- `edge-runtime` - Vercel Edge Runtime

## Configuration

```ts
// vitest.config.ts
defineConfig({
  test: {
    environment: 'happy-dom',
    
    // Environment-specific options
    environmentOptions: {
      'happy-dom': {
        url: 'http://localhost',
      },
    },
  },
})
```

## Installing Environment Packages

```bash
# happy-dom (project default)
pnpm add -D happy-dom
```

## Per-File Environment

Use magic comment at top of file:

```ts
// @vitest-environment happy-dom

import { expect, test } from 'vitest'

test('DOM test', () => {
  const div = document.createElement('div')
  expect(div).toBeInstanceOf(HTMLDivElement)
})
```

## happy-dom Environment

Faster simulated DOM used across this monorepo:

```ts
// @vitest-environment happy-dom

test('DOM manipulation', () => {
  document.body.innerHTML = '<div id="app"></div>'
  
  const app = document.getElementById('app')
  app.textContent = 'Hello'
  
  expect(app.textContent).toBe('Hello')
})

test('window APIs', () => {
  expect(window.location.href).toBeDefined()
  expect(localStorage).toBeDefined()
})
```

### happy-dom Options

```ts
defineConfig({
  test: {
    environmentOptions: {
      'happy-dom': {
        url: 'http://localhost:3000',
      },
    },
  },
})
```

## Multiple Environments per Project

Use projects for different environments:

```ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'dom',
          include: ['tests/dom/**/*.test.ts'],
          environment: 'happy-dom',
        },
      },
    ],
  },
})
```

## Custom Environment

Create custom environment package:

```ts
// vitest-environment-custom/index.ts
import type { Environment } from 'vitest/runtime'

export default <Environment>{
  name: 'custom',
  viteEnvironment: 'ssr', // or 'client'
  
  setup() {
    // Setup global state
    globalThis.myGlobal = 'value'
    
    return {
      teardown() {
        delete globalThis.myGlobal
      },
    }
  },
}
```

Use with:

```ts
defineConfig({
  test: {
    environment: 'custom',
  },
})
```

## Environment with VM

For full isolation:

```ts
export default <Environment>{
  name: 'isolated',
  viteEnvironment: 'ssr',
  
  async setupVM() {
    const vm = await import('node:vm')
    const context = vm.createContext()
    
    return {
      getVmContext() {
        return context
      },
      teardown() {},
    }
  },
  
  setup() {
    return { teardown() {} }
  },
}
```

## Browser Mode (Separate from Environments)

For real browser testing, use Vitest Browser Mode. In **v4 the provider is an object** (not a string), and the context imports from `vitest/browser`:

```ts
import { playwright } from '@vitest/browser-playwright'

defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright({ launchOptions: { slowMo: 100 } }),
      instances: [{ browser: 'chromium' }], // or 'firefox', 'webkit'
    },
  },
})
```

```ts
import { page } from 'vitest/browser' // v4: was '@vitest/browser/context'
```

> v5: DOM-environment global assignments (e.g. `window.innerWidth`) now propagate to the underlying happy-dom implementation. Locators are also exact/strict by default.

## CSS and Assets

In happy-dom, configure CSS handling:

```ts
defineConfig({
  test: {
    css: true, // Process CSS
    
    // Or with options
    css: {
      include: /\.module\.css$/,
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
})
```

## Fixing External Dependencies

If external deps fail with CSS/asset errors:

```ts
defineConfig({
  test: {
    server: {
      deps: {
        inline: ['problematic-package'],
      },
    },
  },
})
```

## Key Points

- Default is `node` - no browser APIs
- Use `happy-dom` for simulated DOM tests in this monorepo
- Per-file environment via `// @vitest-environment` comment
- Use projects for multiple environment configurations
- Browser Mode is for real browser testing, not environment

<!-- 
Source references:
- https://vitest.dev/guide/environment.html
-->
