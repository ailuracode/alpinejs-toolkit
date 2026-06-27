import type { ToastItem, ToastPosition, ToastStore } from "@ailuracode/alpinejs-toast";
import { isPersistentDuration } from "@ailuracode/alpinejs-toast";
import type { AlpineInstance } from "../types/alpine.js";
import type { ToastDemoContent, toastDemoPositions, toastDemoVariants } from "./plugin-registry.js";

type DemoVariants = typeof toastDemoVariants;
type DemoPositions = typeof toastDemoPositions;
type DemoToastItem = ToastItem<DemoVariants, DemoPositions, ToastDemoContent>;
type DemoToastStore = ToastStore<DemoVariants, DemoPositions, ToastDemoContent>;
type DemoToastPosition = ToastPosition<DemoPositions>;

/** Demo toast plugin variants — overrides the generic default on `Alpine.Stores.toast`. */
type DemoAlpineStores = Omit<Alpine.Stores, "toast"> & {
  toast: DemoToastStore;
};

type SwipeMeta = {
  out: boolean;
  direction: string | null;
};

export type ToastSonnerConfig = {
  richColors?: boolean;
};

type HeightEntry = {
  id: string;
  height: number;
  position: DemoToastPosition;
  stack: "timed" | "persistent";
};

type ToastSonnerData = {
  richColors: boolean;
  expanded: Record<string, boolean>;
  heights: Record<string, number>;
  heightsList: HeightEntry[];
  mounted: Record<string, boolean>;
  offsetBeforeRemove: Record<string, number>;
  swipeMeta: Record<string, SwipeMeta>;
  swipingId: string | null;
  pointerStart: { x: number; y: number } | null;
  swipeDirection: "x" | "y" | null;
  readonly store: DemoToastStore;
  readonly visibleToasts: number;
  init(): void;
  yPosition(position: DemoToastPosition): string;
  xPosition(position: DemoToastPosition): string;
  setExpanded(position: DemoToastPosition, value: boolean): void;
  isExpanded(position: DemoToastPosition): boolean;
  activePositions(): DemoToastPosition[];
  timedToastsAt(position: DemoToastPosition): DemoToastItem[];
  persistentToastsAt(position: DemoToastPosition): DemoToastItem[];
  hasTimedToasts(position: DemoToastPosition): boolean;
  hasPersistentToasts(position: DemoToastPosition): boolean;
  isPersistentToast(toast: DemoToastItem): boolean;
  toastStack(toast: DemoToastItem): "timed" | "persistent";
  swipeDirectionsFor(position: DemoToastPosition): string[];
  toastsAt(position: DemoToastPosition): DemoToastItem[];
  findToast(id: string): DemoToastItem | undefined;
  isToastRemoved(id: string): boolean;
  heightsAt(position: DemoToastPosition, stack?: "timed" | "persistent"): HeightEntry[];
  isFront(index: number | string): boolean;
  heightIndex(toast: DemoToastItem): number;
  setHeight(toast: DemoToastItem, height: number): void;
  removeHeight(id: string): void;
  pruneToastState(id: string): void;
  timedToasterStyle(position: DemoToastPosition): Record<string, string>;
  persistentToasterStyle(position: DemoToastPosition): Record<string, string>;
  toastOffset(toast: DemoToastItem): number;
  timedToastStyle(
    toast: DemoToastItem,
    index: number | string,
    position: DemoToastPosition
  ): Record<string, string>;
  persistentToastStyle(toast: DemoToastItem): Record<string, string>;
  measureToast(element: HTMLElement, toast: DemoToastItem): void;
  markMounted(id: string): void;
  isMounted(toast: DemoToastItem): boolean;
  initToast(
    element: HTMLElement,
    toast: DemoToastItem,
    index: number,
    position: DemoToastPosition
  ): void;
  toastType(toast: DemoToastItem): string;
  showIcon(toast: DemoToastItem): boolean;
  isVisible(position: DemoToastPosition, index: number | string): boolean;
  getSwipeOut(toast: ToastItem): boolean;
  getSwipeDirection(toast: DemoToastItem): string | null;
  dismiss(id: string, options?: { swipe?: boolean; swipeDirection?: string }): void;
  runAction(toast: DemoToastItem): void;
  showAction(toast: DemoToastItem): boolean;
  startSwipe(event: PointerEvent, toast: DemoToastItem): void;
  moveSwipe(event: PointerEvent, toast: DemoToastItem, position: DemoToastPosition): void;
  endSwipe(event: PointerEvent, toast: DemoToastItem, position: DemoToastPosition): void;
};

type ToastSonnerComponent = ToastSonnerData & {
  $store: DemoAlpineStores;
  $watch<T>(getter: string | (() => T), callback: (value: T) => void): void;
};

function toastStoreFromAlpine($store: DemoAlpineStores): DemoToastStore {
  return $store.toast;
}

function swipeDeltaWithResistance(
  delta: number,
  allowedPositive: boolean,
  allowedNegative: boolean
): number {
  if ((delta > 0 && allowedPositive) || (delta < 0 && allowedNegative)) {
    return delta;
  }

  return delta * (1 / (1 + Math.abs(delta) / 20));
}

function resolvePrimarySwipeAxis(xDelta: number, yDelta: number): "x" | "y" {
  return Math.abs(xDelta) > Math.abs(yDelta) ? "x" : "y";
}

function computeMoveSwipeOffsets(
  swipeDirection: "x" | "y",
  xDelta: number,
  yDelta: number,
  allowed: string[]
): { swipeX: number; swipeY: number } {
  if (swipeDirection === "x") {
    return {
      swipeX: swipeDeltaWithResistance(xDelta, allowed.includes("right"), allowed.includes("left")),
      swipeY: 0,
    };
  }

  return {
    swipeX: 0,
    swipeY: swipeDeltaWithResistance(yDelta, allowed.includes("bottom"), allowed.includes("top")),
  };
}

function resolveSwipeDismissDirection(
  swipeDirection: "x" | "y" | null,
  xDelta: number,
  yDelta: number,
  threshold: number,
  allowed: string[]
): string | null {
  if (swipeDirection === "x" && Math.abs(xDelta) >= threshold) {
    const direction = xDelta > 0 ? "right" : "left";
    return allowed.includes(direction) ? direction : null;
  }

  if (swipeDirection === "y" && Math.abs(yDelta) >= threshold) {
    const direction = yDelta > 0 ? "bottom" : "top";
    return allowed.includes(direction) ? direction : null;
  }

  return null;
}

function applySwipeAmount(element: HTMLElement, swipeX: number, swipeY: number): void {
  element.style.setProperty("--swipe-amount-x", `${swipeX}px`);
  element.style.setProperty("--swipe-amount-y", `${swipeY}px`);
}

function resetSwipeAmount(element: HTMLElement): void {
  applySwipeAmount(element, 0, 0);
}

export function registerToastSonner(Alpine: AlpineInstance): void {
  Alpine.data(
    "toastSonner",
    (config: ToastSonnerConfig = {}): ToastSonnerData => ({
      richColors: config.richColors ?? true,
      expanded: {} as Record<string, boolean>,
      heights: {} as Record<string, number>,
      heightsList: [] as HeightEntry[],
      mounted: {} as Record<string, boolean>,
      offsetBeforeRemove: {} as Record<string, number>,
      swipeMeta: {} as Record<string, SwipeMeta>,
      swipingId: null as string | null,
      pointerStart: null as { x: number; y: number } | null,
      swipeDirection: null as "x" | "y" | null,

      init(this: ToastSonnerComponent): void {
        this.$watch(
          () =>
            toastStoreFromAlpine(this.$store)
              .items.map((item: DemoToastItem) => item.id)
              .join(","),
          () => {
            const store = toastStoreFromAlpine(this.$store);
            const activeIds = new Set(store.items.map((item: DemoToastItem) => item.id));

            for (const entry of this.heightsList) {
              if (!activeIds.has(entry.id)) {
                this.pruneToastState(entry.id);
              }
            }
          }
        );
      },

      get store(): DemoToastStore {
        const { $store } = this as ToastSonnerComponent;
        return toastStoreFromAlpine($store);
      },

      get visibleToasts(): number {
        return this.store.maxVisible;
      },

      yPosition(position: DemoToastPosition): string {
        return position.split("-")[0] ?? "bottom";
      },

      xPosition(position: DemoToastPosition): string {
        return position.split("-")[1] ?? "right";
      },

      setExpanded(position: DemoToastPosition, value: boolean): void {
        this.expanded = { ...this.expanded, [position]: value };
      },

      isExpanded(position: DemoToastPosition): boolean {
        return Boolean(this.expanded[position]);
      },

      activePositions(): DemoToastPosition[] {
        return this.store.stackPositions.filter((position: DemoToastPosition) =>
          this.store.itemsAt(position).some((item: DemoToastItem) => !item.removed)
        );
      },

      timedToastsAt(position: DemoToastPosition): DemoToastItem[] {
        return this.store.timedItemsAt(position);
      },

      persistentToastsAt(position: DemoToastPosition): DemoToastItem[] {
        return this.store.persistentItemsAt(position);
      },

      hasTimedToasts(position: DemoToastPosition): boolean {
        return this.store.activeTimedItemsAt(position).length > 0;
      },

      hasPersistentToasts(position: DemoToastPosition): boolean {
        return this.store.activePersistentItemsAt(position).length > 0;
      },

      isPersistentToast(toast: DemoToastItem): boolean {
        return isPersistentDuration(toast.duration);
      },

      toastStack(toast: DemoToastItem): "timed" | "persistent" {
        return this.isPersistentToast(toast) ? "persistent" : "timed";
      },

      swipeDirectionsFor(position: DemoToastPosition): string[] {
        const [y, x] = position.split("-");
        const directions: string[] = [];

        if (y === "top" || y === "bottom") {
          directions.push(y);
        }

        if (x === "left" || x === "right") {
          directions.push(x);
        }

        return directions;
      },

      toastsAt(position: DemoToastPosition): DemoToastItem[] {
        return this.store.itemsAt(position);
      },

      findToast(id: string): DemoToastItem | undefined {
        return this.store.items.find((item: DemoToastItem) => item.id === id);
      },

      isToastRemoved(id: string): boolean {
        return Boolean(this.findToast(id)?.removed);
      },

      heightsAt(
        position: DemoToastPosition,
        stack: "timed" | "persistent" = "timed"
      ): HeightEntry[] {
        return this.heightsList.filter(
          (entry: HeightEntry) => entry.position === position && entry.stack === stack
        );
      },

      isFront(index: number | string): boolean {
        return Number(index) === 0;
      },

      heightIndex(toast: DemoToastItem): number {
        const stack = this.toastStack(toast);
        const positionHeights = this.heightsAt(toast.position, stack);
        const index = positionHeights.findIndex((entry: HeightEntry) => entry.id === toast.id);
        return index === -1 ? 0 : index;
      },

      setHeight(toast: DemoToastItem, height: number): void {
        if (height <= 0) {
          return;
        }

        const stack = this.toastStack(toast);
        const existing = this.heightsList.find((entry: HeightEntry) => entry.id === toast.id);

        if (existing) {
          if (existing.height === height) {
            return;
          }

          this.heightsList = this.heightsList.map((entry: HeightEntry) =>
            entry.id === toast.id ? { ...entry, height, stack } : entry
          );
        } else {
          this.heightsList = [
            { id: toast.id, height, position: toast.position, stack },
            ...this.heightsList,
          ];
        }

        this.heights = { ...this.heights, [toast.id]: height };
      },

      removeHeight(id: string): void {
        if (!this.heightsList.some((entry: HeightEntry) => entry.id === id)) {
          return;
        }

        this.heightsList = this.heightsList.filter((entry: HeightEntry) => entry.id !== id);
        const nextHeights = { ...this.heights };
        delete nextHeights[id];
        this.heights = nextHeights;
      },

      pruneToastState(id: string): void {
        this.removeHeight(id);

        if (this.mounted[id]) {
          const nextMounted = { ...this.mounted };
          delete nextMounted[id];
          this.mounted = nextMounted;
        }

        if (this.offsetBeforeRemove[id] !== undefined) {
          const nextOffset = { ...this.offsetBeforeRemove };
          delete nextOffset[id];
          this.offsetBeforeRemove = nextOffset;
        }

        if (this.swipeMeta[id]) {
          const nextSwipe = { ...this.swipeMeta };
          delete nextSwipe[id];
          this.swipeMeta = nextSwipe;
        }
      },

      timedToasterStyle(position: DemoToastPosition): Record<string, string> {
        const toasts = this.timedToastsAt(position);
        const activeToasts = toasts.filter((item: DemoToastItem) => !item.removed);
        const frontToast = activeToasts[0] ?? toasts[0];
        const frontId = frontToast?.id;
        const frontHeight = frontId ? (this.heights[frontId] ?? 0) : 0;
        let minHeight = frontHeight;

        if (this.isExpanded(position)) {
          minHeight = activeToasts
            .slice(0, this.visibleToasts)
            .reduce((total: number, toast: DemoToastItem, index: number) => {
              return total + (this.heights[toast.id] ?? 0) + (index > 0 ? 14 : 0);
            }, 0);
        }

        return {
          "--width": "356px",
          "--gap": "14px",
          "--front-toast-height": `${frontHeight}px`,
          minHeight: `${minHeight}px`,
        };
      },

      persistentToasterStyle(position: DemoToastPosition): Record<string, string> {
        const activeToasts = this.persistentToastsAt(position).filter(
          (item: DemoToastItem) => !item.removed
        );
        const minHeight = activeToasts.reduce(
          (total: number, toast: DemoToastItem, index: number) => {
            return total + (this.heights[toast.id] ?? 0) + (index > 0 ? 14 : 0);
          },
          0
        );

        return {
          "--width": "356px",
          "--gap": "14px",
          minHeight: `${minHeight}px`,
        };
      },

      toastOffset(toast: DemoToastItem): number {
        const positionHeights = this.heightsAt(toast.position, "timed");
        const index = this.heightIndex(toast);
        let before = 0;

        for (let i = 0; i < index; i++) {
          before += positionHeights[i]?.height ?? 0;
        }

        return index * 14 + before;
      },

      timedToastStyle(
        toast: DemoToastItem,
        index: number | string,
        position: DemoToastPosition
      ): Record<string, string> {
        const stack = this.timedToastsAt(position);
        const stackIndex = Number(index);
        const removed = this.isToastRemoved(toast.id);
        const offset = removed
          ? (this.offsetBeforeRemove[toast.id] ?? this.toastOffset(toast))
          : this.toastOffset(toast);

        return {
          "--index": String(stackIndex),
          "--toasts-before": String(stackIndex),
          "--z-index": String(stack.length - stackIndex),
          "--offset": `${offset}px`,
          "--initial-height": `${this.heights[toast.id] ?? 0}px`,
          "--swipe-amount-x": "0px",
          "--swipe-amount-y": "0px",
        };
      },

      persistentToastStyle(toast: DemoToastItem): Record<string, string> {
        return {
          "--initial-height": `${this.heights[toast.id] ?? 0}px`,
          "--swipe-amount-x": "0px",
          "--swipe-amount-y": "0px",
        };
      },

      measureToast(element: HTMLElement, toast: DemoToastItem): void {
        const originalHeight = element.style.height;

        element.style.height = "auto";
        const height = Math.round(element.getBoundingClientRect().height);
        element.style.height = originalHeight;

        this.setHeight(toast, height);
      },

      markMounted(id: string): void {
        if (this.mounted[id]) {
          return;
        }

        this.mounted = { ...this.mounted, [id]: true };
      },

      isMounted(toast: DemoToastItem): boolean {
        return Boolean(this.mounted[toast.id]);
      },

      initToast(
        this: ToastSonnerComponent,
        element: HTMLElement,
        toast: DemoToastItem,
        _index: number,
        _position: DemoToastPosition
      ): void {
        const id = toast.id;
        const measure = () => {
          const current = this.findToast(id) ?? toast;
          this.measureToast(element, current);
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(element);

        this.$watch(
          () => this.findToast(id)?.removed,
          (removed: boolean | undefined) => {
            if (!removed) {
              return;
            }

            const current = this.findToast(id) ?? toast;
            this.offsetBeforeRemove = {
              ...this.offsetBeforeRemove,
              [id]: this.isPersistentToast(current) ? 0 : this.toastOffset(current),
            };
          }
        );

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.markMounted(toast.id);
            measure();
          });
        });
      },

      toastType(toast: DemoToastItem): string {
        if (toast.variant === "error") {
          return "error";
        }

        if (toast.variant === "loading") {
          return "loading";
        }

        return toast.variant ?? "default";
      },

      showIcon(toast: DemoToastItem): boolean {
        return ["success", "info", "warning", "error", "loading"].includes(toast.variant);
      },

      isVisible(position: DemoToastPosition, index: number | string): boolean {
        return this.store.isVisibleAt(position, Number(index));
      },

      getSwipeOut(toast: ToastItem): boolean {
        return Boolean(this.swipeMeta[toast.id]?.out);
      },

      getSwipeDirection(toast: DemoToastItem): string | null {
        return this.swipeMeta[toast.id]?.direction ?? null;
      },

      dismiss(id: string, options: { swipe?: boolean; swipeDirection?: string } = {}): void {
        if (options.swipe) {
          this.swipeMeta = {
            ...this.swipeMeta,
            [id]: { out: true, direction: options.swipeDirection ?? null },
          };
        }

        this.store.dismiss(id);
      },

      runAction(toast: DemoToastItem): void {
        const content = toast.content;

        if (content?.kind === "undo-demo") {
          window.undoToastDemo(toast.id);
          return;
        }

        toast.action?.onClick?.();
        this.dismiss(toast.id);
      },

      showAction(toast: DemoToastItem): boolean {
        if (!toast.action?.label) {
          return false;
        }

        if (toast.content?.kind === "undo-demo" && toast.variant === "loading") {
          return false;
        }

        return true;
      },

      startSwipe(event: PointerEvent, toast: DemoToastItem): void {
        if (event.button === 2) {
          return;
        }

        const target = event.target as Element | null;

        if (target?.closest("[data-close-button],[data-button]")) {
          return;
        }

        this.swipingId = toast.id;
        this.swipeDirection = null;
        this.pointerStart = { x: event.clientX, y: event.clientY };
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      },

      moveSwipe(event: PointerEvent, toast: DemoToastItem, position: DemoToastPosition): void {
        if (this.swipingId !== toast.id || !this.pointerStart) {
          return;
        }

        const allowed = this.swipeDirectionsFor(position);
        const xDelta = event.clientX - this.pointerStart.x;
        const yDelta = event.clientY - this.pointerStart.y;

        if (!this.swipeDirection && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
          this.swipeDirection = resolvePrimarySwipeAxis(xDelta, yDelta);
        }

        if (!this.swipeDirection) {
          return;
        }

        const { swipeX, swipeY } = computeMoveSwipeOffsets(
          this.swipeDirection,
          xDelta,
          yDelta,
          allowed
        );

        applySwipeAmount(event.currentTarget as HTMLElement, swipeX, swipeY);
      },

      endSwipe(event: PointerEvent, toast: DemoToastItem, position: DemoToastPosition): void {
        if (this.swipingId !== toast.id) {
          return;
        }

        const allowed = this.swipeDirectionsFor(position);
        const xDelta = event.clientX - (this.pointerStart?.x ?? 0);
        const yDelta = event.clientY - (this.pointerStart?.y ?? 0);
        const element = event.currentTarget as HTMLElement;
        const dismissDirection = resolveSwipeDismissDirection(
          this.swipeDirection,
          xDelta,
          yDelta,
          45,
          allowed
        );

        if (dismissDirection) {
          this.dismiss(toast.id, { swipe: true, swipeDirection: dismissDirection });
        } else {
          resetSwipeAmount(element);
        }

        this.swipingId = null;
        this.pointerStart = null;
        this.swipeDirection = null;
      },
    })
  );
}
