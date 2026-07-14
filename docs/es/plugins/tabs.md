---
title: "Tabs"
description: "Store headless de pestañas accesibles con navegación por teclado, activación manual/automática y ayudantes ARIA."
---

Package: `@ailuracode/alpine-tabs`

Store headless de pestañas accesibles con navegación por teclado, activación manual/automática, ayudantes ARIA y sincronización opcional con la URL.

## Instalación

```bash
pnpm add @ailuracode/alpine-tabs alpinejs
```

El seguimiento de la pestaña activa usa estado ligero inline — sin dependencia extra.

## Configuración

```js
import Alpine from "alpinejs";
import tabs from "@ailuracode/alpine-tabs";

Alpine.plugin(tabs());
Alpine.start();
```

## Store API

| Método | Descripción |
|--------|-------------|
| `register(groupId, options?)` | Crea un grupo de pestañas |
| `registerTab(groupId, tabId)` | Registra una pestaña en el grupo |
| `select(groupId, tabId)` | Activa una pestaña |
| `active(groupId)` | Id de la pestaña activa |
| `isActive(groupId, tabId)` | Si una pestaña está activa |
| `next(groupId)` / `previous(groupId)` | Cicla pestañas |
| `handleKeydown(groupId, event)` | Navegación con flechas/Home/End |
| `tabProps(groupId, tabId)` | `role`, `aria-selected`, `aria-controls` |
| `panelProps(groupId, tabId)` | `role`, `hidden`, `aria-labelledby` |
| `tablistProps(groupId)` | `role`, `aria-orientation` |

Registra un grupo con `urlParam: 'tab'` para sincronizar `?tab=` en la barra de direcciones (no requiere un plugin de URL aparte).

## Marcado básico

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

La sincronización con la URL lee `window.location` solo cuando `register()` se ejecuta en el cliente.

## Integración

- **Toast** — feedback opcional en demos al cambiar de pestaña; no es requerido por el plugin. Ver [Toast](./toast.md).
