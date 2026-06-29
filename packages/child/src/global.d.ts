/// <reference types="@types/alpinejs" />

export type ChildMergeMode = "default" | "merge" | "replace";

declare global {
  namespace Alpine {
    // Directive-only plugin — no magics or stores.
  }
}
