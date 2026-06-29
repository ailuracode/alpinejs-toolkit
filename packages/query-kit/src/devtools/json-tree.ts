import { paintClasses } from "./ui-styles.js";

function formatPrimitive(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return String(value);
}

function createLeaf(label: string, value: unknown): HTMLDivElement {
  const row = document.createElement("div");
  paintClasses(row, "aq-devtools-tree-row", "aq-devtools-tree-row--leaf");

  const name = document.createElement("span");
  paintClasses(name, "aq-devtools-tree-key");
  name.textContent = label;

  const content = document.createElement("span");
  paintClasses(content, "aq-devtools-tree-value", `aq-devtools-tree-value--${typeof value}`);
  content.textContent = formatPrimitive(value);

  row.append(name, content);
  return row;
}

function createBranch(
  label: string,
  childCount: number,
  renderChildren: () => HTMLElement
): HTMLElement {
  if (childCount === 0) {
    const empty = document.createElement("div");
    paintClasses(empty, "aq-devtools-tree-row", "aq-devtools-tree-row--leaf");

    const name = document.createElement("span");
    paintClasses(name, "aq-devtools-tree-key");
    name.textContent = label;

    const content = document.createElement("span");
    paintClasses(content, "aq-devtools-tree-value", "aq-devtools-tree-value--object");
    content.textContent = "[]";

    empty.append(name, content);
    return empty;
  }

  const details = document.createElement("details");
  paintClasses(details, "aq-devtools-tree-branch");
  details.open = true;

  const summary = document.createElement("summary");
  paintClasses(summary, "aq-devtools-tree-summary");

  const name = document.createElement("span");
  paintClasses(name, "aq-devtools-tree-key");
  name.textContent = label;

  const meta = document.createElement("span");
  paintClasses(meta, "aq-devtools-tree-meta");
  meta.textContent = String(childCount);

  summary.append(name, meta);

  const body = document.createElement("div");
  paintClasses(body, "aq-devtools-tree-children");
  body.append(renderChildren());

  details.append(summary, body);
  return details;
}

function renderObjectEntries(value: Record<string, unknown>): HTMLElement {
  const container = document.createElement("div");
  paintClasses(container, "aq-devtools-tree-group");

  for (const [key, child] of Object.entries(value)) {
    container.append(renderNode(key, child));
  }

  return container;
}

function renderArrayItems(value: unknown[]): HTMLElement {
  const container = document.createElement("div");
  paintClasses(container, "aq-devtools-tree-group");

  value.forEach((child, index) => {
    container.append(renderNode(String(index), child));
  });

  return container;
}

function renderNode(label: string, value: unknown): HTMLElement {
  if (value === null || typeof value !== "object") {
    return createLeaf(label, value);
  }

  if (Array.isArray(value)) {
    return createBranch(`${label} []`, value.length, () => renderArrayItems(value));
  }

  const entries = Object.entries(value as Record<string, unknown>);
  return createBranch(`${label} {}`, entries.length, () =>
    renderObjectEntries(value as Record<string, unknown>)
  );
}

/** Renders query/mutation payloads as an expandable JSON tree. */
export function createJsonTree(value: unknown, rootLabel = "data"): HTMLElement {
  const root = document.createElement("div");
  paintClasses(root, "aq-devtools-tree");

  if (value === null || typeof value !== "object") {
    root.append(createLeaf(rootLabel, value));
    return root;
  }

  if (Array.isArray(value)) {
    root.append(createBranch(`${rootLabel} []`, value.length, () => renderArrayItems(value)));
    return root;
  }

  root.append(
    createBranch(`${rootLabel} {}`, Object.keys(value as object).length, () =>
      renderObjectEntries(value as Record<string, unknown>)
    )
  );
  return root;
}
