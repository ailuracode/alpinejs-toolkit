import type { QueryObserver, QueryState } from "./types.js";

export function createQueryObserver<TData>(
  state: QueryState<TData>,
  onRelease: () => void
): QueryObserver<TData> {
  let released = false;

  const destroy = (): void => {
    if (released) {
      return;
    }

    released = true;
    onRelease();
  };

  return new Proxy(state, {
    get(target, prop, receiver) {
      if (prop === "destroy") {
        return destroy;
      }

      if (prop === "state") {
        return target;
      }

      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      return prop === "destroy" || prop === "state" || Reflect.has(target, prop);
    },
    ownKeys(target) {
      return [...Reflect.ownKeys(target), "destroy", "state"];
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === "destroy" || prop === "state") {
        return {
          configurable: true,
          enumerable: true,
          writable: false,
        };
      }

      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  }) as QueryObserver<TData>;
}
