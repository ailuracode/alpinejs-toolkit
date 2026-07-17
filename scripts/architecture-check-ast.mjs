import ts from "typescript";

/** @typedef {"window-access" | "document-access" | "navigator-access" | "local-storage" | "session-storage" | "set-timeout" | "set-interval" | "queue-microtask" | "request-animation-frame"} ConstructorSideEffectId */

/** @typedef {"internal" | "alpine-adapter"} ForbiddenBarrelReExportKind */

/**
 * @typedef {object} ForbiddenBarrelReExport
 * @property {number} line
 * @property {ForbiddenBarrelReExportKind} kind
 * @property {string} specifier
 */

/**
 * @param {string} fileName
 * @param {string} source
 * @returns {ts.SourceFile}
 */
export function createSourceFile(fileName, source) {
  const scriptKind = fileName.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : fileName.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : fileName.endsWith(".js") || fileName.endsWith(".mjs") || fileName.endsWith(".cjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;

  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
}

/**
 * @param {ts.Node} node
 * @param {ts.Node} container
 * @returns {boolean}
 */
function isNodeWithin(node, container) {
  let current = node;
  while (current) {
    if (current === container) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function isInsideTypeof(node) {
  let current = node.parent;
  while (current) {
    if (ts.isTypeOfExpression(current) && isNodeWithin(node, current.expression)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * @param {ts.Expression} expression
 * @returns {"window" | "document" | "navigator" | null}
 */
function getGlobalRootIdentifier(expression) {
  if (ts.isIdentifier(expression)) {
    if (
      expression.text === "window" ||
      expression.text === "document" ||
      expression.text === "navigator"
    ) {
      return expression.text;
    }
    return null;
  }

  if (ts.isPropertyAccessExpression(expression) || ts.isPropertyAccessChain(expression)) {
    return getGlobalRootIdentifier(expression.expression);
  }

  return null;
}

/** @type {Record<string, ConstructorSideEffectId>} */
const GLOBAL_ACCESS_SIDE_EFFECTS = {
  window: "window-access",
  document: "document-access",
  navigator: "navigator-access",
};

/** @type {Record<string, ConstructorSideEffectId>} */
const STORAGE_SIDE_EFFECTS = {
  localStorage: "local-storage",
  sessionStorage: "session-storage",
};

/** @type {Record<string, ConstructorSideEffectId>} */
const TIMER_SIDE_EFFECTS = {
  setTimeout: "set-timeout",
  setInterval: "set-interval",
  queueMicrotask: "queue-microtask",
  requestAnimationFrame: "request-animation-frame",
};

/**
 * Lookup helper that ignores inherited prototype members
 * (e.g. `Object.prototype.toString`). Without this guard, identifiers
 * named after inherited methods were misclassified as side effects
 * because `MAP[name]` walked the prototype chain.
 *
 * @param {Record<string, ConstructorSideEffectId>} map
 * @param {string} name
 * @returns {ConstructorSideEffectId | null}
 */
function lookupSideEffect(map, name) {
  return Object.prototype.hasOwnProperty.call(map, name) ? (map[name] ?? null) : null;
}

/**
 * @param {ts.Node} node
 * @returns {ConstructorSideEffectId | null}
 */
function getGlobalAccessSideEffect(node) {
  if (!(ts.isPropertyAccessExpression(node) || ts.isPropertyAccessChain(node))) {
    return null;
  }

  if (isInsideTypeof(node)) {
    return null;
  }

  const root = getGlobalRootIdentifier(node.expression);
  return root ? lookupSideEffect(GLOBAL_ACCESS_SIDE_EFFECTS, root) : null;
}

/**
 * @param {ts.Node} node
 * @returns {ConstructorSideEffectId | null}
 */
function getStorageSideEffect(node) {
  if (!ts.isIdentifier(node) || isInsideTypeof(node)) {
    return null;
  }

  return lookupSideEffect(STORAGE_SIDE_EFFECTS, node.text);
}

/**
 * @param {ts.Node} node
 * @returns {ConstructorSideEffectId | null}
 */
function getTimerSideEffect(node) {
  if (!(ts.isCallExpression(node) && ts.isIdentifier(node.expression))) {
    return null;
  }

  return lookupSideEffect(TIMER_SIDE_EFFECTS, node.expression.text);
}

/**
 * @param {ts.Node} node
 * @returns {ConstructorSideEffectId | null}
 */
function getConstructorSideEffectFromNode(node) {
  return getGlobalAccessSideEffect(node) ?? getStorageSideEffect(node) ?? getTimerSideEffect(node);
}

/**
 * @param {ts.Node} root
 * @returns {ConstructorSideEffectId[]}
 */
function collectConstructorSideEffects(root) {
  /** @type {Set<ConstructorSideEffectId>} */
  const violations = new Set();

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    const violation = getConstructorSideEffectFromNode(node);
    if (violation) {
      violations.add(violation);
    }
    ts.forEachChild(node, visit);
  }

  visit(root);
  return [...violations];
}

/**
 * @param {string} source
 * @param {string} [fileName]
 * @returns {string[]}
 */
export function extractConstructorBodies(source, fileName = "fixture.ts") {
  const sourceFile = createSourceFile(fileName, source);
  /** @type {string[]} */
  const bodies = [];

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (ts.isConstructorDeclaration(node) && node.body) {
      const start = node.body.getStart(sourceFile);
      const end = node.body.getEnd();
      const bodyText = source.slice(start + 1, end - 1);
      bodies.push(bodyText);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return bodies;
}

/**
 * @param {string} body
 * @returns {ConstructorSideEffectId[]}
 */
export function findConstructorSideEffectViolations(body) {
  const wrapped = `class __ArchitectureCheckFixture__ {\n  constructor() {\n${body}\n  }\n}\n`;
  return findConstructorSideEffectsInSource(wrapped, "fixture.ts");
}

/**
 * @param {string} source
 * @param {string} [fileName]
 * @returns {ConstructorSideEffectId[]}
 */
export function findConstructorSideEffectsInSource(source, fileName = "fixture.ts") {
  const sourceFile = createSourceFile(fileName, source);
  /** @type {Set<ConstructorSideEffectId>} */
  const violations = new Set();

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (ts.isConstructorDeclaration(node) && node.body) {
      for (const violation of collectConstructorSideEffects(node.body)) {
        violations.add(violation);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return [...violations];
}

/**
 * @param {ts.ImportClause | undefined} importClause
 * @returns {boolean}
 */
function isTypeOnlyImportClause(importClause) {
  if (!importClause) {
    return false;
  }

  if (importClause.isTypeOnly) {
    return true;
  }

  const namedBindings = importClause.namedBindings;
  if (!(namedBindings && ts.isNamedImports(namedBindings))) {
    return false;
  }

  return (
    namedBindings.elements.length > 0 &&
    namedBindings.elements.every((element) => element.isTypeOnly)
  );
}

/**
 * @param {string} source
 * @param {string} [fileName]
 * @returns {boolean}
 */
export function hasRuntimeAlpineImport(source, fileName = "fixture.ts") {
  const sourceFile = createSourceFile(fileName, source);
  let found = false;

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "alpinejs" &&
      !isTypeOnlyImportClause(node.importClause)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

/**
 * @param {string} specifier
 * @returns {ForbiddenBarrelReExportKind | null}
 */
function classifyForbiddenBarrelSpecifier(specifier) {
  if (/^(?:\.\/|\.\.\/)internal\//.test(specifier)) {
    return "internal";
  }

  if (/^(?:\.\/|\.\.\/)(?:alpine|bindings?|adapter)\//.test(specifier)) {
    return "alpine-adapter";
  }

  return null;
}

/**
 * @param {string} source
 * @param {string} [fileName]
 * @returns {ForbiddenBarrelReExport[]}
 */
export function findForbiddenBarrelReExports(source, fileName = "index.ts") {
  const sourceFile = createSourceFile(fileName, source);
  /** @type {ForbiddenBarrelReExport[]} */
  const violations = [];

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const kind = classifyForbiddenBarrelSpecifier(node.moduleSpecifier.text);
      if (kind) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({
          line: line + 1,
          kind,
          specifier: node.moduleSpecifier.text,
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

/**
 * @param {string} source
 * @param {string} [fileName]
 * @returns {string[]}
 */
export function findCrossPackageInternalImportViolations(source, fileName = "fixture.ts") {
  const sourceFile = createSourceFile(fileName, source);
  /** @type {string[]} */
  const violations = [];
  const pattern = /^@ailuracode\/alpine-[^/]+\/(?:src\/)?internal\//;

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (pattern.test(node.moduleSpecifier.text)) {
        violations.push(
          `cross-package import must not target another package's internal path (from "${node.moduleSpecifier.text}")`
        );
      }
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      pattern.test(node.moduleSpecifier.text)
    ) {
      violations.push(
        `cross-package import must not target another package's internal path (from "${node.moduleSpecifier.text}")`
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

/**
 * @param {string} source
 * @param {string} [fileName]
 * @returns {boolean}
 */
export function importsPackageEntrypoint(source, fileName = "fixture.test.ts") {
  const sourceFile = createSourceFile(fileName, source);
  const pattern = /^(?:\.\.\/)+src\/index(?:\.(?:js|ts))?$/;
  let found = false;

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (pattern.test(node.moduleSpecifier.text)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

const CONTROLLER_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*Controller$/;

/**
 * @param {string} name
 * @returns {boolean}
 */
function isControllerExportName(name) {
  return CONTROLLER_NAME_PATTERN.test(name);
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function exportsControllerFromClass(node) {
  return (
    ts.isClassDeclaration(node) &&
    !!node.name &&
    isControllerExportName(node.name.text) &&
    hasExportModifier(node)
  );
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function exportsControllerFromExportDeclaration(node) {
  if (
    !(ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause))
  ) {
    return false;
  }

  for (const element of node.exportClause.elements) {
    const exportedName = (element.name ?? element.propertyName)?.text;
    if (exportedName && isControllerExportName(exportedName)) {
      return true;
    }
  }

  return false;
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function exportsControllerFromAssignment(node) {
  return (
    ts.isExportAssignment(node) &&
    ts.isIdentifier(node.expression) &&
    isControllerExportName(node.expression.text)
  );
}

/**
 * @param {string} source
 * @param {string} [fileName]
 * @returns {boolean}
 */
export function exportsControllerClass(source, fileName = "index.ts") {
  const sourceFile = createSourceFile(fileName, source);
  let found = false;

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (
      exportsControllerFromClass(node) ||
      exportsControllerFromExportDeclaration(node) ||
      exportsControllerFromAssignment(node)
    ) {
      found = true;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function hasExportModifier(node) {
  return (
    ts.canHaveModifiers(node) &&
    !!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

const REGISTRATION_METHODS = new Set(["store", "magic", "directive"]);

/**
 * @param {ts.Node} node
 * @returns {string | null}
 */
function getDirectRegistrationMethod(node) {
  if (!ts.isCallExpression(node)) {
    return null;
  }
  const expression = node.expression;
  if (!(expression && ts.isPropertyAccessExpression(expression))) {
    return null;
  }
  if (!(ts.isIdentifier(expression.expression) && expression.expression.text === "Alpine")) {
    return null;
  }
  const method = expression.name.text;
  if (!REGISTRATION_METHODS.has(method)) {
    return null;
  }
  // `Alpine.store(name)` with a single argument is a getter lookup,
  // not a registration. Only flag the registration call shape:
  // - `Alpine.store(name, value)` — two args = register
  // - `Alpine.magic(name, factory)` — magic has no getter form
  // - `Alpine.directive(name, handler)` — directive has no getter form
  if (method === "store" && node.arguments.length < 2) {
    return null;
  }
  return method;
}

/**
 * Detects direct calls to `Alpine.store`, `Alpine.magic`, or
 * `Alpine.directive` in the parsed source.
 *
 * Feature packages MUST route these through the `guardStore`,
 * `guardMagic`, and `guardDirective` helpers exported from
 * `@ailuracode/alpine-core` so collisions surface as
 * `RegistrationError("REGISTRATION_COLLISION")` instead of silently
 * overwriting host registrations.
 *
 * @param {string} source
 * @param {string} [fileName]
 * @returns {{ method: string, line: number }[]}
 */
export function findDirectAlpineRegistrationCalls(source, fileName = "fixture.ts") {
  const sourceFile = createSourceFile(fileName, source);
  /** @type {{ method: string, line: number }[]} */
  const violations = [];

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    const method = getDirectRegistrationMethod(node);
    if (method) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      violations.push({ method, line: line + 1 });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}
