import type AlpineType from "alpinejs";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface DeviceBreakpoints {
  mobileMax?: number;
  tabletMax?: number;
}

export interface DeviceStore {
  mobileMax: number;
  tabletMax: number;
  width: number;
  type: DeviceType;
  is(name: DeviceType): boolean;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  refreshType(): void;
  refreshWidth(): void;
  refresh(): void;
  setBreakpoints(breakpoints?: DeviceBreakpoints): void;
}

const DEFAULT_MOBILE_MAX = 767;
const DEFAULT_TABLET_MAX = 1023;
const WIDTH_DEBOUNCE_MS = 100;

function createQueries(mobileMax: number, tabletMax: number) {
  return {
    mobile: window.matchMedia(`(max-width: ${mobileMax}px)`),
    tablet: window.matchMedia(`(min-width: ${mobileMax + 1}px) and (max-width: ${tabletMax}px)`),
  };
}

type DeviceQueries = ReturnType<typeof createQueries>;

function resolveType(queries: DeviceQueries): DeviceType {
  if (queries.mobile.matches) {
    return "mobile";
  }
  if (queries.tablet.matches) {
    return "tablet";
  }
  return "desktop";
}

function applyType(target: Pick<DeviceStore, "type">, queries: DeviceQueries): boolean {
  const type = resolveType(queries);
  if (target.type === type) {
    return false;
  }

  target.type = type;
  return true;
}

function applyWidth(target: Pick<DeviceStore, "width">): boolean {
  const width = window.innerWidth;
  if (target.width === width) {
    return false;
  }

  target.width = width;
  return true;
}

/** Alpine.js screen plugin. Registers `$store.device`. */
export default function screenPlugin(Alpine: AlpineType.Alpine): void {
  let queries = createQueries(DEFAULT_MOBILE_MAX, DEFAULT_TABLET_MAX);
  let typeHandler: (() => void) | null = null;
  let widthTimer: ReturnType<typeof setTimeout> | null = null;

  const deviceStore: DeviceStore = {
    mobileMax: DEFAULT_MOBILE_MAX,
    tabletMax: DEFAULT_TABLET_MAX,
    width: window.innerWidth,
    type: "desktop",

    is(name: DeviceType) {
      return this.type === name;
    },

    get isMobile() {
      return this.type === "mobile";
    },

    get isTablet() {
      return this.type === "tablet";
    },

    get isDesktop() {
      return this.type === "desktop";
    },

    refreshType() {
      applyType(this, queries);
      applyWidth(this);
    },

    refreshWidth() {
      applyWidth(this);
    },

    refresh() {
      applyType(this, queries);
      applyWidth(this);
    },

    setBreakpoints({ mobileMax, tabletMax }: DeviceBreakpoints = {}) {
      unbindListeners();
      if (mobileMax != null) {
        this.mobileMax = mobileMax;
      }
      if (tabletMax != null) {
        this.tabletMax = tabletMax;
      }
      queries = createQueries(this.mobileMax, this.tabletMax);
      bindListeners();
      this.refresh();
    },
  };

  Alpine.store("device", deviceStore);

  function scheduleWidthUpdate() {
    clearTimeout(widthTimer ?? undefined);
    widthTimer = setTimeout(() => {
      widthTimer = null;
      deviceStore.refreshWidth();
    }, WIDTH_DEBOUNCE_MS);
  }

  function bindListeners() {
    unbindListeners();
    typeHandler = () => deviceStore.refreshType();
    for (const media of Object.values(queries)) {
      media.addEventListener("change", typeHandler);
    }
    window.addEventListener("resize", scheduleWidthUpdate, { passive: true });
  }

  function unbindListeners() {
    clearTimeout(widthTimer ?? undefined);
    widthTimer = null;

    if (!typeHandler) {
      return;
    }

    for (const media of Object.values(queries)) {
      media.removeEventListener("change", typeHandler);
    }
    window.removeEventListener("resize", scheduleWidthUpdate);
    typeHandler = null;
  }

  bindListeners();
  deviceStore.refresh();
}

declare global {
  namespace Alpine {
    interface Stores {
      device: DeviceStore;
    }
  }
}
