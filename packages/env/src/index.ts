export { isAndroidDevice, isIosDevice } from "./internal/platform.js";
export { default } from "./plugin.js";
export type {
  BatteryMagic,
  CreateEnvOptions,
  EnvPluginOptions,
  EnvState,
  NetworkMagic,
  PlatformFlags,
  PlatformMagic,
  PlatformName,
  VisibilityMagic,
  VisibilityState,
} from "./types.js";
export {
  DEFAULT_ENV_BATTERY_KEY,
  DEFAULT_ENV_NETWORK_KEY,
  DEFAULT_ENV_PLATFORM_KEY,
  DEFAULT_ENV_VISIBILITY_KEY,
} from "./types.js";
