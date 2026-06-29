---
title: "Child"
description: "Package: @ailuracode/alpine-child"
---

Package: `@ailuracode/alpine-child`

`x-child` directive inspired by the **asChild** pattern from Radix UI and shadcn/ui. Transfer wrapper attributes, classes, styles, and Alpine bindings to the first real child element — then remove the wrapper from the DOM.

## Install

```bash
npm install @ailuracode/alpine-child alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import child from "@ailuracode/alpine-child";

Alpine.plugin(child);
Alpine.start();
```

## Basic usage

```html
<span
  x-child
  class="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
  @click="alert('clicked')"
>
  <a href="/docs">Ir a docs</a>
</span>
```

After Alpine initializes:

```html
<a
  href="/docs"
  class="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
  @click="alert('clicked')"
>
  Ir a docs
</a>
```

## Comparison with `asChild`

In React component libraries:

```jsx
<Button asChild>
  <a href="/docs">Docs</a>
</Button>
```

With Alpine and Blade-friendly markup:

```html
<span x-child class="btn" role="button">
  <a href="/docs">Docs</a>
</span>
```

| Concern | `asChild` (React) | `x-child` (Alpine) |
|---------|-------------------|---------------------|
| Extra DOM node | Avoided via `cloneElement` | Avoided via DOM unwrap |
| Class merging | Library-specific | `class` tokens merged |
| Events | Prop merge | `@click` / `x-on:*` copied to child |
| Server HTML | N/A | Wrapper present until hydration |

Use `x-child` when building **headless Alpine primitives** or **Blade components** that should not force a `<span>` or `<div>` around links and buttons.

## How it works

1. During `Alpine.initTree()`, the plugin intercepts elements with `x-child`.
2. It locates the **first element child** (skips text and comments).
3. Attributes are merged onto the child following the active mode.
4. The wrapper is replaced by the child in the DOM.
5. Alpine initializes the child so transferred directives bind correctly.

## Modifiers

```html
<div x-child>
  <button type="button">Default</button>
</div>

<div x-child.merge>
  <button type="button">Explicit merge</button>
</div>

<div x-child.replace>
  <button type="button">Wrapper wins conflicts</button>
</div>
```

### Default / `.merge`

- `class` — merged; child tokens first, then wrapper (`custom btn`)
- `style` — merged; child properties win on conflict
- Other attributes — copied only when missing on the child
- Existing child `id`, `aria-*`, `data-*` — preserved

### `.replace`

- Wrapper values overwrite child values on conflict
- `class` and `style` still merge token/property lists

## Events

Declarative handlers on the wrapper are copied to the child:

```html
<span x-child @click="open = true" @keydown.escape="open = false">
  <button type="button">Open</button>
</span>
```

The button receives both handlers. Scope comes from the nearest `x-data` ancestor, or from `x-data` transferred from the wrapper.

Runtime `addEventListener` calls on the wrapper are **not** moved.

## Blade component example

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

The submit button keeps `type="submit"` while inheriting layout classes and `@click` from the component root.

## What is not copied

- `x-child` itself
- `x-ignore`, `x-teleport`, `x-cloak`
- Transition / teleport internals that could double-initialize

## Limitations

- **Single child** — only the first element child is promoted; additional element siblings are removed with the detached wrapper.
- **No wrapper child** — logs a console warning and leaves markup unchanged.
- **Static-friendly** — designed for Blade/SSR markup that includes the wrapper in HTML.
- **Not for `x-for` wrappers** — use a stable wrapper around a single child instead.
- **Programmatic listeners** — only declarative Alpine attributes are transferred.

## Recommendations

- Prefer a semantic child (`<a>`, `<button>`) and put presentation on the wrapper.
- Keep one interactive child per wrapper.
- Put shared state on a parent `x-data` when the wrapper should not own scope.
- Use `.replace` when the component root must enforce accessibility attributes.

## Playground

See the interactive demo at `/playground/child/` in the documentation site.
