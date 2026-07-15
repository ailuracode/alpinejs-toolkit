/**
 * Alpine.js integration for `@ailuracode/alpine-player`.
 *
 * Registers `x-audio` and `x-video` directives that expose reactive
 * playback controllers in the current Alpine scope.
 */

import type { Alpine } from "alpinejs";
import { registerAudioDirective } from "./directives/audio.js";
import { registerVideoDirective } from "./directives/video.js";
import type { PlayerAlpine, PlayerPluginCallback, PlayerPluginOptions } from "./types.js";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback that registers
 * `x-audio` and `x-video`.
 */
export function playerPlugin(options: PlayerPluginOptions = {}): PlayerPluginCallback {
  return function registerPlayer(alpine: Alpine): void {
    const Alpine = alpine as unknown as PlayerAlpine;
    registerAudioDirective(Alpine);
    registerVideoDirective(Alpine);
    void options;
  };
}

export default playerPlugin;
