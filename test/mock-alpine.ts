import type AlpineType from "alpinejs";

export interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, unknown>;
  cleanups: Array<() => void>;
  pluginCalls: Array<(alpine: MockAlpine) => void>;
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
  store(name: string, value?: unknown): unknown;
  plugin(callback: (alpine: MockAlpine) => void): void;
  cleanup(callback: () => void): void;
}

export interface MockAlpineOptions {
  readonly evaluateMagics?: boolean;
}

export function createMockAlpine(options: MockAlpineOptions = {}): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    cleanups: [],
    pluginCalls: [],
    reactive(value) {
      return value;
    },
    magic(name, factory) {
      alpine.magics[name] = options.evaluateMagics ? factory() : factory;
    },
    store(name, ...rest) {
      if (rest.length === 0) {
        return alpine.stores[name];
      }
      alpine.stores[name] = rest[0];
      return undefined;
    },
    plugin(callback) {
      alpine.pluginCalls.push(callback);
      callback(alpine);
    },
    cleanup(callback) {
      alpine.cleanups.push(callback);
    },
  };
  return alpine;
}

export function asAlpine(mock: MockAlpine): AlpineType.Alpine {
  return mock as unknown as AlpineType.Alpine;
}

export function createMagicHarness(
  plugin: (alpine: AlpineType.Alpine) => void
): Record<string, unknown> {
  const Alpine = createMockAlpine({ evaluateMagics: true });
  plugin(Alpine as unknown as AlpineType.Alpine);
  return Alpine.magics;
}
