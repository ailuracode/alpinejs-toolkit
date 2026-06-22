import type AlpineType from "alpinejs";

export interface OnlineMagic {
  isOnline: boolean;
}

/** Alpine.js online plugin. Registers reactive magic `$online`. */
export default function onlinePlugin(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive<OnlineMagic>({ isOnline: navigator.onLine });

  Alpine.magic("online", () => state);

  const update = () => {
    state.isOnline = navigator.onLine;
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $online: OnlineMagic;
    }
  }
}
