import { PlayerError } from "../error.js";
import type { VideoController as VideoControllerInterface } from "../types.js";
import { PlayerController } from "./create-player-controller.js";

const VIDEO_MEDIA_EVENTS = ["enterpictureinpicture", "leavepictureinpicture"] as const;

function isPictureInPictureSupported(element: HTMLVideoElement): element is HTMLVideoElement & {
  requestPictureInPicture: () => Promise<PictureInPictureWindow>;
} {
  return (
    typeof document !== "undefined" &&
    "pictureInPictureEnabled" in document &&
    document.pictureInPictureEnabled === true &&
    typeof element.requestPictureInPicture === "function"
  );
}

/**
 * Headless video controller with fullscreen and Picture-in-Picture support.
 */
export class VideoController
  extends PlayerController<HTMLVideoElement>
  implements VideoControllerInterface
{
  readonly #videoListeners = new Map<string, EventListener>();
  #fullscreenListener: (() => void) | null = null;
  #videoMounted = false;

  get fullscreen(): boolean {
    if (typeof document === "undefined") {
      return false;
    }
    return document.fullscreenElement === this.element;
  }

  get pictureInPicture(): boolean {
    if (typeof document === "undefined") {
      return false;
    }
    return document.pictureInPictureElement === this.element;
  }

  override mount(): void {
    if (this.#videoMounted) {
      return;
    }
    super.mount();
    this.#videoMounted = true;

    for (const eventName of VIDEO_MEDIA_EVENTS) {
      const handler = (): void => {
        this.notifySubscribers();
      };
      this.element.addEventListener(eventName, handler);
      this.#videoListeners.set(eventName, handler);
    }

    if (typeof document !== "undefined") {
      this.#fullscreenListener = (): void => {
        this.notifySubscribers();
      };
      document.addEventListener("fullscreenchange", this.#fullscreenListener);
    }
  }

  override destroy(): void {
    if (!this.#videoMounted) {
      super.destroy();
      return;
    }

    for (const [eventName, handler] of this.#videoListeners) {
      this.element.removeEventListener(eventName, handler);
    }
    this.#videoListeners.clear();

    if (this.#fullscreenListener && typeof document !== "undefined") {
      document.removeEventListener("fullscreenchange", this.#fullscreenListener);
      this.#fullscreenListener = null;
    }

    this.#videoMounted = false;
    super.destroy();
  }

  requestFullscreen(): Promise<void> {
    return this.element.requestFullscreen();
  }

  exitFullscreen(): Promise<void> {
    if (typeof document === "undefined") {
      return Promise.resolve();
    }
    if (document.fullscreenElement === null) {
      return Promise.resolve();
    }
    return document.exitFullscreen();
  }

  async toggleFullscreen(): Promise<void> {
    if (this.fullscreen) {
      await this.exitFullscreen();
      return;
    }
    await this.requestFullscreen();
  }

  requestPictureInPicture(): Promise<PictureInPictureWindow> {
    if (!isPictureInPictureSupported(this.element)) {
      return Promise.reject(
        new PlayerError(
          "Picture-in-Picture is not supported in this environment",
          "PLAYER_PICTURE_IN_PICTURE_UNSUPPORTED"
        )
      );
    }
    return this.element.requestPictureInPicture();
  }

  async exitPictureInPicture(): Promise<void> {
    if (typeof document === "undefined" || document.pictureInPictureElement === null) {
      return;
    }
    await document.exitPictureInPicture();
  }

  async togglePictureInPicture(): Promise<void> {
    if (this.pictureInPicture) {
      await this.exitPictureInPicture();
      return;
    }
    await this.requestPictureInPicture();
  }
}

/** Creates a video controller for a native `<video>` element. */
export function createVideoController(element: HTMLVideoElement): VideoController {
  return new VideoController(element);
}
