import type AlpineType from "alpinejs";

export interface NetworkMagic {
  isOnline: boolean;
}

/** Alpine.js network plugin. Registers reactive magic `$network`. */
export default function networkPlugin(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive<NetworkMagic>({ isOnline: navigator.onLine });

  Alpine.magic("network", () => state);

  const update = () => {
    state.isOnline = navigator.onLine;
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $network: NetworkMagic;
    }
  }
}
