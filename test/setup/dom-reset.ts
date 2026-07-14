import { beforeEach } from "vitest";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();

  document.body.replaceChildren();
  document.body.removeAttribute("style");
  document.body.className = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";

  // The `media` package tests poke at `window.ontouchstart` to verify the
  // touch heuristic. Other tests must not leak that property into them.
  Object.defineProperty(window, "ontouchstart", { configurable: true, value: undefined });
  Reflect.deleteProperty(window, "ontouchstart");
});
