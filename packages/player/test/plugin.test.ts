import { beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { playerPlugin } from "../src/plugin.js";

describe("@ailuracode/alpine-player playerPlugin", () => {
  let alpine: ReturnType<typeof startAlpine>;

  beforeEach(() => {
    alpine = startAlpine(playerPlugin());
  });

  it("exposes an audio controller in scope", async () => {
    document.body.innerHTML = `
      <div x-data>
        <audio x-audio="player" id="audio-el"></audio>
        <button id="capture" type="button" @click="window.__player = player">Capture</button>
        <button id="toggle" type="button" @click="player.toggle()">Toggle</button>
      </div>
    `;

    alpine.initTree(document.body);
    (document.getElementById("capture") as HTMLButtonElement).click();

    const audio = document.getElementById("audio-el") as HTMLAudioElement;
    audio.play = async () => undefined;

    const surface = (window as Window & { __player?: { playing: boolean; paused: boolean } })
      .__player;
    expect(surface).toBeDefined();
    expect(surface?.paused).toBe(true);

    (document.getElementById("toggle") as HTMLButtonElement).click();
    Object.defineProperty(audio, "paused", { configurable: true, writable: true, value: false });
    audio.dispatchEvent(new Event("play"));

    await vi.waitFor(() => {
      expect(surface?.playing).toBe(true);
    });
  });

  it("throws when x-audio is used on a non-audio element", () => {
    document.body.innerHTML = `<div x-data><video x-audio="player"></video></div>`;
    expect(() => alpine.initTree(document.body)).toThrow(/HTMLAudioElement/);
  });

  it("throws when x-video is used on a non-video element", () => {
    document.body.innerHTML = `<div x-data><audio x-video="player"></audio></div>`;
    expect(() => alpine.initTree(document.body)).toThrow(/HTMLVideoElement/);
  });
});
