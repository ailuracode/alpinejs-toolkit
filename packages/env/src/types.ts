import type { SingletonScope } from "@ailuracode/alpine-core";

export type VisibilityState = "visible" | "hidden" | "prerender";

export interface NetworkMagic {
  readonly isOnline: boolean;
  readonly isOffline: boolean;
}

export interface VisibilityMagic {
  readonly isVisible: boolean;
  readonly isHidden: boolean;
  readonly state: VisibilityState;
  is(state: VisibilityState): boolean;
}

export interface BatteryMagic {
  readonly isAvailable: boolean;
  readonly level: number | null;
  readonly isCharging: boolean;
  readonly chargingTime: number | null;
  readonly dischargingTime: number | null;
}

export type PlatformName =
  | "macos"
  | "windows"
  | "linux"
  | "ios"
  | "android"
  | "chromeos"
  | "unknown";

export interface PlatformFlags {
  readonly isMac: boolean;
  readonly isWindows: boolean;
  readonly isLinux: boolean;
  readonly isIos: boolean;
  readonly isAndroid: boolean;
  readonly isChromeos: boolean;
}

export interface PlatformMagic extends PlatformFlags {
  readonly name: PlatformName;
  is(platform: PlatformName): boolean;
}

export interface EnvState {
  readonly network: NetworkMagic;
  readonly visibility: VisibilityMagic;
  readonly battery: BatteryMagic;
  readonly platform: PlatformMagic;
}

export interface EnvEvents extends Record<string, unknown> {
  change: EnvState;
}

export type EnvPluginOptions = {
  network?: boolean;
  visibility?: boolean;
  battery?: boolean;
  platform?: boolean;
  /**
   * `$network` magic key the plugin registers under. Defaults to
   * {@link DEFAULT_ENV_NETWORK_KEY}. Set when the host already owns
   * a `network` magic or another toolkit plugin would collide on
   * that name — the rename avoids the collision without touching
   * the underlying state.
   */
  readonly networkKey?: string;
  /**
   * `$visibility` magic key the plugin registers under. Defaults to
   * {@link DEFAULT_ENV_VISIBILITY_KEY}.
   */
  readonly visibilityKey?: string;
  /**
   * `$battery` magic key the plugin registers under. Defaults to
   * {@link DEFAULT_ENV_BATTERY_KEY}.
   */
  readonly batteryKey?: string;
  /**
   * `$platform` magic key the plugin registers under. Defaults to
   * {@link DEFAULT_ENV_PLATFORM_KEY}.
   */
  readonly platformKey?: string;
};

/** Default `$network` magic key registered by {@link envPlugin}. */
export const DEFAULT_ENV_NETWORK_KEY = "network";
/** Default `$visibility` magic key registered by {@link envPlugin}. */
export const DEFAULT_ENV_VISIBILITY_KEY = "visibility";
/** Default `$battery` magic key registered by {@link envPlugin}. */
export const DEFAULT_ENV_BATTERY_KEY = "battery";
/** Default `$platform` magic key registered by {@link envPlugin}. */
export const DEFAULT_ENV_PLATFORM_KEY = "platform";

/** Options accepted by {@link createEnv}. */
export interface CreateEnvOptions {
  /**
   * Singleton scope for this controller. Defaults to the active
   * `document`, an ambient `runWithSingletonScope()` context, or —
   * in SSR — must be provided explicitly via
   * `createSingletonScope()`.
   */
  readonly scope?: SingletonScope;
}
