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
};
