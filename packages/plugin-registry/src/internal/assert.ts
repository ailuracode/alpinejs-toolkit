/**
 * Shared validators for plugin definitions.
 *
 * Both `define*()` (in `define.ts`) and `registerPlugin()` (in `registry.ts`)
 * call `assertValidDefinition` so that the same `ToolkitError` codes are raised
 * whether the caller validates early or late. Failing early at the `define`
 * call site is the preferred path because it surfaces the bug next to the
 * construction code.
 *
 * Kept under `internal/` because consumers never import these helpers
 * directly — they receive the error, not the validator.
 */
import { ToolkitError } from "../core-deps.js";
import type { PluginDefinition, PluginKind } from "../types";

/**
 * Throws a {@link ToolkitError} with `code: 'PLUGIN_INVALID_DEFINITION'` when
 * `definition` is malformed. Returns the same `definition` so callers can
 * chain: `return assertValidDefinition(d);`.
 *
 * Dev-only sanity check. The production build replaces
 * `process.env.NODE_ENV` with the literal `"production"` (see
 * `tsup.config.ts`), so the minifier dead-code-eliminates the entire
 * body and trees the unused helper assertions out of the bundle. Catch
 * malformation early in development; trust the call site in
 * production.
 */
export function assertValidDefinition(definition: PluginDefinition): PluginDefinition {
  if (process.env.NODE_ENV !== "production") {
    assertKindsValid(definition);
    assertNamesShapeValid(definition);
    assertNamesPerKindValid(definition);
  }
  return definition;
}

/* ------------------------------------------------------------------ */
/* Individual checks — kept small so the cognitive complexity of the */
/* public entrypoint stays low.                                        */
/* ------------------------------------------------------------------ */

function assertKindsValid(definition: PluginDefinition): void {
  if (definition.kinds.length === 0) {
    throw new ToolkitError(
      "Plugin must declare at least one kind (magic, store, or directive)",
      "PLUGIN_INVALID_DEFINITION"
    );
  }
  const unique = new Set(definition.kinds);
  if (unique.size !== definition.kinds.length) {
    throw new ToolkitError(
      `Plugin kinds must be unique — got duplicates in [${definition.kinds.join(", ")}]`,
      "PLUGIN_INVALID_DEFINITION"
    );
  }
}

function assertNamesShapeValid(definition: PluginDefinition): void {
  const isFlat = Array.isArray(definition.names);
  const isObject = !isFlat && typeof definition.names === "object";
  if (!(isFlat || isObject)) {
    throw new ToolkitError(
      "Plugin names must be a string array (single kind) or an object (multi kind)",
      "PLUGIN_INVALID_DEFINITION"
    );
  }
  // Flat-array form requires exactly one kind.
  if (isFlat && definition.kinds.length !== 1) {
    throw new ToolkitError(
      `Plugin names as a flat array requires exactly one kind, got ${definition.kinds.length}`,
      "PLUGIN_INVALID_DEFINITION"
    );
  }
}

function assertNamesPerKindValid(definition: PluginDefinition): void {
  const allowCrossKind = definition.allowNameCrossKind === true;
  const seenNames = new Set<string>();
  for (const kind of definition.kinds) {
    const namesForKind = readNamesForKind(definition.names, kind);
    if (namesForKind.length === 0) {
      throw new ToolkitError(
        `Plugin declares kind "${kind}" but provides no names for it`,
        "PLUGIN_INVALID_DEFINITION"
      );
    }
    for (const name of namesForKind) {
      if (seenNames.has(name) && !allowCrossKind) {
        throw new ToolkitError(
          `Plugin name "${name}" appears under multiple kinds`,
          "PLUGIN_INVALID_DEFINITION"
        );
      }
      seenNames.add(name);
    }
  }
}

function readNamesForKind(names: PluginDefinition["names"], kind: PluginKind): readonly string[] {
  if (Array.isArray(names)) {
    return names;
  }
  // The object form is the only branch where this lookup is meaningful —
  // the caller has already verified that `names` is an object, not an array.
  const objectNames = names as {
    readonly magic?: readonly string[];
    readonly store?: readonly string[];
    readonly directive?: readonly string[];
  };
  return objectNames[kind] ?? [];
}
