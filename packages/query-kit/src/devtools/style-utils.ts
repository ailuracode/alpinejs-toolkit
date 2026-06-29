export type InlineStyle = Record<string, string | number | undefined | null>;

export function applyStyle(element: HTMLElement, style: InlineStyle): void {
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    element.style.setProperty(toKebabCase(key), String(value));
  }
}

/** Appends inline styles after `paintClasses()` without wiping its cssText. */
export function appendStyle(element: HTMLElement, style: InlineStyle): void {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    parts.push(`${toKebabCase(key)}: ${String(value)}`);
  }

  if (parts.length === 0) {
    return;
  }

  element.style.cssText = `${element.style.cssText}; ${parts.join("; ")}`;
}

export function applyCssText(element: HTMLElement, cssText: string): void {
  element.style.cssText = cssText;
}

export function bindHover(element: HTMLElement, base: InlineStyle, hover: InlineStyle): void {
  const applyBase = (): void => applyStyle(element, base);
  const applyHover = (): void => applyStyle(element, { ...base, ...hover });

  applyBase();
  element.addEventListener("mouseenter", applyHover);
  element.addEventListener("mouseleave", applyBase);
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
