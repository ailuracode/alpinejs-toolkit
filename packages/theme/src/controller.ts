import {
  BaseController,
  createSingleton,
  generateId,
  releaseSingleton,
} from "@ailuracode/alpine-core";
import { createDomHandle } from "./internal/dom-strategy";
import { coerceThemePreference, defaultThemePreference, resolveTheme } from "./internal/validation";
import { createLocalStorageThemeStorage } from "./local-storage";
import { createSystemObserver, readSystemTheme } from "./system-observer";
import type {
  CreateThemeOptions,
  ResolvedTheme,
  ThemeChangeSource,
  ThemeEvents,
  ThemePreference,
  ThemeState,
  ThemeStorage,
} from "./types";

export function createTheme(options: CreateThemeOptions = {}): ThemeController {
  const { scope, ...factoryOptions } = options;
  return createSingleton(
    "@ailuracode/alpine-theme/default",
    () => {
      const controller = new ThemeController(factoryOptions);
      controller.mount();
      return controller;
    },
    { scope }
  );
}

export class ThemeController extends BaseController<ThemeEvents> {
  readonly #defaultTheme: ThemePreference;
  readonly #storage: ThemeStorage;
  readonly #dom: ReturnType<typeof createDomHandle>;
  readonly #watchSystem: boolean;
  readonly #crossTab: boolean;

  #lastWritten: ThemePreference | null = null;

  #current: ThemePreference;
  #system: ResolvedTheme;
  #resolved: ResolvedTheme;

  constructor(options: CreateThemeOptions) {
    super(options.id ?? generateId("theme"));

    this.#defaultTheme = coerceThemePreference(options.defaultTheme, defaultThemePreference());
    this.#storage = options.storage ?? createLocalStorageThemeStorage();
    this.#watchSystem = options.watchSystem !== false;
    this.#crossTab = options.crossTab !== false;
    this.#dom = createDomHandle(options);

    this.#current = this.#defaultTheme;
    this.#system = "light";
    this.#resolved = resolveTheme(this.#current, this.#system);
  }

  get current(): ThemePreference {
    return this.#current;
  }

  get system(): ResolvedTheme {
    return this.#system;
  }

  get resolved(): ResolvedTheme {
    return this.#resolved;
  }

  get(): ThemeState {
    return {
      current: this.#current,
      system: this.#system,
      resolved: this.#resolved,
    };
  }

  set(value: ThemePreference): void {
    if (this.isDestroyed) {
      return;
    }
    const safe = coerceThemePreference(value, this.#defaultTheme);
    if (safe === this.#current) {
      return;
    }
    this.#setCurrent(safe, "user");
  }

  toggle(): void {
    if (this.isDestroyed) {
      return;
    }
    const next: ThemePreference = this.#resolved === "dark" ? "light" : "dark";
    this.#setCurrent(next, "user");
  }

  reset(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#storage.remove();
    if (this.#current === this.#defaultTheme) {
      return;
    }
    this.#setCurrent(this.#defaultTheme, "reset");
  }

  apply(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#dom.apply(this.#resolved, true);
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    super.destroy();
    this.#dom.destroy();
    releaseSingleton("@ailuracode/alpine-theme/default", this);
  }

  override mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();
    this.#init();
  }

  #init(): void {
    const persisted = this.#storage.get();
    const safe = coerceThemePreference(persisted ?? this.#defaultTheme, this.#defaultTheme);

    if (safe !== this.#current) {
      this.#current = safe;
    }
    this.#system = readSystemTheme();
    this.#resolved = resolveTheme(this.#current, this.#system);
    this.#dom.apply(this.#resolved);

    if (this.#watchSystem) {
      this.registerCleanup(createSystemObserver((next) => this.#handleSystemChange(next)));
    }

    if (this.#crossTab && this.#storage.subscribe) {
      const subscribe = this.#storage.subscribe.bind(this.#storage);
      this.registerCleanup(subscribe((next) => this.#handleCrossTabUpdate(next)));
    }

    queueMicrotask(() => {
      if (this.isDestroyed) {
        return;
      }
      this.emit("change", {
        current: this.#current,
        system: this.#system,
        resolved: this.#resolved,
        source: "initialization",
        previous: null,
      });
    });
  }

  #setCurrent(next: ThemePreference, source: ThemeChangeSource): void {
    const previousCurrent = this.#current;
    const previousResolved = this.#resolved;

    this.#current = next;
    this.#resolved = resolveTheme(next, this.#system);

    if (this.#resolved !== previousResolved) {
      this.#dom.apply(this.#resolved);
    }

    if (source === "user") {
      this.#storage.set(next);
      this.#lastWritten = next;
    }

    this.emit("change", {
      current: next,
      system: this.#system,
      resolved: this.#resolved,
      source,
      previous: {
        current: previousCurrent,
        system: this.#system,
        resolved: previousResolved,
      },
    });
  }

  #handleSystemChange(next: ResolvedTheme): void {
    if (this.isDestroyed) {
      return;
    }
    this.#system = next;
    if (this.#current !== "system" || next === this.#resolved) {
      return;
    }

    const previousResolved = this.#resolved;
    this.#resolved = next;
    this.#dom.apply(next);
    this.emit("change", {
      current: "system",
      system: next,
      resolved: next,
      source: "system",
      previous: {
        current: "system",
        system: next,
        resolved: previousResolved,
      },
    });
  }

  #handleCrossTabUpdate(next: ThemePreference | null): void {
    if (this.isDestroyed) {
      return;
    }
    if (next !== null && this.#lastWritten === next) {
      this.#lastWritten = null;
      return;
    }
    const safe = coerceThemePreference(next ?? this.#defaultTheme, this.#defaultTheme);
    if (safe === this.#current) {
      return;
    }
    this.#setCurrent(safe, "storage");
  }
}
