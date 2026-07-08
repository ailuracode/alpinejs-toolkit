# @ailuracode/alpine-theme

Framework-agnostic theme manager for Alpine.js, Blade, Livewire, and any TypeScript front end. Light, dark, and `system` modes; pluggable persistence; class or `data-theme` DOM strategies; cross-tab sync; SSR-safe; head snippet for flash prevention.

## Architecture

```mermaid
flowchart TD
    entry["createTheme()<br/>(manager.ts)"]:::entry

    storage["ThemeStorage<br/>(internal/storage/*)"]:::module
    dom["DomStrategy<br/>(internal/dom-strategy/*)"]:::module
    system["SystemObserver<br/>(internal/system-observer.ts)"]:::module
    crosstab{{"CrossTabSync<br/>(storage adapter's subscribe)"}}:::crosstab

    ls["localStorage<br/>(local-storage.ts)"]:::impl
    cookie["Cookie<br/>(cookie.ts)"]:::impl
    memory["In-memory<br/>(memory.ts)"]:::impl
    noop["No-op<br/>(noop.ts)"]:::impl

    classStrategy["class on &lt;html&gt;<br/>(dom-strategy/class.ts)"]:::impl
    attributeStrategy["attribute on &lt;html&gt;<br/>(dom-strategy/attribute.ts)"]:::impl
    noneStrategy["no-op<br/>(dom-strategy/none.ts)"]:::impl
    matchMedia["matchMedia change<br/>(prefers-color-scheme)"]:::impl
    storageEvent["storage event<br/>(window listener)"]:::impl

    entry --> storage
    entry --> dom
    entry --> system
    entry -. "subscribe()" .-> crosstab

    storage --> ls
    storage --> cookie
    storage --> memory
    storage --> noop

    dom --> classStrategy
    dom --> attributeStrategy
    dom --> noneStrategy
    system --> matchMedia
    crosstab --> storageEvent

    classDef entry fill:#fef3c7,stroke:#b45309,color:#1f2937
    classDef module fill:#dbeafe,stroke:#1d4ed8,color:#1f2937
    classDef crosstab fill:#fce7f3,stroke:#9d174d,color:#1f2937
    classDef impl fill:#dcfce7,stroke:#15803d,color:#1f2937
```

The core is engine-free: no Alpine import, no DOM mutation outside the strategy, no `window`/`document` access at import time. The Alpine integration is a thin adapter that exposes the manager through `$store.theme` and `$theme`.

## State model

Three orthogonal values:

| Field      | Meaning                                 | Values                          |
| ---------- | --------------------------------------- | ------------------------------- |
| `current`  | The user selection                      | `'light' \| 'dark' \| 'system'` |
| `system`   | The OS preference                       | `'light' \| 'dark'`             |
| `resolved` | The effective theme applied to the page | `'light' \| 'dark'`             |

Examples:

- User picked `system`, OS is dark → `current='system'`, `system='dark'`, `resolved='dark'`.
- User picked `light`, OS is dark → `current='light'`, `system='dark'`, `resolved='light'`.
- User picked `dark`, OS is light → `current='dark'`, `system='light'`, `resolved='dark'`.

`resolved` updates automatically when the OS flips **only** when `current === 'system'`. An explicit user choice freezes `resolved` against OS changes.

## Install

```bash
pnpm add @ailuracode/alpine-theme @ailuracode/alpine-core alpinejs
```

## Standalone usage (no Alpine)

```ts
import { createTheme, createLocalStorageThemeStorage } from '@ailuracode/alpine-theme';

const theme = createTheme({
    defaultTheme: 'system',
    storage: createLocalStorageThemeStorage({ key: 'app-theme' }),
    strategy: 'class',
    darkClass: 'dark',
    lightClass: 'light',
    target: document.documentElement,
});

theme.set('dark');
theme.set('light');
theme.set('system');
theme.toggle();
theme.reset();
```

`theme.subscribe(detail => { … })` receives every transition with `source: 'user' | 'system' | 'storage' | 'reset' | 'initialization'` plus the previous state.

## Debug mode

Pass `debug: true` to pipe every transition through the default logger (`console.debug` with a `[theme:event]` prefix and a labeled group containing the previous + next state, the source, and the timestamp):

```ts
import { createTheme } from '@ailuracode/alpine-theme';

const theme = createTheme({ defaultTheme: 'system', debug: true });
```

Output in the devtools console looks like:

```text
[theme:event] initialization → light
  current : light
  system  : light
  resolved: light
  source  : initialization
  previous: null
  at      : 2026-07-02T17:00:00.000Z

[theme:event] user → dark
  current : dark
  system  : light
  resolved: dark
  source  : user
  previous: { current: 'light', system: 'light', resolved: 'light' }
  at      : 2026-07-02T17:00:01.000Z
```

Pass a custom `ThemeDebugLogger` to forward events to a telemetry pipeline, a UI debug overlay, or a test stub:

```ts
import type { ThemeDebugEvent } from '@ailuracode/alpine-theme';

const theme = createTheme({
    defaultTheme: 'system',
    debug: (event) => {
        // event: { current, system, resolved, source, previous, timestamp }
        window.__themeLog.push(event);
    },
});
```

Debug events are emitted on the same path as `subscribe()` listeners — the same payload, plus a monotonic `timestamp` captured at emit time. A faulty logger is caught and reported once via `console.warn`; the manager never throws because of a misbehaving sink. The flag defaults to `false`, so production builds stay quiet.

The debug pipeline is implemented in `@ailuracode/alpine-core#debug` as a generic, feature-agnostic primitive — the same `DebugLogger<TDetail>` shape is reused by every controller in the toolkit. The theme package only specializes the label (`[theme:event]`) and the typed detail; the runtime is shared. Consumers that want a truly generic sink can import `defaultDebugLogger` from core instead.

## Alpine usage

```ts
import Alpine from 'alpinejs';
import { themePlugin } from '@ailuracode/alpine-theme';

Alpine.plugin(themePlugin({ defaultTheme: 'system', strategy: 'class' }));
Alpine.start();
```

```html
<button type="button" @click="$theme.toggle()">Toggle theme</button>
<button type="button" @click="$theme.set('system')">Use system</button>
<span x-text="$theme.resolved"></span>
```

The plugin registers `$store.theme` and `$theme` (both backed by the same manager instance). It is a thin reactive mirror — every method forwards to the manager.

## DOM strategies

`strategy: 'class'` (default) — toggles a class on the target:

```html
<html class="dark"></html>
```

`strategy: 'attribute'` — sets a `data-*` attribute:

```html
<html data-theme="dark"></html>
```

`strategy: 'none'` — keeps the manager fully headless. Useful for tests and SSR-only consumers.

The strategy removes the previous value before applying the next one — no stale class or attribute lingers when consumers rename `darkClass`/`lightClass` at runtime.

## Persistence

`ThemeStorage` is a four-method contract:

```ts
interface ThemeStorage {
    get(): ThemePreference | null;
    set(value: ThemePreference): void;
    remove(): void;
    subscribe?(listener: (next: ThemePreference) => void): Unsubscribe;
}
```

Bundled adapters:

- `createLocalStorageThemeStorage({ key })` — default, uses `window.localStorage`; SSR-safe; `subscribe()` wires the `storage` event for cross-tab sync.
- `createCookieThemeStorage({ key, path, maxAge, sameSite })` — for Blade / Laravel; reads `document.cookie`.
- `createMemoryThemeStorage(initial?)` — hermetic, useful for tests and SSR seeding.
- `createNoopThemeStorage()` — disables persistence.

Custom adapters (IndexedDB, server header propagation, encrypted storage) implement `ThemeStorage` directly. The optional `subscribe()` hook enables cross-instance change notifications.

## Cross-tab synchronization

The default `localStorage` adapter listens to the `storage` event. When another tab writes a new value, the local manager updates its state and emits a transition with `source: 'storage'`. The manager tracks the value it last wrote, so it suppresses the echo (no feedback loops).

Pass `crossTab: false` to opt out. The localStorage adapter is the only bundled adapter that supports it; the others return a no-op `subscribe()`.

## Flash prevention (head snippet)

The package exports `buildHeadScript({...})` — a function that serializes the same theme-resolution logic the manager uses into a standalone JS string. The output is a single IIFE with **zero imports, no `eval`, no `Function`**, so it is safe under strict CSP (`script-src 'self'`).

```ts
// vite.config.ts / astro.config.mjs / next.config.js / build step
import { buildHeadScript } from '@ailuracode/alpine-theme';
import { writeFileSync } from 'node:fs';

const script = buildHeadScript({
    storageKey: 'app-theme', // default: 'theme'
    defaultTheme: 'system', // default: 'system'
    strategy: 'class', // default: 'class'
    darkClass: 'dark', // default: 'dark'
    lightClass: 'light', // default: 'light'
    target: 'html', // CSS selector — default: 'html'
});

writeFileSync('public/theme-head.js', script);
```

Wire it in your document **before** the Alpine bundle:

```html
<!doctype html>
<html>
    <head>
        <script src="/theme-head.js"></script>
    </head>
    <body>
        <script type="module">
            import Alpine from 'alpinejs';
            import { themePlugin } from '@ailuracode/alpine-theme';
            Alpine.plugin(themePlugin({ defaultTheme: 'system' }));
            Alpine.start();
        </script>
    </body>
</html>
```

The script reads the persisted preference from `localStorage`, falls back to `defaultTheme`, resolves the OS preference from `(prefers-color-scheme: dark)`, and applies the result to `target` — all wrapped in a `try/catch` so a missing API never throws. The manager reconciles state on hydration, so the snippet is **best-effort**: when it fails open, `createTheme()` reapplies the correct value before the user notices.

Use `strategy: 'attribute'` to emit `data-theme="dark"` instead of class toggling. The class and attribute variants share the same option names; flip `strategy` to switch.

For SSR-rendered layouts (Laravel / Blade), the server can read the cookie and emit the class directly — the head snippet then becomes optional. The client-side manager reconciles on hydration either way.

## Laravel / Blade integration

1. **Server side** — read the cookie and apply the class to `<html>` in the Blade layout:

    ```blade
    <!doctype html>
    <html class="{{ request()->cookie('app-theme') === 'dark' ? 'dark' : 'light' }}">
    ```

2. **Client side** — initialize the manager with the cookie adapter so the same preference persists on subsequent navigations:

    ```ts
    import { createTheme, createCookieThemeStorage } from '@ailuracode/alpine-theme';

    createTheme({
        defaultTheme: 'system',
        storage: createCookieThemeStorage({ key: 'app-theme' }),
        strategy: 'class',
    });
    ```

The server already set the right class on `<html>` — the manager reconciles state and re-applies if the cookie was rotated.

## SSR

The package is fully importable in a Node runtime. Every browser API is gated through `typeof window === 'undefined'` checks:

- `readSystemTheme()` returns `'light'`.
- `createLocalStorageThemeStorage().get()` returns `null`.
- The DOM strategy is a no-op when `target` is `null`.
- Subscribers fire on a microtask so the server can attach them before the event dispatches.

## API reference

```ts
const theme = createTheme({
  defaultTheme?: 'light' | 'dark' | 'system',   // default: 'system'
  storage?: ThemeStorage,                       // default: localStorage
  strategy?: 'class' | 'attribute' | 'none',    // default: 'class'
  darkClass?: string,                           // default: 'dark'
  lightClass?: string,                          // default: 'light'
  attribute?: string,                           // default: 'data-theme'
  target?: HTMLElement | null,                  // default: document.documentElement
  watchSystem?: boolean,                        // default: true
  crossTab?: boolean,                           // default: true
  debug?: boolean | ThemeDebugLogger,           // default: false
});

theme.current   // 'light' | 'dark' | 'system'
theme.system    // 'light' | 'dark'
theme.resolved  // 'light' | 'dark'
theme.get()     // { current, system, resolved }
theme.set(value)
theme.toggle()  // resolved 'dark' → 'light', 'light' → 'dark' (explicit)
theme.reset()   // restores defaultTheme, removes persisted value
theme.subscribe(listener)  // returns unsubscribe
theme.destroy() // idempotent, releases all listeners
```

`toggle()` creates an explicit user preference — the manager does NOT return to `'system'`. `reset()` removes the persisted value and applies the configured `defaultTheme`.

## Initialization order

The manager runs the following sequence on construction:

1. Read the persisted preference through the storage adapter.
2. Fall back to the configured `defaultTheme`.
3. Read the current OS preference via `matchMedia`.
4. Resolve `resolved = current === 'system' ? system : current`.
5. Apply `resolved` through the DOM strategy.
6. Register the system-preference listener (if `watchSystem` is `true`).
7. Register the cross-tab listener (if `crossTab` is `true` and the storage adapter supports `subscribe`).
8. Schedule the `initialization` notification on a microtask so consumers can attach subscribers synchronously after `createTheme()` returns.

The init is idempotent — `createTheme()` is safe to call once per page, but the package does not register itself with the global Alpine store. The integration is opt-in through `Alpine.plugin(themePlugin())`.

## Error handling

- `localStorage` access wrapped in `try/catch` — Safari private mode / `SecurityError` degrade silently.
- Invalid stored values return `null` so the manager falls back to the default.
- Invalid `set()` inputs coerce to the configured `defaultTheme`.
- Missing `matchMedia` / `window` / `document` skip the corresponding subsystem (system observer, cross-tab, DOM strategy).
- `subscribe()` returns a no-op cleanup when the runtime cannot observe.

## Cleanup

`theme.destroy()` is idempotent and tears down:

- the system-preference `matchMedia` listener
- the cross-tab `storage` event listener
- the DOM class / attribute on the target
- every subscriber

Call it when the consumer unmounts (e.g. inside a SPA route teardown, an Alpine `x-destroy` hook, or a Blade `@yield` block that lives for one request). For server-rendered pages that load Alpine on every navigation, the listeners are torn down automatically with the `window`.

## Migration from `@ailuracode/alpine-theme@0.1.x`

`0.2.0` is a breaking rewrite. The public surface changed:

| `0.1.x`                                           | `0.2.x`                                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `new ThemeController({…})` + `controller.mount()` | `createTheme({…})` (synchronous init)                                                        |
| `themePlugin({…})` registers `$store.theme` only  | `themePlugin({…})` registers both `$store.theme` and `$theme`                                |
| Single `mode` + `resolved` field                  | Three independent fields: `current` / `system` / `resolved`                                  |
| `set` / `cycle` / `refresh` methods               | `set` / `toggle` / `reset` methods                                                           |
| `modes` option for custom cycle order             | Removed — use the storage adapter to persist any value, or pass a default via `defaultTheme` |
| `onChange` callback option                        | `theme.subscribe(listener)` with structured `source` field                                   |
| Built-in `localStorage` only                      | Pluggable `ThemeStorage` adapters (`localStorage` / `cookie` / `memory` / `noop` / custom)   |
| `strategy: 'class'` hard-coded                    | `strategy: 'class' \| 'attribute' \| 'none'`                                                 |
| No cross-tab sync                                 | `storage` event wired by default, opt-out via `crossTab: false`                              |
| Alpine-only                                       | Framework-agnostic — `createTheme()` works in Blade / Livewire / vanilla TS                  |

`storage` is now pluggable. To migrate a custom `localStorage` key, pass `createLocalStorageThemeStorage({ key: 'my-key' })`. To migrate from `modes`, set the persisted value directly through the storage adapter (e.g. `storage.set('dark')` before `createTheme()` reads).

## License

MIT
