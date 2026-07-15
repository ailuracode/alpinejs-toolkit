# @ailuracode/alpine-tabs

Headless accessible tabs store with keyboard navigation, manual/automatic activation, ARIA helpers, and optional URL query sync.

## Install

```bash
pnpm add @ailuracode/alpine-tabs @ailuracode/alpine-core alpinejs
```

Active tab tracking uses an inline lightweight state — no extra dependency.

## Quick start

```js
import Alpine from "alpinejs";
import { tabsPlugin } from "@ailuracode/alpine-tabs";

Alpine.plugin(tabsPlugin());
Alpine.start();
```

## Store API

| Method | Description |
|--------|-------------|
| `select(groupId, tabId)` | Activate a tab |
| `active(groupId)` | Active tab id |
| `isActive(groupId, tabId)` | Whether a tab is active |
| `next(groupId)` / `previous(groupId)` | Cycle tabs |
| `handleKeydown(groupId, event)` | Arrow/Home/End navigation |
| `tabProps(groupId, tabId)` | `role`, `aria-selected`, `aria-controls` |
| `panelProps(groupId, tabId)` | `role`, `hidden`, `aria-labelledby` |
| `tablistProps(groupId)` | `role`, `aria-orientation` |

Register a group with `urlParam: 'tab'` to sync `?tab=` in the address bar (no separate URL plugin required).

### Avoiding name collisions

If your application already owns a `$store.tabs` or another toolkit plugin registers on that name, rename the integration surface without touching the controller:

```ts
Alpine.plugin(tabsPlugin({
  storeKey: "panels",        // → $store.panels
  // magicKey follows storeKey by default → $panels
  magicKey: "tabsState",     // explicit override → $tabsState
}));
```

`storeKey` is the only argument most hosts need. `magicKey` moves independently only when both names must be freed. The exposed constants `DEFAULT_TABS_STORE_KEY` and `DEFAULT_TABS_MAGIC_KEY` keep the rename discoverable from TypeScript.

## Basic markup

```html
<div
  x-data
  x-init="
    $store.tabs.register('settings-tabs', { defaultTab: 'profile' });
    ['profile','billing','security'].forEach(id => $store.tabs.registerTab('settings-tabs', id));
  "
>
  <div x-bind="$store.tabs.tablistProps('settings-tabs')" @keydown="$store.tabs.handleKeydown('settings-tabs', $event)">
    <template x-for="id in ['profile','billing','security']" :key="id">
      <button
        x-bind="$store.tabs.tabProps('settings-tabs', id)"
        @click="$store.tabs.select('settings-tabs', id)"
        x-text="id"
      ></button>
    </template>
  </div>

  <template x-for="id in ['profile','billing','security']" :key="id">
    <section x-bind="$store.tabs.panelProps('settings-tabs', id)">
      <p x-text="`Panel: ${id}`"></p>
    </section>
  </template>
</div>
```

## SSR

URL sync reads `window.location` only when `register()` runs on the client.

## Integration

- **Toast** — optional feedback in demos when switching tabs; not required by the plugin

## License

MIT
