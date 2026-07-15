/// <reference types="@types/alpinejs" />

import type { PlayerPluginCallback, PlayerPluginOptions } from "./types.js";

export type {
  AudioController,
  PlayerAlpine,
  PlayerController,
  PlayerPluginCallback,
  PlayerPluginOptions,
  VideoController,
} from "./types.js";

export default function playerPlugin(options?: PlayerPluginOptions): PlayerPluginCallback;

declare global {
  namespace Alpine {
    interface Directives {
      audio: string;
      video: string;
    }
  }
}
