---
title: "Child"
description: "Package: @ailuracode/alpine-child"
---

Package: `@ailuracode/alpine-child`

Directiva `x-child` inspirada en el patrón **asChild** de Radix UI y shadcn/ui. Transfiere atributos, clases, estilos y bindings de Alpine del wrapper al primer hijo elemento real — y luego elimina el wrapper del DOM.

## Instalación

```bash
npm install @ailuracode/alpine-child alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import child from "@ailuracode/alpine-child";

Alpine.plugin(child);
Alpine.start();
```

## Uso básico

```html
<span
  x-child
  class="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
  @click="alert('clicked')"
>
  <a href="/docs">Ir a docs</a>
</span>
```

Tras la inicialización de Alpine:

```html
<a
  href="/docs"
  class="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
  @click="alert('clicked')"
>
  Ir a docs
</a>
```

## Comparación con `asChild`

En librerías React:

```jsx
<Button asChild>
  <a href="/docs">Docs</a>
</Button>
```

Con Alpine y markup compatible con Blade:

```html
<span x-child class="btn" role="button">
  <a href="/docs">Docs</a>
</span>
```

| Aspecto | `asChild` (React) | `x-child` (Alpine) |
|---------|-------------------|---------------------|
| Nodo DOM extra | Evitado con `cloneElement` | Evitado al desenrollar el DOM |
| Fusión de clases | Específica de la librería | Tokens de `class` fusionados |
| Eventos | Merge de props | `@click` / `x-on:*` copiados al hijo |
| HTML en servidor | N/A | El wrapper existe hasta la hidratación |

Usa `x-child` al construir **primitivos Alpine headless** o **componentes Blade** que no deben forzar un `<span>` o `<div>` alrededor de enlaces y botones.

## Cómo funciona

1. Durante `Alpine.initTree()`, el plugin intercepta elementos con `x-child`.
2. Localiza el **primer hijo elemento** (salta texto y comentarios).
3. Fusiona atributos en el hijo según el modo activo.
4. Reemplaza el wrapper por el hijo en el DOM.
5. Alpine inicializa el hijo para que las directivas transferidas se enlacen correctamente.

## Modificadores

```html
<div x-child>
  <button type="button">Por defecto</button>
</div>

<div x-child.merge>
  <button type="button">Merge explícito</button>
</div>

<div x-child.replace>
  <button type="button">El wrapper gana conflictos</button>
</div>
```

### Por defecto / `.merge`

- `class` — fusionada; tokens del hijo primero, luego del wrapper (`custom btn`)
- `style` — fusionado; las propiedades del hijo ganan en conflicto
- Otros atributos — copiados solo si faltan en el hijo
- `id`, `aria-*`, `data-*` existentes en el hijo — preservados

### `.replace`

- Los valores del wrapper sobrescriben los del hijo en conflictos
- `class` y `style` siguen fusionando listas de tokens/propiedades

## Eventos

Los handlers declarativos del wrapper se copian al hijo:

```html
<span x-child @click="open = true" @keydown.escape="open = false">
  <button type="button">Open</button>
</span>
```

El botón recibe ambos handlers. El scope viene del ancestro `x-data` más cercano, o de `x-data` transferido desde el wrapper.

Las llamadas runtime con `addEventListener` en el wrapper **no** se mueven.

## Ejemplo con componente Blade

```blade
{{-- components/ui/button.blade.php --}}
<span
    x-child
    {{ $attributes->class(['inline-flex items-center rounded-md px-4 py-2 text-sm font-medium']) }}
>
    {{ $slot }}
</span>
```

```blade
<x-ui.button type="button" @click="save()">
    <button type="submit">Save</button>
</x-ui.button>
```

El botón submit conserva `type="submit"` mientras hereda clases de layout y `@click` del root del componente.

## Qué no se copia

- `x-child` en sí
- `x-ignore`, `x-teleport`, `x-cloak`
- Internos de transition / teleport que podrían doble-inicializar

## Limitaciones

- **Un solo hijo** — solo se promueve el primer hijo elemento; hermanos extra se eliminan con el wrapper desacoplado.
- **Sin hijo elemento** — registra un warning en consola y deja el markup sin cambios.
- **Compatible con estático** — pensado para markup Blade/SSR que incluye el wrapper en el HTML.
- **No usar en wrappers `x-for`** — usa un wrapper estable alrededor de un solo hijo.
- **Listeners programáticos** — solo se transfieren atributos declarativos de Alpine.

## Recomendaciones

- Prefiere un hijo semántico (`<a>`, `<button>`) y pon la presentación en el wrapper.
- Mantén un solo hijo interactivo por wrapper.
- Pon estado compartido en un `x-data` padre cuando el wrapper no deba tener scope propio.
- Usa `.replace` cuando el root del componente deba imponer atributos de accesibilidad.

## Playground

Demo interactiva en `/playground/child/` del sitio de documentación.
