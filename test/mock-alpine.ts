import type AlpineType from "alpinejs";

interface MockAlpine {
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
  store(_name: string, _value?: unknown): void;
}

export function createMagicHarness(
  plugin: AlpineType.PluginCallback | ((alpine: MockAlpine) => void)
): Record<string, unknown> {
  const magics: Record<string, unknown> = {};

  const Alpine: MockAlpine = {
    reactive(value) {
      return value;
    },
    magic(name, factory) {
      magics[name] = factory();
    },
    store() {
      // mock stub
    },
  };

  plugin(Alpine as unknown as AlpineType.Alpine);

  return magics;
}
