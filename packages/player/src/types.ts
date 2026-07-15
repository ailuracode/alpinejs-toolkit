import type { Alpine } from "alpinejs";

/** Shared playback controller surface for native media elements. */
export interface PlayerController<TElement extends HTMLMediaElement = HTMLMediaElement> {
  readonly element: TElement;

  readonly paused: boolean;
  readonly playing: boolean;
  readonly muted: boolean;
  readonly ended: boolean;
  readonly loading: boolean;
  readonly ready: boolean;

  readonly currentTime: number;
  readonly duration: number;
  readonly progress: number;
  readonly volume: number;
  readonly playbackRate: number;

  play(): Promise<void>;
  pause(): void;
  toggle(): Promise<void>;

  seek(time: number): void;
  seekBy(seconds: number): void;
  restart(): void;

  setVolume(volume: number): void;
  volumeBy(amount: number): void;

  mute(): void;
  unmute(): void;
  toggleMute(): void;

  setPlaybackRate(rate: number): void;

  mount(): void;
  destroy(): void;
}

/** Audio playback controller bound to `HTMLAudioElement`. */
export type AudioController = PlayerController<HTMLAudioElement>;

/** Video playback controller with fullscreen and Picture-in-Picture. */
export interface VideoController extends PlayerController<HTMLVideoElement> {
  readonly fullscreen: boolean;
  readonly pictureInPicture: boolean;

  requestFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  toggleFullscreen(): Promise<void>;

  requestPictureInPicture(): Promise<PictureInPictureWindow>;
  exitPictureInPicture(): Promise<void>;
  togglePictureInPicture(): Promise<void>;
}

/** Options for {@link playerPlugin}. */
export interface PlayerPluginOptions {
  /** Reserved for future cross-cutting configuration. */
  readonly id?: string;
}

/** Alpine plugin callback returned by {@link playerPlugin}. */
export type PlayerPluginCallback = (Alpine: Alpine) => void;

/** Typed Alpine runtime used by the player plugin. */
export type PlayerAlpine = Alpine;
