/// <reference types="@types/alpinejs" />

export interface NetworkMagic {
  isOnline: boolean;
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $network: NetworkMagic;
    }
  }
}
