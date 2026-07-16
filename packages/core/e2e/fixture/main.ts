import themePlugin from "@ailuracode/alpine-theme";
import Alpine from "alpinejs";

Alpine.plugin(
  themePlugin({
    defaultTheme: "light",
    strategy: "class",
    darkClass: "theme-dark",
    lightClass: "theme-light",
  })
);

Alpine.data("pluginEventDemo", () => ({
  toggleDetail: null as { current: boolean } | null,
  themeDetail: null as { current: string } | null,
  dispatchToggle(target: HTMLElement): void {
    target.dispatchEvent(
      new CustomEvent("toggle:change", {
        detail: { previous: false, current: true, source: "toggle" },
        bubbles: true,
        composed: true,
      })
    );
  },
  dispatchTheme(): void {
    window.dispatchEvent(
      new CustomEvent("theme:change", {
        detail: { previous: "light", current: "dark", source: "api" },
        bubbles: true,
        composed: true,
      })
    );
  },
  dispatchToggleNoBubble(target: HTMLElement): void {
    target.dispatchEvent(
      new CustomEvent("toggle:change", {
        detail: { previous: false, current: true, source: "toggle" },
        bubbles: false,
        composed: true,
      })
    );
  },
}));

Alpine.data("cancelableDemo", () => ({
  closeResult: "",
  handleBeforeClose(event: Event): void {
    event.preventDefault();
  },
  tryClose(root: HTMLElement): void {
    const event = new CustomEvent("dialog:before-close", {
      detail: { reason: "escape" },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    root.dispatchEvent(event);
    this.closeResult = event.defaultPrevented ? "blocked" : "allowed";
  },
}));

Alpine.start();
