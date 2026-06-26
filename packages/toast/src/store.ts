import type { ToastItem, ToastPayload, ToastPosition, ToastStore } from "./types.js";

export interface CreateToastStoreOptions<TPositions extends readonly string[] = readonly []> {
  defaultPosition?: ToastPosition<TPositions>;
  /** Declared positions — each gets its own stack. */
  positions?: TPositions;
  defaultDuration?: number;
  maxToasts?: number;
  maxVisible?: number;
}

export function resolveToastLimits(options: { maxToasts?: number; maxVisible?: number } = {}): {
  maxToasts: number;
  maxVisible: number;
} {
  const maxToasts = options.maxToasts ?? 5;
  let maxVisible = options.maxVisible ?? maxToasts;

  if (maxToasts > 0 && maxVisible > maxToasts) {
    maxVisible = maxToasts;
  }

  return { maxToasts, maxVisible };
}

/** Unique stack keys: built-in default plus configured positions. */
export function resolveStackPositions<TPositions extends readonly string[]>(
  defaultPosition: ToastPosition<TPositions>,
  positions?: TPositions
): readonly ToastPosition<TPositions>[] {
  const stacks: ToastPosition<TPositions>[] = [defaultPosition];

  for (const position of positions ?? []) {
    if (!stacks.includes(position as ToastPosition<TPositions>)) {
      stacks.push(position as ToastPosition<TPositions>);
    }
  }

  return stacks;
}

function createToastId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function applyToastPatch<TPositions extends readonly string[], TContent = unknown>(
  item: ToastItem<readonly [], TPositions, TContent>,
  payload: Partial<ToastPayload<readonly [], TPositions, TContent>>
): ToastItem<readonly [], TPositions, TContent> {
  const next = { ...item };

  for (const [key, value] of Object.entries(payload) as [
    keyof ToastPayload<readonly [], TPositions, TContent>,
    ToastPayload<readonly [], TPositions, TContent>[keyof ToastPayload<
      readonly [],
      TPositions,
      TContent
    >],
  ][]) {
    if (value !== undefined) {
      Object.assign(next, { [key]: value });
    }
  }

  return next;
}

function enforcePositionLimit<
  TVariants extends readonly string[],
  TPositions extends readonly string[],
  TContent = unknown,
>(
  items: ToastItem<TVariants, TPositions, TContent>[],
  position: ToastPosition<TPositions>,
  maxToasts: number,
  dismiss: (id: string) => void
): void {
  if (maxToasts <= 0) {
    return;
  }

  const activeAtPosition = items.filter((item) => item.position === position && !item.removed);

  for (const item of activeAtPosition.slice(maxToasts)) {
    dismiss(item.id);
  }
}

/** Creates the internal reactive toast queue consumed by `$toast` and UI integrators. */
export function createToastStore<
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  options: CreateToastStoreOptions<TPositions> = {}
): ToastStore<readonly [], TPositions, TContent> {
  const defaultPosition = options.defaultPosition ?? "bottom-right";
  const stackPositions = resolveStackPositions(defaultPosition, options.positions);
  const defaultDuration = options.defaultDuration ?? 4000;
  const { maxToasts, maxVisible } = resolveToastLimits(options);
  const dismissDelayMs = 400;
  const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const store: ToastStore<readonly [], TPositions, TContent> = {
    defaultPosition,
    stackPositions,
    maxToasts,
    maxVisible,
    items: [],

    itemsAt(position) {
      return this.items.filter((item) => item.position === position);
    },

    isVisibleAt(position, index) {
      const stack = this.itemsAt(position);
      const item = stack[index];

      if (!item || item.removed) {
        return false;
      }

      if (this.maxVisible <= 0) {
        return true;
      }

      let rank = 0;

      for (let i = 0; i <= index; i++) {
        if (stack[i] && !stack[i].removed) {
          rank++;
        }
      }

      return rank <= this.maxVisible;
    },

    push(payload: ToastPayload<readonly [], TPositions, TContent> = {}) {
      const position = payload.position ?? this.defaultPosition;
      const id = createToastId();
      const toast: ToastItem<readonly [], TPositions, TContent> = {
        id,
        content: payload.content ?? null,
        title: payload.title ?? null,
        description: payload.description ?? null,
        variant: payload.variant ?? "default",
        position,
        duration: payload.duration ?? defaultDuration,
        action: payload.action ?? null,
        removed: false,
      };

      this.items = [toast, ...this.items];
      enforcePositionLimit(this.items, position, this.maxToasts, (toastId) =>
        this.dismiss(toastId)
      );
      scheduleDismiss(id, toast.duration);

      return id;
    },

    update(id, payload: Partial<ToastPayload<readonly [], TPositions, TContent>> = {}) {
      const current = this.items.find((toast) => toast.id === id);
      if (!current) {
        return;
      }

      const previousPosition = current.position;

      this.items = this.items.map((item) =>
        item.id === id ? applyToastPatch(item, payload) : item
      );

      const nextPosition = payload.position !== undefined ? payload.position : previousPosition;

      if (nextPosition !== previousPosition) {
        enforcePositionLimit(this.items, previousPosition, this.maxToasts, (toastId) =>
          this.dismiss(toastId)
        );
      }

      enforcePositionLimit(this.items, nextPosition, this.maxToasts, (toastId) =>
        this.dismiss(toastId)
      );

      if (payload.duration !== undefined) {
        scheduleDismiss(id, payload.duration);
      }
    },

    dismiss(id) {
      const toast = this.items.find((item) => item.id === id);
      if (!toast || toast.removed) {
        return;
      }

      clearDismissTimer(id);
      toast.removed = true;
      this.items = [...this.items];

      setTimeout(() => {
        this.items = this.items.filter((item) => item.id !== id);
      }, dismissDelayMs);
    },

    dismissAt(position) {
      for (const item of this.itemsAt(position)) {
        if (!item.removed) {
          this.dismiss(item.id);
        }
      }
    },

    dismissAll() {
      for (const item of this.items) {
        if (!item.removed) {
          this.dismiss(item.id);
        }
      }
    },
  };

  function clearDismissTimer(id: string): void {
    const timer = dismissTimers.get(id);

    if (timer !== undefined) {
      clearTimeout(timer);
      dismissTimers.delete(id);
    }
  }

  function scheduleDismiss(id: string, duration: number): void {
    clearDismissTimer(id);

    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissTimers.delete(id);
        store.dismiss(id);
      }, duration);
      dismissTimers.set(id, timer);
    }
  }

  return store;
}
