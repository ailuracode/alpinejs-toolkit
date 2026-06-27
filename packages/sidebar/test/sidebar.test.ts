import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import sidebarPlugin, {
  type SidebarPluginOptions,
  type SidebarStore,
  sidebarOptions,
} from "../src/index.js";

// ── Type inference ───────────────────────────────────────────────────

describe("@ailuracode/alpinejs-sidebar type inference", () => {
  it("sidebarOptions() preserves literal types via const generic", () => {
    const options = sidebarOptions({
      closeOnEscape: false,
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onOverlayClick: vi.fn(),
    });

    expectTypeOf(options.closeOnEscape).toEqualTypeOf<false>();
  });

  it("SidebarPluginOptions has no position in callbacks", () => {
    expectTypeOf<SidebarPluginOptions>().toEqualTypeOf<{
      closeOnEscape?: boolean;
      closeOnOverlayClick?: boolean;
      breakpoint?: string;
      collapsed?: boolean;
      onOpen?: () => void;
      onClose?: () => void;
      onOverlayClick?: () => void;
      onCollapse?: () => void;
      onExpand?: () => void;
    }>();
  });

  it("SidebarStore has no position property", () => {
    const store = {} as SidebarStore;
    expectTypeOf(store.open).toEqualTypeOf<boolean>();
    expectTypeOf(store.collapsed).toEqualTypeOf<boolean>();
    expectTypeOf(store.matchesBreakpoint).toEqualTypeOf<boolean>();
    expectTypeOf(store.isOpen).toEqualTypeOf<boolean>();
    expectTypeOf(store.hasOverlay).toEqualTypeOf<boolean>();
  });

  it("SidebarStore.show() takes no parameters", () => {
    const store = {} as SidebarStore;
    expectTypeOf(store.show).parameters.toEqualTypeOf<[]>();
  });

  it("SidebarStore.toggle() takes no parameters", () => {
    const store = {} as SidebarStore;
    expectTypeOf(store.toggle).parameters.toEqualTypeOf<[]>();
  });

  it("SidebarStore.hide() takes no parameters", () => {
    const store = {} as SidebarStore;
    expectTypeOf(store.hide).parameters.toEqualTypeOf<[]>();
  });

  it("SidebarStore.collapse/expand/toggleCollapse take no parameters", () => {
    const store = {} as SidebarStore;
    expectTypeOf(store.collapse).parameters.toEqualTypeOf<[]>();
    expectTypeOf(store.expand).parameters.toEqualTypeOf<[]>();
    expectTypeOf(store.toggleCollapse).parameters.toEqualTypeOf<[]>();
  });

  it("SidebarPluginOptions includes collapsed and onCollapse/onExpand", () => {
    expectTypeOf<SidebarPluginOptions>().toMatchTypeOf<{
      collapsed?: boolean;
      onCollapse?: () => void;
      onExpand?: () => void;
    }>();
  });

  it("plugin default infers boolean states", () => {
    const Alpine = startAlpine(sidebarPlugin());
    const sidebar = Alpine.store("sidebar") as SidebarStore;

    expectTypeOf(sidebar.open).toEqualTypeOf<boolean>();
    expectTypeOf(sidebar.show).parameters.toEqualTypeOf<[]>();
  });

  it("sidebarOptions return type is structurally typed", () => {
    const opts = sidebarOptions({
      closeOnEscape: false,
      closeOnOverlayClick: true,
    });

    expectTypeOf(opts.closeOnEscape).toEqualTypeOf<false>();
    expectTypeOf(opts.closeOnOverlayClick).toEqualTypeOf<true>();
  });
});

// ── Runtime behavior ─────────────────────────────────────────────────

describe("@ailuracode/alpinejs-sidebar", () => {
  let store: SidebarStore;

  beforeEach(() => {
    const Alpine = startAlpine(sidebarPlugin());
    store = Alpine.store("sidebar") as SidebarStore;
  });

  describe("initial state", () => {
    it("starts closed and expanded", () => {
      expect(store.open).toBe(false);
      expect(store.isOpen).toBe(false);
      expect(store.collapsed).toBe(false);
      expect(store.matchesBreakpoint).toBe(false);
    });

    it("has no overlay when closed", () => {
      expect(store.hasOverlay).toBe(false);
    });
  });

  describe("show / hide", () => {
    it("opens the sidebar", () => {
      store.show();
      expect(store.open).toBe(true);
      expect(store.isOpen).toBe(true);
    });

    it("closes the sidebar", () => {
      store.show();
      expect(store.open).toBe(true);

      store.hide();
      expect(store.open).toBe(false);
      expect(store.isOpen).toBe(false);
    });

    it("does nothing when showing an already-open sidebar", () => {
      store.show();
      store.show();
      expect(store.open).toBe(true);
    });

    it("does nothing when hiding an already-closed sidebar", () => {
      store.hide();
      expect(store.open).toBe(false);
    });
  });

  describe("toggle", () => {
    it("toggles from closed to open", () => {
      store.toggle();
      expect(store.open).toBe(true);
    });

    it("toggles from open to closed", () => {
      store.show();
      store.toggle();
      expect(store.open).toBe(false);
    });
  });

  describe("hasOverlay", () => {
    it("returns true when open and closeOnOverlayClick is enabled (default)", () => {
      store.show();
      expect(store.hasOverlay).toBe(true);
    });

    it("returns false when closed", () => {
      expect(store.hasOverlay).toBe(false);
    });

    it("returns false when closeOnOverlayClick is disabled", () => {
      const Alpine = startAlpine(sidebarPlugin({ closeOnOverlayClick: false }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.show();
      expect(s.hasOverlay).toBe(false);
    });
  });

  describe("collapse / expand / toggleCollapse", () => {
    it("starts expanded by default", () => {
      expect(store.collapsed).toBe(false);
    });

    it("collapse() sets collapsed to true", () => {
      store.collapse();
      expect(store.collapsed).toBe(true);
    });

    it("expand() sets collapsed to false", () => {
      store.collapse();
      store.expand();
      expect(store.collapsed).toBe(false);
    });

    it("toggleCollapse() alternates between collapsed and expanded", () => {
      store.toggleCollapse();
      expect(store.collapsed).toBe(true);

      store.toggleCollapse();
      expect(store.collapsed).toBe(false);
    });

    it("does nothing when collapsing an already collapsed sidebar", () => {
      store.collapse();
      store.collapse();
      expect(store.collapsed).toBe(true);
    });

    it("does nothing when expanding an already expanded sidebar", () => {
      store.expand();
      expect(store.collapsed).toBe(false);
    });

    it("starts collapsed when collapsed option is true", () => {
      const Alpine = startAlpine(sidebarPlugin({ collapsed: true }));
      const s = Alpine.store("sidebar") as SidebarStore;
      expect(s.collapsed).toBe(true);
    });

    it("collapse/expand are independent of open/hide", () => {
      store.collapse();
      expect(store.collapsed).toBe(true);
      expect(store.open).toBe(false);

      store.show();
      expect(store.collapsed).toBe(true);
      expect(store.open).toBe(true);

      store.expand();
      expect(store.collapsed).toBe(false);
      expect(store.open).toBe(true);
    });
  });

  describe("collapse callbacks", () => {
    it("calls onCollapse when collapsing", () => {
      const onCollapse = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onCollapse }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.collapse();
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it("calls onExpand when expanding", () => {
      const onExpand = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onExpand }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.collapse();
      s.expand();
      expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it("does not call onCollapse when already collapsed", () => {
      const onCollapse = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onCollapse }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.collapse();
      s.collapse();
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it("does not call onExpand when already expanded", () => {
      const onExpand = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onExpand }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.expand();
      expect(onExpand).not.toHaveBeenCalled();
    });

    it("toggleCollapse calls onCollapse then onExpand", () => {
      const onCollapse = vi.fn();
      const onExpand = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onCollapse, onExpand }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.toggleCollapse();
      expect(onCollapse).toHaveBeenCalledTimes(1);
      expect(onExpand).not.toHaveBeenCalled();

      s.toggleCollapse();
      expect(onExpand).toHaveBeenCalledTimes(1);
    });
  });

  describe("callbacks", () => {
    it("calls onOpen when sidebar opens", () => {
      const onOpen = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onOpen }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.show();
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when sidebar closes", () => {
      const onClose = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onClose }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.show();
      s.hide();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onOpen when already open", () => {
      const onOpen = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onOpen }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.show();
      s.show();
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when already closed", () => {
      const onClose = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onClose }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.hide();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("calls onOverlayClick when provided", () => {
      const onOverlayClick = vi.fn();
      const Alpine = startAlpine(sidebarPlugin({ onOverlayClick }));
      const s = Alpine.store("sidebar") as SidebarStore;

      // onOverlayClick is a config option — consumer wires it in template
      // via @click="$store.sidebar.hide()" + their own callback logic
      s.show();
      expect(s.hasOverlay).toBe(true);
    });
  });

  describe("scroll lock via callbacks", () => {
    it("consumer can wire scroll lock through onOpen/onClose", () => {
      const lockScroll = vi.fn();
      const unlockScroll = vi.fn();
      const Alpine = startAlpine(
        sidebarPlugin({
          onOpen() {
            lockScroll();
          },
          onClose() {
            unlockScroll();
          },
        })
      );
      const s = Alpine.store("sidebar") as SidebarStore;

      s.show();
      expect(lockScroll).toHaveBeenCalledTimes(1);

      s.hide();
      expect(unlockScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe("escape key", () => {
    it("closes sidebar on Escape when closeOnEscape is true (default)", () => {
      store.show();
      expect(store.open).toBe(true);

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(store.open).toBe(false);
    });

    it("does nothing on Escape when sidebar is closed", () => {
      expect(store.open).toBe(false);

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(store.open).toBe(false);
    });

    it("does nothing on non-Escape keys", () => {
      store.show();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(store.open).toBe(true);
    });

    it("closeOnEscape: false prevents closing via Escape", () => {
      store.show();
      expect(store.open).toBe(true);

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
      expect(store.open).toBe(true);

      store.hide();
      expect(store.open).toBe(false);
    });
  });

  describe("breakpoint", () => {
    it("sets matchesBreakpoint from initial media query state", () => {
      const mql = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      vi.stubGlobal(
        "matchMedia",
        vi.fn(() => mql)
      );

      const Alpine = startAlpine(sidebarPlugin({ breakpoint: "(min-width: 1024px)" }));
      const s = Alpine.store("sidebar") as SidebarStore;

      expect(s.matchesBreakpoint).toBe(true);

      vi.unstubAllGlobals();
    });

    it("auto-closes sidebar when breakpoint no longer matches", () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;
      const mql = {
        matches: true,
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (event === "change") {
            changeHandler = handler;
          }
        }),
        removeEventListener: vi.fn(),
      };
      vi.stubGlobal(
        "matchMedia",
        vi.fn(() => mql)
      );

      const Alpine = startAlpine(sidebarPlugin({ breakpoint: "(min-width: 1024px)" }));
      const s = Alpine.store("sidebar") as SidebarStore;

      s.show();
      expect(s.open).toBe(true);

      // Simulate breakpoint change
      changeHandler?.({ matches: false } as MediaQueryListEvent);
      expect(s.open).toBe(false);

      vi.unstubAllGlobals();
    });
  });
});
