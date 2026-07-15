import type { Unsubscribe } from "@ailuracode/alpine-core";
import type { PlayerController } from "../controller/create-player-controller.js";
import type { VideoController } from "../controller/create-video-controller.js";
import type { PlayerAlpine } from "../types.js";

/** Mutable reactive mirror backing Alpine scope bindings. */
export interface ReactivePlayerSurface {
  element: HTMLMediaElement;
  paused: boolean;
  playing: boolean;
  muted: boolean;
  ended: boolean;
  loading: boolean;
  ready: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  volume: number;
  playbackRate: number;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  seek: (time: number) => void;
  seekBy: (seconds: number) => void;
  restart: () => void;
  setVolume: (volume: number) => void;
  volumeBy: (amount: number) => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
}

/** Video-specific reactive fields. */
export interface ReactiveVideoSurface extends ReactivePlayerSurface {
  fullscreen: boolean;
  pictureInPicture: boolean;
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  requestPictureInPicture: () => Promise<PictureInPictureWindow>;
  exitPictureInPicture: () => Promise<void>;
  togglePictureInPicture: () => Promise<void>;
}

export interface ReactiveBinding<TSurface> {
  readonly surface: TSurface;
  readonly unsubscribe: Unsubscribe;
}

function syncPlayerSurface(surface: ReactivePlayerSurface, controller: PlayerController): void {
  surface.element = controller.element;
  surface.paused = controller.paused;
  surface.playing = controller.playing;
  surface.muted = controller.muted;
  surface.ended = controller.ended;
  surface.loading = controller.loading;
  surface.ready = controller.ready;
  surface.currentTime = controller.currentTime;
  surface.duration = controller.duration;
  surface.progress = controller.progress;
  surface.volume = controller.volume;
  surface.playbackRate = controller.playbackRate;
}

function createBaseSurface(controller: PlayerController): ReactivePlayerSurface {
  return {
    element: controller.element,
    paused: controller.paused,
    playing: controller.playing,
    muted: controller.muted,
    ended: controller.ended,
    loading: controller.loading,
    ready: controller.ready,
    currentTime: controller.currentTime,
    duration: controller.duration,
    progress: controller.progress,
    volume: controller.volume,
    playbackRate: controller.playbackRate,
    play: () => controller.play(),
    pause: () => controller.pause(),
    toggle: () => controller.toggle(),
    seek: (time) => controller.seek(time),
    seekBy: (seconds) => controller.seekBy(seconds),
    restart: () => controller.restart(),
    setVolume: (volume) => controller.setVolume(volume),
    volumeBy: (amount) => controller.volumeBy(amount),
    mute: () => controller.mute(),
    unmute: () => controller.unmute(),
    toggleMute: () => controller.toggleMute(),
    setPlaybackRate: (rate) => controller.setPlaybackRate(rate),
  };
}

/** Creates an Alpine-reactive player surface for scope binding. */
export function createReactivePlayerSurface(
  Alpine: PlayerAlpine,
  controller: PlayerController
): ReactiveBinding<ReactivePlayerSurface> {
  const surface = Alpine.reactive(createBaseSurface(controller));
  const unsubscribe = controller.subscribe(() => {
    syncPlayerSurface(surface, controller);
  });
  return { surface, unsubscribe };
}

function syncVideoSurface(surface: ReactiveVideoSurface, controller: VideoController): void {
  syncPlayerSurface(surface, controller);
  surface.fullscreen = controller.fullscreen;
  surface.pictureInPicture = controller.pictureInPicture;
}

/** Creates an Alpine-reactive video surface for scope binding. */
export function createReactiveVideoSurface(
  Alpine: PlayerAlpine,
  controller: VideoController
): ReactiveBinding<ReactiveVideoSurface> {
  const base = createBaseSurface(controller);
  const surface = Alpine.reactive({
    ...base,
    fullscreen: controller.fullscreen,
    pictureInPicture: controller.pictureInPicture,
    requestFullscreen: () => controller.requestFullscreen(),
    exitFullscreen: () => controller.exitFullscreen(),
    toggleFullscreen: () => controller.toggleFullscreen(),
    requestPictureInPicture: () => controller.requestPictureInPicture(),
    exitPictureInPicture: () => controller.exitPictureInPicture(),
    togglePictureInPicture: () => controller.togglePictureInPicture(),
  }) as ReactiveVideoSurface;

  const unsubscribe = controller.subscribe(() => {
    syncVideoSurface(surface, controller);
  });

  return { surface, unsubscribe };
}
