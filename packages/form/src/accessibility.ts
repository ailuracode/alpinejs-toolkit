/**
 * Accessibility helpers for `@ailuracode/alpine-form`.
 */

import type { FieldPath, FieldPropsOptions } from "./types.js";

/** Builds headless ARIA props for a field based on its error state. */
export function createFieldAriaProps(
  errors: readonly string[],
  options: FieldPropsOptions = {}
): Record<string, string | boolean | undefined> {
  const hasErrors = errors.length > 0;
  const describedBy = [options.describedBy, hasErrors ? options.errorId : undefined]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");

  return {
    "aria-invalid": hasErrors ? true : undefined,
    "aria-describedby": describedBy.length > 0 ? describedBy : undefined,
  };
}

/** Focuses the first invalid field inside a root element. */
export function focusFirstInvalidField(
  root: HTMLElement,
  fieldOrder: readonly FieldPath[]
): boolean {
  for (const path of fieldOrder) {
    const candidate = root.querySelector<HTMLElement>(`[data-form-field="${path}"]`);
    if (candidate) {
      candidate.focus();
      return true;
    }
  }

  const fallback = root.querySelector<HTMLElement>("[aria-invalid='true']");
  if (fallback) {
    fallback.focus();
    return true;
  }

  return false;
}

/** Builds a live-region announcement string from field and form errors. */
export function buildErrorAnnouncement(
  fieldErrors: Readonly<Record<FieldPath, readonly string[]>>,
  formErrors: readonly string[]
): string {
  const messages: string[] = [];

  for (const errors of Object.values(fieldErrors)) {
    for (const error of errors) {
      messages.push(error);
    }
  }

  for (const error of formErrors) {
    messages.push(error);
  }

  return messages.join(". ");
}

/** Announces errors through a live region element when provided. */
export function announceFormErrors(
  liveRegion: HTMLElement | null | undefined,
  announcement: string
): string {
  if (liveRegion) {
    liveRegion.textContent = announcement;
  }
  return announcement;
}
