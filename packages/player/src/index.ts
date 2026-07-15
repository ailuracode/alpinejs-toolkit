/**
 * Public entrypoint for `@ailuracode/alpine-player`.
 *
 * Native `<audio>` and `<video>` playback controllers exposed through
 * `x-audio` and `x-video` directives. Distinct from
 * `@ailuracode/alpine-media`, which owns viewport and media-query state.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
export { AudioController, createAudioController } from "./controller/create-audio-controller.js";
export { createPlayerController, PlayerController } from "./controller/create-player-controller.js";
export { createVideoController, VideoController } from "./controller/create-video-controller.js";
export type { PlayerErrorCode } from "./error.js";
export { PlayerError } from "./error.js";
export { playerPlugin, playerPlugin as default } from "./plugin.js";
export type {
  PlayerAlpine,
  PlayerPluginCallback,
  PlayerPluginOptions,
} from "./types.js";
