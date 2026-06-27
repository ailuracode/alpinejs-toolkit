# @ailuracode/alpinejs-visibility

Tab visibility magic for Alpine.js.

**[Full documentation →](../../docs/plugins/visibility.md)**

## Install

```bash
npm install @ailuracode/alpinejs-visibility alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import visibility from "@ailuracode/alpinejs-visibility";

Alpine.plugin(visibility);
Alpine.start();
```

```html
<div x-show="!$visibility.isVisible">Tab is in the background</div>
<span x-text="$visibility.state"></span>
```

## Exported helpers

```js
import {
  VISIBILITY_STATES,
  createVisibilityState,
  readVisibilityState,
} from "@ailuracode/alpinejs-visibility";
```

## API summary

| | |
|-|-|
| **Magic** | `$visibility` |
| **Getters** | `isVisible`, `isHidden` (boolean), `state` (`VisibilityState`) |
| **Methods** | `is(state)` |
| **Helpers** | `readVisibilityState()`, `createVisibilityState()`, `VISIBILITY_STATES` |

## License

MIT
