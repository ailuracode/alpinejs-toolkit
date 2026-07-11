import type { QueryStore } from "@ailuracode/alpine-query";

declare global {
  namespace Alpine {
    interface Stores {
      query: QueryStore;
    }
  }
}
