import { safeDocument } from "@ailuracode/alpine-core";
import type { CreateThemeOptions, ResolvedTheme } from "../types";

export interface DomApplyHandle {
  apply(resolved: ResolvedTheme, force?: boolean): void;
  destroy(): void;
}

export function createDomHandle(options: CreateThemeOptions): DomApplyHandle {
  const {
    strategy = "class",
    target: configuredTarget = undefined,
    darkClass = "dark",
    lightClass = "light",
    attribute = "data-theme",
  } = options;

  let current: ResolvedTheme | null = null;
  let resolvedTarget: HTMLElement | null | undefined;

  const targetFor = (): HTMLElement | null => {
    if (configuredTarget !== undefined) {
      return configuredTarget;
    }
    if (resolvedTarget === undefined) {
      resolvedTarget = safeDocument()?.documentElement ?? null;
    }
    return resolvedTarget;
  };

  const applyClass = (resolved: ResolvedTheme, force: boolean): void => {
    const target = targetFor();
    if (!target) {
      return;
    }
    if (!force && resolved === current) {
      return;
    }
    target.classList.remove(darkClass, lightClass);
    target.classList.add(resolved === "dark" ? darkClass : lightClass);
    current = resolved;
  };

  const applyAttribute = (resolved: ResolvedTheme, force: boolean): void => {
    const target = targetFor();
    if (!target) {
      return;
    }
    if (!force && resolved === current) {
      return;
    }
    target.setAttribute(attribute, resolved);
    current = resolved;
  };

  const apply =
    strategy === "none"
      ? (): void => undefined
      : strategy === "attribute"
        ? (resolved: ResolvedTheme, force: boolean): void => applyAttribute(resolved, force)
        : (resolved: ResolvedTheme, force: boolean): void => applyClass(resolved, force);

  const destroy = (): void => {
    const target = targetFor();
    if (!target || current === null) {
      current = null;
      return;
    }
    if (strategy === "class") {
      target.classList.remove(darkClass, lightClass);
    } else if (strategy === "attribute") {
      target.removeAttribute(attribute);
    }
    current = null;
  };

  return { apply, destroy };
}
