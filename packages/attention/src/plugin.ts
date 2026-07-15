/**
 * Alpine.js integration for `@ailuracode/alpine-attention`.
 *
 * Thin adapter that wires {@link WakeLockController} and
 * {@link IdleController} into `$wakelock` and `$idle` magics.
 * No domain logic lives here — all browser interaction is owned
 * by the headless controllers.
 *
 * @module
 */

import { guardMagic } from "@ailuracode/alpine-core";
import type AlpineType from "alpinejs";
import { IdleController } from "./idle-controller.js";
import type { CreateAttentionPluginOptions } from "./types.js";
import { DEFAULT_ATTENTION_IDLE_KEY, DEFAULT_ATTENTION_WAKELOCK_KEY } from "./types.js";
import { WakeLockController } from "./wakelock-controller.js";

interface AttentionAlpine extends AlpineType.Alpine {
  cleanup?(callback: () => void): void;
}

/** Alpine.js attention plugin. Registers `$wakelock` and `$idle` magics. */
export function attentionPlugin(
  options: CreateAttentionPluginOptions
): (alpine: AlpineType.Alpine) => void;
export function attentionPlugin(alpine: AlpineType.Alpine): void;
export function attentionPlugin(
  optionsOrAlpine?: CreateAttentionPluginOptions | AlpineType.Alpine
): ((alpine: AlpineType.Alpine) => void) | undefined {
  if (optionsOrAlpine && typeof (optionsOrAlpine as AlpineType.Alpine).magic === "function") {
    registerAttention(optionsOrAlpine as AlpineType.Alpine, {});
    return;
  }

  const options = (optionsOrAlpine as CreateAttentionPluginOptions | undefined) ?? {};
  return (alpine: AlpineType.Alpine) => {
    registerAttention(alpine, options);
  };
}

function registerAttention(alpine: AlpineType.Alpine, options: CreateAttentionPluginOptions): void {
  const Alpine = alpine as AttentionAlpine;
  const wakelockKey = options.wakelockKey ?? DEFAULT_ATTENTION_WAKELOCK_KEY;
  const idleKey = options.idleKey ?? DEFAULT_ATTENTION_IDLE_KEY;

  const wakeLock = new WakeLockController();
  const idle = new IdleController();

  wakeLock.mount();
  idle.mount();

  // ── $wakelock ────────────────────────────────────────────────

  const wlState = Alpine.reactive({
    error: wakeLock.error,
    isRequesting: wakeLock.isRequesting,
    isActive: wakeLock.isActive,
    isSupported: wakeLock.isSupported,

    request() {
      return wakeLock.request();
    },

    release() {
      return wakeLock.release();
    },
  });

  wakeLock.on("wakelock:change", (detail) => {
    wlState.error = detail.error;
    wlState.isRequesting = detail.isRequesting;
    wlState.isActive = detail.isActive;
  });

  guardMagic(Alpine, wakelockKey, () => wlState, "attention");

  // ── $idle ────────────────────────────────────────────────────

  const idleState = Alpine.reactive({
    userState: idle.userState,
    screenState: idle.screenState,
    permission: idle.permission,
    error: idle.error,
    threshold: idle.threshold,
    isLoading: idle.isLoading,
    isWatching: idle.isWatching,
    isSupported: idle.isSupported,

    get isActive() {
      return idle.isActive;
    },

    get isIdle() {
      return idle.isIdle;
    },

    requestPermission() {
      return idle.requestPermission();
    },

    start(options?: { threshold?: number }) {
      return idle.start(options);
    },

    stop() {
      return idle.stop();
    },
  });

  idle.on("idle:change", (detail) => {
    idleState.userState = detail.userState;
    idleState.screenState = detail.screenState;
    idleState.permission = detail.permission;
    idleState.error = detail.error;
    idleState.threshold = detail.threshold;
    idleState.isWatching = detail.isWatching;
  });

  guardMagic(Alpine, idleKey, () => idleState, "attention");

  // ── Cleanup ──────────────────────────────────────────────────

  if (typeof Alpine.cleanup === "function") {
    Alpine.cleanup(() => {
      wakeLock.destroy();
      idle.destroy();
    });
  }
}

export default attentionPlugin;
