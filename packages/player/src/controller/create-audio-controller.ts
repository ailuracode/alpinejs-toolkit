import type { AudioController as AudioControllerInterface } from "../types.js";
import { PlayerController } from "./create-player-controller.js";

/** Headless audio controller bound to `HTMLAudioElement`. */
export class AudioController
  extends PlayerController<HTMLAudioElement>
  implements AudioControllerInterface {}

/** Creates an audio controller for a native `<audio>` element. */
export function createAudioController(element: HTMLAudioElement): AudioController {
  return new AudioController(element);
}
