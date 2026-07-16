import { guardMagic } from "@ailuracode/alpine-core/registration";
import type AlpineType from "alpinejs";
import {
  createNotifyMagic,
  registerNotifyServiceWorker,
  resolveNotifyConfig,
} from "./controller.js";
import type { NotifyPluginOptions } from "./types.js";
import { DEFAULT_NOTIFY_MAGIC_KEY } from "./types.js";

export {
  closeNotification,
  createNotifyMagic,
  getNotifyPermission,
  isIosDevice,
  isNotifySupported,
  isStandaloneDisplayMode,
  registerNotifyServiceWorker,
  requestNotifyPermission,
  requiresHomeScreenInstall,
  requiresServiceWorkerNotifications,
  resetNotifyServiceWorkerRegistrationForTests,
  resolveNotifyConfig,
  sendNotification,
  sendNotificationAsync,
  supportsDirectNotifications,
} from "./controller.js";
export type { NotifyMagic, NotifyPluginOptions } from "./types.js";
export { DEFAULT_NOTIFY_MAGIC_KEY } from "./types.js";

function registerNotifyPlugin(Alpine: AlpineType.Alpine, options: NotifyPluginOptions): void {
  const config = resolveNotifyConfig(options);

  if (config.autoRegisterServiceWorker) {
    void registerNotifyServiceWorker(options);
  }

  const magicKey = options.magicKey ?? DEFAULT_NOTIFY_MAGIC_KEY;

  guardMagic(Alpine, magicKey, () => createNotifyMagic(options), "notify");
}

/** Alpine.js notify plugin. Registers magic `$notify`. */
export function notifyPlugin(
  optionsOrAlpine?: NotifyPluginOptions | AlpineType.Alpine
): undefined | ((Alpine: AlpineType.Alpine) => void) {
  if (optionsOrAlpine && typeof (optionsOrAlpine as AlpineType.Alpine).magic === "function") {
    registerNotifyPlugin(optionsOrAlpine as AlpineType.Alpine, {});
    return;
  }

  const options = (optionsOrAlpine as NotifyPluginOptions | undefined) ?? {};

  return (Alpine: AlpineType.Alpine) => {
    registerNotifyPlugin(Alpine, options);
  };
}

export default notifyPlugin;
