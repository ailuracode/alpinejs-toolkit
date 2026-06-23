export const DEVTOOLS_STYLES = `
.aq-devtools-root {
  --aq-bg: #0f172a;
  --aq-panel: #111827;
  --aq-border: #1f2937;
  --aq-text: #e5e7eb;
  --aq-muted: #9ca3af;
  --aq-accent: #38bdf8;
  --aq-success: #22c55e;
  --aq-error: #ef4444;
  --aq-warning: #f59e0b;
  --aq-pending: #a78bfa;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--aq-text);
  z-index: 2147483646;
}

.aq-devtools-toggle {
  position: fixed;
  z-index: 2147483647;
  border: 1px solid var(--aq-border);
  background: var(--aq-panel);
  color: var(--aq-text);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.aq-devtools-toggle--top-left {
  top: 1rem;
  left: 1rem;
}

.aq-devtools-toggle--top-right {
  top: 1rem;
  right: 1rem;
}

.aq-devtools-toggle--bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.aq-devtools-toggle--bottom-right {
  right: 1rem;
  bottom: 1rem;
}

.aq-devtools-toggle:hover {
  border-color: var(--aq-accent);
}

.aq-devtools-panel {
  position: fixed;
  background: var(--aq-bg);
  border: 1px solid var(--aq-border);
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.45);
  display: none;
  flex-direction: column;
  overflow: hidden;
}

.aq-devtools-panel.is-open {
  display: flex;
}

.aq-devtools-panel--bottom {
  left: 0;
  right: 0;
  bottom: 0;
  height: min(420px, 55vh);
}

.aq-devtools-panel--right {
  top: 0;
  right: 0;
  bottom: 0;
  width: min(480px, 92vw);
}

.aq-devtools-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--aq-border);
  background: var(--aq-panel);
}

.aq-devtools-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.aq-devtools-search {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--aq-border);
  background: #0b1220;
  color: var(--aq-text);
  border-radius: 0.5rem;
  padding: 0.45rem 0.65rem;
  font-size: 0.85rem;
}

.aq-devtools-select {
  border: 1px solid var(--aq-border);
  background: #0b1220;
  color: var(--aq-text);
  border-radius: 0.45rem;
  padding: 0.35rem 0.55rem;
  font-size: 0.8rem;
}

.aq-devtools-tabs {
  display: flex;
  gap: 0.35rem;
}

.aq-devtools-tab,
.aq-devtools-btn {
  border: 1px solid var(--aq-border);
  background: #0b1220;
  color: var(--aq-text);
  border-radius: 0.45rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.aq-devtools-tab.is-active {
  border-color: var(--aq-accent);
  color: var(--aq-accent);
}

.aq-devtools-body {
  display: grid;
  grid-template-columns: minmax(220px, 34%) 1fr;
  min-height: 0;
  flex: 1;
}

.aq-devtools-panel--right .aq-devtools-body {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(180px, 38%) 1fr;
}

.aq-devtools-list,
.aq-devtools-detail {
  overflow: auto;
  min-height: 0;
}

.aq-devtools-list {
  border-right: 1px solid var(--aq-border);
}

.aq-devtools-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid var(--aq-border);
  background: transparent;
  color: inherit;
  padding: 0.7rem 0.85rem;
  cursor: pointer;
}

.aq-devtools-item:hover,
.aq-devtools-item.is-selected {
  background: rgba(56, 189, 248, 0.08);
}

.aq-devtools-item-key {
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-word;
}

.aq-devtools-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.45rem;
}

.aq-devtools-badge {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
  border: 1px solid transparent;
}

.aq-devtools-badge--success { color: var(--aq-success); border-color: rgba(34, 197, 94, 0.35); }
.aq-devtools-badge--error { color: var(--aq-error); border-color: rgba(239, 68, 68, 0.35); }
.aq-devtools-badge--pending { color: var(--aq-pending); border-color: rgba(167, 139, 250, 0.35); }
.aq-devtools-badge--fetching { color: var(--aq-accent); border-color: rgba(56, 189, 248, 0.35); }
.aq-devtools-badge--stale { color: var(--aq-warning); border-color: rgba(245, 158, 11, 0.35); }
.aq-devtools-badge--muted { color: var(--aq-muted); border-color: rgba(156, 163, 175, 0.35); }

.aq-devtools-detail {
  padding: 0.85rem 1rem;
}

.aq-devtools-section {
  margin-bottom: 1rem;
}

.aq-devtools-section h3 {
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--aq-muted);
}

.aq-devtools-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.aq-devtools-pre {
  margin: 0;
  padding: 0.75rem;
  border-radius: 0.55rem;
  background: #0b1220;
  border: 1px solid var(--aq-border);
  font-size: 0.78rem;
  line-height: 1.45;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.aq-devtools-empty {
  padding: 1rem;
  color: var(--aq-muted);
  font-size: 0.85rem;
}
`;
