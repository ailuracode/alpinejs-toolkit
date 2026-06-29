import type AlpineType from "alpinejs";

export const VISIBILITY_STATES = ["visible", "hidden", "prerender"] as const;

export type VisibilityState = (typeof VISIBILITY_STATES)[number];

export type VisibilitySnapshot = {
  readonly isVisible: boolean;
  readonly isHidden: boolean;
  readonly state: VisibilityState;
};

export interface VisibilityMagic extends VisibilitySnapshot {
  is(state: VisibilityState): boolean;
}

type VisibilitySource = Pick<Document, "hidden"> & { visibilityState: VisibilityState };

type VisibilityStateRecord = VisibilityMagic & {
  _hidden: boolean;
  _state: VisibilityState;
};

/** Reads tab visibility from the Page Visibility API (defaults to visible when unavailable). */
export function readVisibilityState(doc?: VisibilitySource): VisibilitySnapshot {
  if (doc) {
    return {
      isVisible: !doc.hidden,
      isHidden: doc.hidden,
      state: doc.visibilityState,
    };
  }

  if (typeof document === "undefined") {
    return {
      isVisible: true,
      isHidden: false,
      state: "visible",
    };
  }

  const source = document as VisibilitySource;

  return {
    isVisible: !source.hidden,
    isHidden: source.hidden,
    state: source.visibilityState,
  };
}

/** Builds reactive visibility state with getter-based flags. */
export function createVisibilityState(
  snapshot: VisibilitySnapshot = readVisibilityState()
): VisibilityStateRecord {
  return {
    _hidden: snapshot.isHidden,
    _state: snapshot.state,
    get isVisible() {
      return !this._hidden;
    },
    get isHidden() {
      return this._hidden;
    },
    get state() {
      return this._state;
    },
    is(state: VisibilityState) {
      return this._state === state;
    },
  };
}

/** Registers reactive `$visibility` magic on Alpine. */
export function registerVisibilityMagic(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive(createVisibilityState());

  Alpine.magic("visibility", () => state as VisibilityMagic);

  const update = () => {
    const snapshot = readVisibilityState();
    state._hidden = snapshot.isHidden;
    state._state = snapshot.state;
  };

  document.addEventListener("visibilitychange", update);
}
