/**
 * Public entrypoint for `@ailuracode/alpine-notify`.
 *
 * Re-exports only. The controller lives in `./controller.ts`,
 * the Alpine integration in `./plugin.ts`, and the supporting
 * types in `./types.ts` and `./events.ts`.
 */

// --- Controller helpers ---------------------------------------------------
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
// --- Public types ---------------------------------------------------------
export type { NotifyEvents } from "./events.js";
export {
  createNotificationPermissionAdapter,
  NOTIFICATION_PERMISSION_NAME,
} from "./permission-adapter.js";
// --- Alpine integration ---------------------------------------------------
export { notifyPlugin, notifyPlugin as default } from "./plugin.js";
export type { NotifyMagic, NotifyPluginOptions } from "./types.js";
