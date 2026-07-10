import type AlpineType from "alpinejs";
import {
  createNotifyMagic,
  type NotifyPluginOptions,
  registerNotifyServiceWorker,
  resolveNotifyConfig,
} from "./controller.js";

export {
  closeNotification,
  createNotifyMagic,
  getNotifyPermission,
  isIosDevice,
  isNotifySupported,
  isStandaloneDisplayMode,
  type NotifyMagic,
  type NotifyPluginOptions,
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

function registerNotifyPlugin(Alpine: AlpineType.Alpine, options: NotifyPluginOptions): void {
  const config = resolveNotifyConfig(options);

  if (config.autoRegisterServiceWorker) {
    void registerNotifyServiceWorker(options);
  }

  Alpine.magic("notify", () => createNotifyMagic(options));
}

/** Alpine.js notify plugin. Registers magic `$notify`. */
export default function notifyPlugin(
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
