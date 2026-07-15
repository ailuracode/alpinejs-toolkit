import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioController } from "../src/controller/create-audio-controller.js";
import { createPlayerController } from "../src/controller/create-player-controller.js";
import { createVideoController } from "../src/controller/create-video-controller.js";
import { PlayerError } from "../src/error.js";

function defineWritable<T extends object, K extends keyof T>(target: T, key: K, value: T[K]): void {
  Object.defineProperty(target, key, {
    configurable: true,
    writable: true,
    value,
  });
}

function createMockMediaElement<T extends HTMLMediaElement>(tag: "audio" | "video"): T {
  const element = document.createElement(tag) as T;
  element.play = vi.fn(async () => undefined);
  element.pause = vi.fn();
  Object.defineProperty(element, "duration", {
    configurable: true,
    get: () => (element as HTMLMediaElement & { __duration?: number }).__duration ?? 100,
    set(value: number) {
      (element as HTMLMediaElement & { __duration?: number }).__duration = value;
    },
  });
  Object.defineProperty(element, "currentTime", {
    configurable: true,
    get: () => (element as HTMLMediaElement & { __time?: number }).__time ?? 0,
    set(value: number) {
      (element as HTMLMediaElement & { __time?: number }).__time = value;
    },
  });
  defineWritable(element, "readyState", HTMLMediaElement.HAVE_ENOUGH_DATA);
  defineWritable(element, "paused", true);
  defineWritable(element, "muted", false);
  defineWritable(element, "ended", false);
  defineWritable(element, "volume", 1);
  defineWritable(element, "playbackRate", 1);
  document.body.appendChild(element);
  return element;
}

describe("@ailuracode/alpine-player PlayerController", () => {
  let audio: HTMLAudioElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    audio = createMockMediaElement<HTMLAudioElement>("audio");
  });

  it("derives playing from paused and ended", () => {
    const player = createPlayerController(audio);
    player.mount();

    expect(player.playing).toBe(false);
    defineWritable(audio, "paused", false);
    audio.dispatchEvent(new Event("play"));
    expect(player.playing).toBe(true);

    defineWritable(audio, "ended", true);
    audio.dispatchEvent(new Event("ended"));
    expect(player.playing).toBe(false);
  });

  it("computes progress from currentTime and duration", () => {
    const player = createPlayerController(audio);
    player.mount();
    audio.currentTime = 25;
    audio.dispatchEvent(new Event("timeupdate"));
    expect(player.progress).toBe(0.25);
  });

  it("clamps seek and volume commands", () => {
    const player = createPlayerController(audio);
    player.mount();

    player.seek(500);
    expect(audio.currentTime).toBe(100);

    player.setVolume(2);
    expect(audio.volume).toBe(1);

    player.volumeBy(-0.5);
    expect(audio.volume).toBe(0.5);
  });

  it("toggle plays when paused and pauses when playing", async () => {
    const player = createPlayerController(audio);
    player.mount();

    await player.toggle();
    expect(audio.play).toHaveBeenCalled();

    defineWritable(audio, "paused", false);
    await player.toggle();
    expect(audio.pause).toHaveBeenCalled();
  });

  it("syncs when the element is changed externally", () => {
    const player = createPlayerController(audio);
    player.mount();

    defineWritable(audio, "muted", true);
    audio.dispatchEvent(new Event("volumechange"));
    expect(player.muted).toBe(true);

    defineWritable(audio, "playbackRate", 1.5);
    audio.dispatchEvent(new Event("ratechange"));
    expect(player.playbackRate).toBe(1.5);
  });

  it("cleans up listeners on destroy", () => {
    const player = createPlayerController(audio);
    const removeSpy = vi.spyOn(audio, "removeEventListener");
    player.mount();
    player.destroy();
    expect(removeSpy).toHaveBeenCalled();
    player.destroy();
    expect(removeSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it("preserves play() promise rejection", async () => {
    const player = createPlayerController(audio);
    const rejection = new Error("autoplay blocked");
    audio.play = vi.fn(() => Promise.reject(rejection));
    await expect(player.play()).rejects.toBe(rejection);
  });
});

describe("@ailuracode/alpine-player VideoController", () => {
  let video: HTMLVideoElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    video = createMockMediaElement<HTMLVideoElement>("video");
    video.requestFullscreen = vi.fn(async () => undefined);
    video.requestPictureInPicture = vi.fn(async () => ({}) as PictureInPictureWindow);
  });

  it("rejects Picture-in-Picture when unsupported", async () => {
    const controller = createVideoController(video);
    const original = document.pictureInPictureEnabled;
    Object.defineProperty(document, "pictureInPictureEnabled", {
      configurable: true,
      value: false,
    });

    await expect(controller.requestPictureInPicture()).rejects.toBeInstanceOf(PlayerError);

    Object.defineProperty(document, "pictureInPictureEnabled", {
      configurable: true,
      value: original,
    });
  });

  it("delegates fullscreen requests to the video element", async () => {
    const controller = createVideoController(video);
    await controller.requestFullscreen();
    expect(video.requestFullscreen).toHaveBeenCalled();
  });
});

describe("@ailuracode/alpine-player AudioController", () => {
  it("creates an audio-only controller", () => {
    const audio = createMockMediaElement<HTMLAudioElement>("audio");
    const controller = createAudioController(audio);
    expect(controller.element).toBe(audio);
  });
});
