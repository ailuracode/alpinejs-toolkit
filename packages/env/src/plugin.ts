import type AlpineType from "alpinejs";
import { type BatteryManagerLike, readBatteryState } from "./internal/battery.js";
import { readNetworkState } from "./internal/network.js";
import { readPlatformState } from "./internal/platform.js";
import { readVisibilityState } from "./internal/visibility.js";
import type {
  BatteryMagic,
  EnvPluginOptions,
  NetworkMagic,
  PlatformMagic,
  VisibilityMagic,
} from "./types.js";

interface AlpineAugmented {
  cleanup?(callback: () => void): void;
}

interface AlpineInstall {
  magic(name: string, factory: () => unknown): void;
  reactive<T>(value: T): T;
}

type ReactiveMagics = {
  network: {
    isOnline: boolean;
    isOffline: boolean;
  } | null;
  visibility: {
    isVisible: boolean;
    isHidden: boolean;
    state: VisibilityMagic["state"];
    is(state: VisibilityMagic["state"]): boolean;
  } | null;
  battery: {
    isAvailable: boolean;
    level: number | null;
    isCharging: boolean;
    chargingTime: number | null;
    dischargingTime: number | null;
  } | null;
  platform: {
    name: PlatformMagic["name"];
    isMac: boolean;
    isWindows: boolean;
    isLinux: boolean;
    isIos: boolean;
    isAndroid: boolean;
    isChromeos: boolean;
    is(platform: PlatformMagic["name"]): boolean;
  } | null;
};

type RuntimeSnapshot = Pick<RuntimeState, "network" | "visibility" | "battery" | "platform">;
type RuntimeSubscriber = (state: RuntimeSnapshot) => void;

type RuntimeState = {
  readonly subscribers: Set<RuntimeSubscriber>;
  readonly cleanups: Array<() => void>;
  mounted: boolean;
  network: NetworkMagic;
  visibility: Omit<VisibilityMagic, "is">;
  battery: BatteryMagic;
  platform: Omit<PlatformMagic, "is">;
};

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>;
};

const BATTERY_EVENTS = [
  "chargingchange",
  "levelchange",
  "chargingtimechange",
  "dischargingtimechange",
] as const;

const runtime: RuntimeState = {
  subscribers: new Set<RuntimeSubscriber>(),
  cleanups: [],
  mounted: false,
  network: { isOnline: true, isOffline: false },
  visibility: { isVisible: true, isHidden: false, state: "visible" },
  battery: {
    isAvailable: false,
    level: null,
    isCharging: false,
    chargingTime: null,
    dischargingTime: null,
  },
  platform: {
    name: "unknown",
    isMac: false,
    isWindows: false,
    isLinux: false,
    isIos: false,
    isAndroid: false,
    isChromeos: false,
  },
};

function emit(): void {
  for (const subscriber of runtime.subscribers) {
    subscriber(runtime);
  }
}

function resetRuntime(): void {
  runtime.mounted = false;
  runtime.network = { isOnline: true, isOffline: false };
  runtime.visibility = { isVisible: true, isHidden: false, state: "visible" };
  runtime.battery = {
    isAvailable: false,
    level: null,
    isCharging: false,
    chargingTime: null,
    dischargingTime: null,
  };
  runtime.platform = {
    name: "unknown",
    isMac: false,
    isWindows: false,
    isLinux: false,
    isIos: false,
    isAndroid: false,
    isChromeos: false,
  };
}

function destroyRuntime(): void {
  while (runtime.cleanups.length > 0) {
    const cleanup = runtime.cleanups.pop();

    cleanup?.();
  }

  resetRuntime();
}

export function resetEnvRuntimeForTests(): void {
  runtime.subscribers.clear();
  destroyRuntime();
}

function ensureRuntime(): void {
  if (runtime.mounted) {
    return;
  }

  runtime.mounted = true;
  runtime.network = readNetworkState();
  runtime.visibility = readVisibilityState();
  runtime.battery = readBatteryState();
  runtime.platform = readPlatformState();

  if (typeof window !== "undefined") {
    const updateNetwork = () => {
      runtime.network = readNetworkState();
      emit();
    };

    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    runtime.cleanups.push(() => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    });
  }

  if (typeof document !== "undefined") {
    const updateVisibility = () => {
      runtime.visibility = readVisibilityState();
      emit();
    };

    document.addEventListener("visibilitychange", updateVisibility);
    runtime.cleanups.push(() => {
      document.removeEventListener("visibilitychange", updateVisibility);
    });
  }

  if (typeof navigator !== "undefined") {
    const nav = navigator as NavigatorWithBattery;

    if (typeof nav.getBattery === "function") {
      void nav
        .getBattery()
        .then((battery) => {
          if (!runtime.mounted) {
            return;
          }

          const updateBattery = () => {
            runtime.battery = readBatteryState(battery);
            emit();
          };

          updateBattery();

          for (const eventName of BATTERY_EVENTS) {
            battery.addEventListener(eventName, updateBattery);
          }

          runtime.cleanups.push(() => {
            for (const eventName of BATTERY_EVENTS) {
              battery.removeEventListener(eventName, updateBattery);
            }
          });
        })
        .catch((error) => {
          runtime.battery = readBatteryState();
          void error;
          emit();
        });
    }
  }

  emit();
}

function subscribe(listener: RuntimeSubscriber): () => void {
  ensureRuntime();
  runtime.subscribers.add(listener);
  listener(runtime);

  return () => {
    runtime.subscribers.delete(listener);

    if (runtime.subscribers.size === 0) {
      destroyRuntime();
    }
  };
}

function createReactiveMagics(
  Alpine: AlpineInstall,
  options: Required<EnvPluginOptions>
): ReactiveMagics {
  return {
    network: options.network ? Alpine.reactive({ ...runtime.network }) : null,
    visibility: options.visibility
      ? Alpine.reactive({
          ...runtime.visibility,
          is(state: VisibilityMagic["state"]) {
            return this.state === state;
          },
        })
      : null,
    battery: options.battery ? Alpine.reactive({ ...runtime.battery }) : null,
    platform: options.platform
      ? Alpine.reactive({
          ...runtime.platform,
          is(platform: PlatformMagic["name"]) {
            return this.name === platform;
          },
        })
      : null,
  };
}

function registerMagics(Alpine: AlpineInstall, magics: ReactiveMagics): void {
  for (const [name, value] of Object.entries(magics)) {
    if (value) {
      Alpine.magic(name, () => value);
    }
  }
}

function syncMagics(state: RuntimeSnapshot, magics: ReactiveMagics): void {
  if (magics.network) {
    Object.assign(magics.network, state.network);
  }
  if (magics.visibility) {
    Object.assign(magics.visibility, state.visibility);
  }
  if (magics.battery) {
    Object.assign(magics.battery, state.battery);
  }
  if (magics.platform) {
    Object.assign(magics.platform, state.platform);
  }
}

/** Registers browser environment magics: `$network`, `$visibility`, `$battery`, `$platform`. */
export default function envPlugin(options: EnvPluginOptions = {}): AlpineType.PluginCallback {
  const {
    network: enableNetwork = true,
    visibility: enableVisibility = true,
    battery: enableBattery = true,
    platform: enablePlatform = true,
  } = options;

  return function registerEnv(alpine) {
    const Alpine = alpine as AlpineType.Alpine & AlpineAugmented;
    const typedAlpine = alpine as unknown as AlpineInstall;
    const magics = createReactiveMagics(typedAlpine, {
      network: enableNetwork,
      visibility: enableVisibility,
      battery: enableBattery,
      platform: enablePlatform,
    });

    registerMagics(typedAlpine, magics);

    const unsubscribe = subscribe((state) => {
      syncMagics(state, magics);
    });

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => {
        unsubscribe();
      });
    }
  };
}
