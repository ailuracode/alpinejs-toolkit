import type AlpineType from "alpinejs";

export interface NetworkMagic {
  readonly isOnline: boolean;
  readonly isOffline: boolean;
}

type NetworkStateRecord = NetworkMagic & {
  _online: boolean;
};

/** Reads current connectivity from `navigator.onLine` (defaults to online when unavailable). */
export function readNetworkState(): NetworkMagic {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

/** Builds reactive network state with getter-based flags. */
export function createNetworkState(isOnline = readNetworkState().isOnline): NetworkStateRecord {
  return {
    _online: isOnline,
    get isOnline() {
      return this._online;
    },
    get isOffline() {
      return !this._online;
    },
  };
}

/** Registers reactive `$network` magic on Alpine. */
export function registerNetworkMagic(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive(createNetworkState());

  Alpine.magic("network", () => state as NetworkMagic);

  const update = () => {
    state._online = navigator.onLine;
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
}
