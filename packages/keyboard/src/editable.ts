/** Returns true when the event target is an editable field. */
export function isEditableTarget(event: KeyboardEvent, selector: string): boolean {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  if (target.closest(selector)) {
    return true;
  }

  return target instanceof HTMLElement && target.isContentEditable;
}
