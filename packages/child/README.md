# @ailuracode/alpine-child

Alpine.js directive for **asChild-style** composition: transfer attributes, classes, styles, and Alpine bindings from a wrapper to its first real child element — without an extra DOM node.

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

## Usage

```html
<span
  x-child
  class="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
  @click="console.log('button behavior')"
>
  <a href="/docs">Docs</a>
</span>
```

Result in the DOM:

```html
<a
  href="/docs"
  class="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
>
  Docs
</a>
```

## Comparison with `asChild`

| React (Radix / shadcn) | Alpine (`x-child`) |
|------------------------|--------------------|
| `<Button asChild><a href="…">` | `<span x-child …><a href="…">` |
| `cloneElement` merges props | Directive merges attributes onto first child |
| No wrapper in React tree | Wrapper is removed from the live DOM |

`x-child` is useful for **headless Alpine components** and **Blade/Laravel components** that need button/link semantics without an extra `<span>` in the final markup.

## Modifiers

| Modifier | Behavior |
|----------|----------|
| *(none)* | Merge `class` / `style`; copy other attributes only when missing on the child |
| `.merge` | Same as default (explicit) |
| `.replace` | Wrapper values win on conflicts (classes still merge) |

```html
<div x-child.replace class="wrapper" aria-label="Wrapper">
  <button class="child" aria-label="Child">Action</button>
</div>
```

## Attribute rules

**Merged:** `class`, `style`

**Copied when missing on child:** `aria-*`, `data-*`, `role`, `tabindex`, `@click`, `x-on:*`, `x-bind:*`, `:attr`, etc.

**Child wins by default:** existing `id`, `aria-*`, `data-*`, and most attributes

**Never copied:** `x-child`, `x-ignore`, `x-teleport`, `x-cloak`, transition internals

**Scope transfer:** `x-data`, `x-init`, and `x-ref` move to the child when the child does not already define them

## Events

Declarative Alpine events on the wrapper (`@click`, `@keydown.enter`, `x-on:click`) are copied to the child before Alpine initializes the child, so handlers run on the real interactive element.

Programmatic listeners attached to the wrapper at runtime are **not** transferred.

## Blade components

```blade
{{-- resources/views/components/button.blade.php --}}
<span
    x-child
    {{ $attributes->merge(['class' => 'inline-flex rounded-md px-4 py-2']) }}
>
    {{ $slot }}
</span>
```

```blade
<x-button>
    <a href="{{ route('docs') }}">Docs</a>
</x-button>
```

The anchor receives merged classes and any Alpine attributes you put on `<x-button>`.

## Limitations

- Only the **first element child** is kept; text nodes and comments are skipped. Extra element siblings are discarded with the detached wrapper.
- Works best when the wrapper exists in static HTML/Blade before `Alpine.start()`. Dynamically inserted trees are supported via `Alpine.initTree()`.
- `x-for` / `x-if` on the wrapper are not supported — use `x-child` on stable wrapper markup instead.
- Nested `x-child` on the same branch is not supported.
- SSR: the wrapper is present in server HTML; after hydration the wrapper is replaced client-side.

## API

This package registers a single directive:

- `x-child`
- `x-child.merge`
- `x-child.replace`

No stores or magics are added.

## License

MIT
