import { BaseController, clearSingleton, createSingleton } from "@ailuracode/alpine-core";
import type { VisibilityChange, VisibilityEvents } from "./events.js";
import {
  readVisibilityState,
  type VisibilitySnapshot,
  type VisibilityState,
} from "./internal/visibility.js";

export interface VisibilityMagic extends VisibilitySnapshot {
  is(state: VisibilityState): boolean;
}

export const VISIBILITY_SINGLETON_KEY = "@ailuracode/alpine-env/visibility";

export class VisibilityController extends BaseController<VisibilityEvents> {
  #state: VisibilityChange = {
    isVisible: true,
    isHidden: false,
    state: "visible",
  };

  get isVisible(): boolean {
    return this.#state.isVisible;
  }

  get isHidden(): boolean {
    return this.#state.isHidden;
  }

  get state(): VisibilityState {
    return this.#state.state;
  }

  is(state: VisibilityState): boolean {
    return this.#state.state === state;
  }

  override mount(): void {
    super.mount();

    if (typeof document === "undefined") {
      return;
    }

    this.#update();

    const update = () => {
      this.#update();
    };

    document.addEventListener("visibilitychange", update);

    this.registerCleanup(() => {
      document.removeEventListener("visibilitychange", update);
    });
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    super.destroy();
    clearSingleton(VISIBILITY_SINGLETON_KEY);
  }

  #update(): void {
    this.#state = readVisibilityState();
    this.emit("change", this.#state);
  }
}

export function createVisibility(): VisibilityController {
  return createSingleton(VISIBILITY_SINGLETON_KEY, () => {
    const controller = new VisibilityController();
    controller.mount();
    return controller;
  });
}
