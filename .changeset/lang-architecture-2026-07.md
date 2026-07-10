---
"@ailuracode/alpine-lang": minor
---

Migrate to the headless controller architecture shared with `@ailuracode/alpine-theme`. The package now exposes a `LangController extends BaseController<LangEvents>` plus a headless `createLang(options)` factory (singleton per document); `langPlugin(options)` is a thin Alpine adapter that wires the controller into `$store.lang` and `$lang`.

**Breaking changes:**

- Drop the default export. Import the named `langPlugin` factory instead:
  ```diff
  - import lang from "@ailuracode/alpine-lang";
  - Alpine.plugin(lang({ fallback: "en" }));
  + import { langPlugin } from "@ailuracode/alpine-lang";
  + Alpine.plugin(langPlugin({ fallback: "en" }));
  ```
- Drop the registration-time `LangPluginOptions.onChange` callback. Subscribe to the manager's typed `change` event for side effects, with multiple subscribers and runtime (un)subscription:
  ```js
  import { createLang } from "@ailuracode/alpine-lang";

  const lang = createLang({ fallback: "en" });
  const stop = lang.on("change", (detail) => {
    // detail: { current, base, region, languages, fallback, isDetected, source, previous }
    // source is "initialization" | "user" | "reset".
    document.documentElement.lang = detail.current;
    loadMessages(detail.current);
  });
  ```
  `Alpine.plugin(langPlugin(...))` and `createLang(...)` reach the same singleton controller, so you can subscribe from any module without coordinating with Alpine's startup sequence.

**New additions:**

- `createLang(options)` returns the singleton `LangController` for non-Alpine consumers (custom stores, server adapters, tests).
- `NavigatorLike` injection via `createLang({ navigator })` for SSR adapters and test fixtures. Pass `null` to disable browser detection explicitly.
- Typed `LangEvents` event map + `LangListener` callback alias (re-exported from the package root).
- `manager.get()` returns an immutable `LangState` snapshot (`current` / `base` / `region` / `languages` / `fallback` / `isDetected`).
- `LangChangeSource = "initialization" | "user" | "reset"` and structured `LangChangeDetail` (with `previous` and full snapshot) reach every subscriber.

**Internal:**

- Split the monolithic source into `controller.ts` / `events.ts` / `plugin.ts` / `types.ts` / `internal/language-tag.ts`; `index.ts` is re-exports only.
- Drop the `Alpine.Stores` / `Alpine.Magics<T>` augmentation in `src/global.d.ts` — same pattern as `@ailuracode/alpine-theme`. Consumers that need typed `$store.lang` access should declare the augmentation in their own `*.d.ts` (or use `Alpine<{ lang: LangStore }>` from `@ailuracode/alpine-core`).
- Add `@ailuracode/alpine-core` as both `peerDependencies` and `devDependencies`.
- Tests split into `manager.test.ts` (controller-level with navigator injection), `plugin.test.ts` (mock-Alpine registration + real-Alpine reactivity), `helpers.test.ts`, and `types.test.ts`.
