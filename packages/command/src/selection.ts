/** Moves the active index, skipping non-selectable rows. */
export function moveSelectableIndex(
  current: number,
  delta: number,
  selectable: readonly boolean[]
): number {
  const length = selectable.length;
  if (length === 0) {
    return 0;
  }

  let index = current;
  for (let step = 0; step < length; step++) {
    index = (index + delta + length) % length;
    if (selectable[index]) {
      return index;
    }
  }

  return current;
}

/** Returns the first selectable index or zero when none exist. */
export function firstSelectableIndex(selectable: readonly boolean[]): number {
  const index = selectable.findIndex(Boolean);
  return index === -1 ? 0 : index;
}

/** Returns the last selectable index or zero when none exist. */
export function lastSelectableIndex(selectable: readonly boolean[]): number {
  for (let index = selectable.length - 1; index >= 0; index--) {
    if (selectable[index]) {
      return index;
    }
  }
  return 0;
}
