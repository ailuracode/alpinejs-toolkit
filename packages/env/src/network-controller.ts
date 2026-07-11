import { BaseController, clearSingleton, createSingleton } from "@ailuracode/alpine-core";
import type { NetworkChange, NetworkEvents } from "./events.js";
import { readNetworkState } from "./internal/network.js";

export interface NetworkMagic extends NetworkChange {}

export const NETWORK_SINGLETON_KEY = "@ailuracode/alpine-env/network";

export class NetworkController extends BaseController<NetworkEvents> {
  #state: NetworkChange = {
    isOnline: true,
    isOffline: false,
  };

  get isOnline(): boolean {
    return this.#state.isOnline;
  }

  get isOffline(): boolean {
    return this.#state.isOffline;
  }

  override mount(): void {
    super.mount();

    if (typeof window === "undefined") {
      return;
    }

    this.#update();

    const update = () => {
      this.#update();
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    this.registerCleanup(() => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    });
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    super.destroy();
    clearSingleton(NETWORK_SINGLETON_KEY);
  }

  #update(): void {
    this.#state = readNetworkState();
    this.emit("change", this.#state);
  }
}

export function createNetwork(): NetworkController {
  return createSingleton(NETWORK_SINGLETON_KEY, () => {
    const controller = new NetworkController();
    controller.mount();
    return controller;
  });
}
