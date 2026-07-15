import type { Unsubscribe } from "@ailuracode/alpine-core";
import type { PlayerController as PlayerControllerInterface } from "../types.js";
import { clampSeek, clampVolume, sanitizeDuration, sanitizeTime } from "./utils.js";

const SHARED_MEDIA_EVENTS = [
  "play",
  "playing",
  "pause",
  "ended",
  "waiting",
  "canplay",
  "loadedmetadata",
  "durationchange",
  "timeupdate",
  "volumechange",
  "ratechange",
  "emptied",
] as const;

/**
 * Headless playback controller for native `HTMLMediaElement` instances.
 *
 * Synchronizes state from native media events and exposes semantic
 * playback commands. Does not register listeners until `mount()`.
 */
export class PlayerController<TElement extends HTMLMediaElement = HTMLMediaElement>
  implements PlayerControllerInterface<TElement>
{
  readonly #element: TElement;
  readonly #listeners = new Map<string, EventListener>();
  readonly #subscribers = new Set<() => void>();
  #mounted = false;
  #destroyed = false;

  constructor(element: TElement) {
    this.#element = element;
  }

  get element(): TElement {
    return this.#element;
  }

  get paused(): boolean {
    return this.#element.paused;
  }

  get playing(): boolean {
    return !(this.#element.paused || this.#element.ended);
  }

  get muted(): boolean {
    return this.#element.muted;
  }

  get ended(): boolean {
    return this.#element.ended;
  }

  get loading(): boolean {
    return this.#element.readyState < HTMLMediaElement.HAVE_FUTURE_DATA;
  }

  get ready(): boolean {
    return this.#element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
  }

  get currentTime(): number {
    return sanitizeTime(this.#element.currentTime);
  }

  get duration(): number {
    return sanitizeDuration(this.#element.duration);
  }

  get progress(): number {
    const duration = this.duration;
    return duration > 0 ? this.currentTime / duration : 0;
  }

  get volume(): number {
    return this.#element.volume;
  }

  get playbackRate(): number {
    return this.#element.playbackRate;
  }

  play(): Promise<void> {
    return this.#element.play();
  }

  pause(): void {
    this.#element.pause();
  }

  async toggle(): Promise<void> {
    if (this.paused) {
      await this.play();
      return;
    }
    this.pause();
  }

  seek(time: number): void {
    this.#element.currentTime = clampSeek(time, this.duration);
  }

  seekBy(seconds: number): void {
    this.seek(this.currentTime + seconds);
  }

  restart(): void {
    this.seek(0);
    void this.play();
  }

  setVolume(volume: number): void {
    this.#element.volume = clampVolume(volume);
  }

  volumeBy(amount: number): void {
    this.setVolume(this.volume + amount);
  }

  mute(): void {
    this.#element.muted = true;
  }

  unmute(): void {
    this.#element.muted = false;
  }

  toggleMute(): void {
    this.#element.muted = !this.#element.muted;
  }

  setPlaybackRate(rate: number): void {
    this.#element.playbackRate = rate;
  }

  /** Registers native media listeners. Idempotent. */
  mount(): void {
    if (this.#mounted || this.#destroyed) {
      return;
    }
    this.#mounted = true;

    for (const eventName of SHARED_MEDIA_EVENTS) {
      const handler = (): void => {
        this.#notify();
      };
      this.#element.addEventListener(eventName, handler);
      this.#listeners.set(eventName, handler);
    }
  }

  /** Removes listeners. Idempotent. */
  destroy(): void {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    this.#mounted = false;

    for (const [eventName, handler] of this.#listeners) {
      this.#element.removeEventListener(eventName, handler);
    }
    this.#listeners.clear();
    this.#subscribers.clear();
  }

  /** Subscribes to state changes driven by native media events. */
  subscribe(listener: () => void): Unsubscribe {
    this.#subscribers.add(listener);
    return () => {
      this.#subscribers.delete(listener);
    };
  }

  /** Notifies subscribers — available to specialized controllers. */
  protected notifySubscribers(): void {
    for (const listener of this.#subscribers) {
      listener();
    }
  }

  #notify(): void {
    this.notifySubscribers();
  }
}

/** Creates a shared playback controller for a native media element. */
export function createPlayerController<TElement extends HTMLMediaElement>(
  element: TElement
): PlayerController<TElement> {
  return new PlayerController(element);
}
