---
title: "Selection"
description: "Primitivas de selección agnósticas al framework para Alpine.js — modos single, multiple y range con seguimiento de ancla."
---

Package: `@ailuracode/alpine-selection`

Primitivas de selección agnósticas al framework para Alpine.js — modos single, multiple y range con seguimiento de ancla.

## Instalación

```bash
pnpm add @ailuracode/alpine-selection alpinejs @ailuracode/alpine-core
```

## Configuración

```js
import Alpine from "alpinejs";
import selection from "@ailuracode/alpine-selection";

Alpine.plugin(selection());
Alpine.start();
```

## Ejemplo rápido

```html
<div
  x-data="{
    items: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    itemClass(key) {
      const snap = $store.selection.instances.list;
      if (!snap) return '';
      return snap.selectedKeys.includes(key) ? 'is-selected' : '';
    },
  }"
  x-init="$store.selection.create('list', { mode: 'multiple', keys: items })"
>
  <p x-text="$store.selection.instances.list?.selectedKeys.join(', ') || 'none'"></p>
  <ul x-bind="$store.selection.listProps('list', { label: 'Choose items' })">
    <template x-for="item in items" :key="item">
      <li
        x-bind="$store.selection.itemProps('list', item)"
        :class="itemClass(item)"
        @click="$store.selection.toggle('list', item)"
        x-text="item"
      ></li>
    </template>
  </ul>
</div>
```

Vincula estilos y etiquetas a `$store.selection.instances[id]` (o `itemProps` / `listProps`) para que Alpine rastree los cambios de selección. Los ayudantes imperativos como `isSelected()` leen el controller directamente y no disparan actualizaciones de plantilla por sí solos.

En métodos inline de `x-data`, referencia campos del componente con `this` (o ejecuta `create` desde una expresión `x-init` donde Alpine inyecta el ámbito de datos):

```html
<div
  x-data="{ items: ['Alpha', 'Bravo'], mode: 'multiple' }"
  x-init="$store.selection.create('list', { mode, keys: items })"
>
```

## Store API

- `$store.selection.create(id, options)` — registra una instancia de selección
- `$store.selection.destroy(id)` / `destroyAll()` — elimina instancia(s)
- `$store.selection.replace(id, key)` — reemplaza la selección
- `$store.selection.toggle(id, key)` — alterna membresía (modo multiple)
- `$store.selection.extend(id, key)` — extiende desde el ancla (range / shift-click)
- `$store.selection.selectAll(id)` / `clear(id)` — comandos masivos
- `$store.selection.setMode(id, mode)` — cambia entre `single`, `multiple`, `range`
- `$store.selection.setKeys(id, keys)` — actualiza el registro ordenado de claves
- `$store.selection.setDisabledKeys(id, keys)` — marca claves como no seleccionables
- `$store.selection.setActive(id, key)` / `setAnchor(id, key)` — foco de teclado / puntero
- `$store.selection.instances[id]` — instantánea de solo lectura (`value`, `selectedKeys`, `anchorKey`, `activeKey`, `mode`)
- `$store.selection.listProps` / `itemProps` — ayudantes ARIA listbox headless (reactivos vía `instances`)

## Factory del store (standalone)

Crea un store sin el plugin completo de Alpine:

```ts
import { createSelectionStore, createSelectionStoreFromController } from "@ailuracode/alpine-selection";

// Controller nuevo
const store = createSelectionStore();
store.create("list", { mode: "multiple", keys: ["a", "b", "c"] });
store.toggle("list", "a");

// O envuelve un controller existente
import { SelectionController } from "@ailuracode/alpine-selection";
const controller = new SelectionController();
const store2 = createSelectionStoreFromController(controller);
```

## Factories de adaptador

Adaptadores controlados y no controlados para cableado agnóstico al framework:

```ts
import { createControlledAdapter, createUncontrolledAdapter } from "@ailuracode/alpine-selection";

// Controlado — tú posees el valor
const adapter = createControlledAdapter({
  mode: "multiple",
  value: ["a"],
  onChange: (detail) => render(detail.value),
});

// No controlado — el controller posee el estado
const adapter2 = createUncontrolledAdapter(controller, "list", {
  mode: "multiple",
  keys: ["a", "b", "c"],
});
```

## Ayudantes de navegación

```ts
import {
  moveSelectableIndex,
  moveSelectableKey,
  firstSelectableIndex,
  lastSelectableIndex,
  firstSelectableKey,
  lastSelectableKey,
} from "@ailuracode/alpine-selection";

const nextIndex = moveSelectableIndex(currentIndex, 1, selectableFlags);
const nextKey = moveSelectableKey(currentKey, 1, keys, disabledKeys);
```

Úsalos en manejadores de teclado para listbox, paletas de comandos y tiras de pestañas.

## Controller API (sin Alpine)

```ts
import { createSelectionController } from "@ailuracode/alpine-selection";

const controller = createSelectionController();
controller.create("rows", { mode: "range", keys: ["a", "b", "c"] });
controller.on("change", ({ selectedKeys }) => {
  render(selectedKeys);
});
```

## Serialización

```ts
import { serializeSelection, deserializeSelection } from "@ailuracode/alpine-selection";

const encoded = serializeSelection(["a", "c"], "multiple"); // "a,c"
const restored = deserializeSelection(encoded, "multiple");  // ["a", "c"]
```

### Integración con URL

```ts
import { parseSelectionParam, writeSelectionParam } from "@ailuracode/alpine-selection";

// Leer de la URL
const params = new URLSearchParams(window.location.search);
const value = parseSelectionParam(params, "selected", "multiple");

// Escribir en la URL
writeSelectionParam(params, "selected", ["a", "c"], "multiple");
window.history.replaceState(null, "", `?${params}`);
```

## Manejo de errores

```ts
import { SelectionError } from "@ailuracode/alpine-selection";

try {
  controller.toggle("unknown-instance", "a");
} catch (e) {
  if (e instanceof SelectionError && e.code === "INSTANCE_NOT_FOUND") {
    // manejar instancia faltante
  }
}
```

## Reactividad en plantillas

El estado de selección se refleja en `$store.selection.instances[id]`. Lee desde esa instantánea (o usa `listProps` / `itemProps`, que derivan de ella) para que Alpine re-renderice cuando cambie la selección:

```html
<p x-text="$store.selection.instances.rows?.selectedKeys.join(', ')"></p>
```

`isSelected()`, `isActive()` y ayudantes similares son para código imperativo (manejadores de eventos, tests). No registran dependencias reactivas en plantillas.

En métodos de objeto inline de `x-data`, nombres sueltos como `mode` o `items` **no** están en ámbito — usa `this.mode` / `this.items`, o llama a `create` desde una expresión `x-init`:

```html
<div
  x-data="{ items: ['Alpha', 'Bravo'], mode: 'multiple' }"
  x-init="$store.selection.create('rows', { mode, keys: items })"
>
```

## Opciones

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `mode` | `"single"` | `single`, `multiple` o `range` |
| `keys` | `[]` | Claves seleccionables ordenadas (define el orden del rango) |
| `disabledKeys` | `[]` | Claves que no pueden seleccionarse |
| `allowDisabledSelection` | `false` | Permite seleccionar claves deshabilitadas programáticamente |
| `value` / `defaultValue` | — | Valor controlado o inicial |
| `onChange` | — | Se llama tras cada transición confirmada |

## Modos

| Modo | Forma del valor | Uso típico |
|------|-----------------|------------|
| `single` | `key \| null` | Listbox, grupo radio, pestañas |
| `multiple` | `key[]` | Tablas multi-selección, checklists |
| `range` | `{ from, to? }` | Rangos shift-click, calendarios |

## Interacciones de puntero

| Gesto | Comando |
|-------|---------|
| Clic | `replace(id, key)` |
| Ctrl/Cmd + clic | `toggle(id, key)` (multiple) |
| Shift + clic | `extend(id, key)` (range / multiple) |

Llama a `setActive(id, key)` en pointer down o clic para que `activeKey` permanezca sincronizado para la continuación por teclado.

## Accesibilidad

Usa `listProps` e `itemProps` para semántica WAI-ARIA listbox (`role`, `aria-selected`, `aria-disabled`, `aria-multiselectable`). Combina manejadores de teclado con `setActive`, `moveSelectableKey` y `extend` para selección por flechas y shift-flecha.

## Adopción en el toolkit

`@ailuracode/alpine-calendar`, `@ailuracode/alpine-command`, `@ailuracode/alpine-tabs` y `@ailuracode/alpine-accordion` construyen sobre estas primitivas internamente (o estado inline equivalente).

| Paquete | Uso |
|---------|-----|
| `@ailuracode/alpine-calendar` | (estado inline) Claves de fecha enlazadas a cadenas ISO |
| `@ailuracode/alpine-tabs` | Seguimiento de pestaña activa |
| `@ailuracode/alpine-accordion` | Foco de ítem activo |
| `@ailuracode/alpine-command` | Navegación del ítem resaltado |

Los consumidores de esos paquetes no necesitan instalar `@ailuracode/alpine-selection` salvo que usen las primitivas de selección directamente.
