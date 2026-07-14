/**
 * Nested field path utilities for `@ailuracode/alpine-form`.
 */

import type { FieldPath } from "./types.js";

const PATH_SEGMENT = /[^.[\]]+|\[(\d+)\]/g;

/** Normalizes bracket notation to dot notation (`items[0].name` → `items.0.name`). */
export function normalizePath(path: FieldPath): FieldPath {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/^\./, "")
    .replace(/\.$/, "");
}

/** Splits a normalized path into segments. */
export function splitPath(path: FieldPath): string[] {
  const normalized = normalizePath(path);
  if (normalized === "") {
    return [];
  }
  return normalized.split(".");
}

/** Reads a value at a nested path. Returns `undefined` when missing. */
export function getValueAtPath(
  source: Readonly<Record<string, unknown>>,
  path: FieldPath
): unknown {
  const segments = splitPath(path);
  let current: unknown = source;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/** Writes a value at a nested path, creating intermediate objects as needed. */
export function setValueAtPath(
  target: Record<string, unknown>,
  path: FieldPath,
  value: unknown
): void {
  const segments = splitPath(path);
  if (segments.length === 0) {
    return;
  }

  let current: Record<string, unknown> = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];
    if (next === null || next === undefined || typeof next !== "object" || Array.isArray(next)) {
      const created: Record<string, unknown> = {};
      current[segment] = created;
      current = created;
    } else {
      current = next as Record<string, unknown>;
    }
  }

  current[segments[segments.length - 1]] = value;
}

/** Removes a value at a nested path when the parent exists. */
export function deleteValueAtPath(target: Record<string, unknown>, path: FieldPath): void {
  const segments = splitPath(path);
  if (segments.length === 0) {
    return;
  }

  if (segments.length === 1) {
    Reflect.deleteProperty(target, segments[0]);
    return;
  }

  let current: Record<string, unknown> = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];
    if (next === null || next === undefined || typeof next !== "object") {
      return;
    }
    current = next as Record<string, unknown>;
  }

  Reflect.deleteProperty(current, segments[segments.length - 1]);
}

/** Returns true when two values are deeply equal for primitive and plain-object shapes. */
export function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (left === null || right === null || typeof left !== typeof right) {
    return false;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    return arraysEqual(left, right);
  }
  if (typeof left === "object" && typeof right === "object") {
    return recordsEqual(left as Record<string, unknown>, right as Record<string, unknown>);
  }
  return false;
}

function arraysEqual(left: readonly unknown[], right: readonly unknown[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (!valuesEqual(left[index], right[index])) {
      return false;
    }
  }
  return true;
}

function recordsEqual(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (!valuesEqual(left[key], right[key])) {
      return false;
    }
  }
  return true;
}

/** Parses path segments from arbitrary path strings for iteration helpers. */
export function parsePathSegments(path: FieldPath): string[] {
  const normalized = normalizePath(path);
  const segments: string[] = [];
  let match = PATH_SEGMENT.exec(normalized);
  while (match !== null) {
    segments.push(match[1] ?? match[0]);
    match = PATH_SEGMENT.exec(normalized);
  }
  PATH_SEGMENT.lastIndex = 0;
  return segments.length > 0 ? segments : splitPath(path);
}
