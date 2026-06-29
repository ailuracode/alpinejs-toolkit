import { applyCssText } from "./style-utils.js";

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const SCROLL_PANE =
  "overflow: auto; min-height: 0; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--aq-border) transparent";

export const UI_STYLES: Record<string, string> = {
  ":root.dark.aq-devtools-root":
    "--aq-background: hsl(224 18% 12%); --aq-foreground: hsl(210 40% 98%); --aq-card: hsl(224 16% 16%); --aq-card-foreground: hsl(210 40% 98%); --aq-muted: hsl(224 14% 20%); --aq-muted-foreground: hsl(215 20% 65%); --aq-border: hsl(224 12% 24%); --aq-input: hsl(224 12% 24%); --aq-ring: hsl(263 70% 72%); --aq-brand: hsl(263 70% 72%); --aq-brand-foreground: hsl(224 71% 4%); --aq-brand-muted: hsl(263 35% 22%); --aq-primary: hsl(263 70% 72%); --aq-primary-foreground: hsl(224 71% 4%); --aq-secondary: hsl(224 14% 20%); --aq-secondary-foreground: hsl(210 40% 98%); --aq-accent: hsl(224 14% 22%); --aq-accent-foreground: hsl(210 40% 98%); --aq-destructive: hsl(0 62% 45%); --aq-destructive-foreground: hsl(0 0% 98%); --aq-success: hsl(142 71% 45%); --aq-success-foreground: hsl(0 0% 98%); --aq-warning: hsl(38 92% 50%); --aq-warning-foreground: hsl(224 71% 4%); --aq-warning-text: hsl(38 92% 62%); --aq-pending: hsl(263 70% 72%); --aq-pending-foreground: hsl(224 71% 4%); --aq-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.35), 0 2px 4px -2px rgb(0 0 0 / 0.25); --aq-shadow-lg: 0 24px 48px -12px rgb(0 0 0 / 0.55), 0 12px 24px -8px rgb(0 0 0 / 0.35); --aq-tab-shadow: 0 1px 2px rgb(0 0 0 / 0.35); color-scheme: dark",
  ':root[data-theme="dark"].aq-devtools-root':
    "--aq-background: hsl(224 18% 12%); --aq-foreground: hsl(210 40% 98%); --aq-card: hsl(224 16% 16%); --aq-card-foreground: hsl(210 40% 98%); --aq-muted: hsl(224 14% 20%); --aq-muted-foreground: hsl(215 20% 65%); --aq-border: hsl(224 12% 24%); --aq-input: hsl(224 12% 24%); --aq-ring: hsl(263 70% 72%); --aq-brand: hsl(263 70% 72%); --aq-brand-foreground: hsl(224 71% 4%); --aq-brand-muted: hsl(263 35% 22%); --aq-primary: hsl(263 70% 72%); --aq-primary-foreground: hsl(224 71% 4%); --aq-secondary: hsl(224 14% 20%); --aq-secondary-foreground: hsl(210 40% 98%); --aq-accent: hsl(224 14% 22%); --aq-accent-foreground: hsl(210 40% 98%); --aq-destructive: hsl(0 62% 45%); --aq-destructive-foreground: hsl(0 0% 98%); --aq-success: hsl(142 71% 45%); --aq-success-foreground: hsl(0 0% 98%); --aq-warning: hsl(38 92% 50%); --aq-warning-foreground: hsl(224 71% 4%); --aq-warning-text: hsl(38 92% 62%); --aq-pending: hsl(263 70% 72%); --aq-pending-foreground: hsl(224 71% 4%); --aq-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.35), 0 2px 4px -2px rgb(0 0 0 / 0.25); --aq-shadow-lg: 0 24px 48px -12px rgb(0 0 0 / 0.55), 0 12px 24px -8px rgb(0 0 0 / 0.35); --aq-tab-shadow: 0 1px 2px rgb(0 0 0 / 0.35); color-scheme: dark",
  "aq-devtools-actions": "display: flex; flex-wrap: wrap; gap: 0.5rem",
  "aq-devtools-badge":
    "display: inline-flex; align-items: center; border-radius: 9999px; border: 1px solid var(--aq-border); padding: 0.125rem 0.5rem; font-size: 0.6875rem; font-weight: 600; line-height: 1.25; letter-spacing: 0.01em; background: var(--aq-background); color: var(--aq-foreground)",
  "aq-devtools-badge--shell":
    "display: inline-flex; align-items: center; border-radius: 9999px; border: 1px solid; padding: 0.125rem 0.5rem; font-size: 0.6875rem; font-weight: 600; line-height: 1.25; letter-spacing: 0.01em",
  "aq-devtools-badge--error":
    "border-color: color-mix(in srgb, var(--aq-destructive) 35%, var(--aq-border)); background: color-mix(in srgb, var(--aq-destructive) 10%, var(--aq-background)); color: var(--aq-destructive)",
  "aq-devtools-badge--fetching":
    "border-color: color-mix(in srgb, var(--aq-warning) 35%, var(--aq-border)); background: color-mix(in srgb, var(--aq-warning) 12%, var(--aq-background)); color: var(--aq-warning-text)",
  "aq-devtools-badge--fresh":
    "border-color: color-mix(in srgb, var(--aq-success) 35%, var(--aq-border)); background: color-mix(in srgb, var(--aq-success) 16%, var(--aq-background)); color: var(--aq-success)",
  "aq-devtools-badge--adapter": "",
  "aq-devtools-badge--muted": "background: var(--aq-secondary); color: var(--aq-muted-foreground)",
  "aq-devtools-badge--pending":
    "border-color: color-mix(in srgb, var(--aq-pending) 35%, var(--aq-border)); background: color-mix(in srgb, var(--aq-pending) 10%, var(--aq-background)); color: var(--aq-pending)",
  "aq-devtools-badge--stale":
    "border-color: color-mix(in srgb, var(--aq-warning) 35%, var(--aq-border)); background: color-mix(in srgb, var(--aq-warning) 12%, var(--aq-background)); color: var(--aq-warning-text)",
  "aq-devtools-badge--success":
    "border-color: color-mix(in srgb, var(--aq-success) 35%, var(--aq-border)); background: color-mix(in srgb, var(--aq-success) 12%, var(--aq-background)); color: var(--aq-success)",
  "aq-devtools-badges": "display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.5rem",
  "aq-devtools-body":
    "display: grid; grid-template-columns: minmax(220px, 34%) 1fr; min-height: 0; flex: 1; background: var(--aq-muted)",
  "aq-devtools-brand":
    "display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; flex: 1",
  "aq-devtools-btn":
    "box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; height: 2rem; padding: 0 0.75rem; border: 1px solid var(--aq-border); border-radius: calc(var(--aq-radius) - 4px); background: var(--aq-background); color: var(--aq-foreground); font-size: 0.8125rem; font-weight: 500; line-height: 1; cursor: pointer; white-space: nowrap; transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
  "aq-devtools-btn--destructive":
    "border-color: transparent; background: color-mix(in srgb, var(--aq-destructive) 88%, black); color: var(--aq-destructive-foreground)",
  "aq-devtools-btn--destructive:hover":
    "filter: brightness(1.05); color: var(--aq-destructive-foreground)",
  "aq-devtools-btn--ghost":
    "border-color: var(--aq-border); background: color-mix(in srgb, var(--aq-muted) 35%, transparent); color: var(--aq-muted-foreground)",
  "aq-devtools-btn--ghost:hover":
    "background: var(--aq-accent); color: var(--aq-foreground); border-color: var(--aq-border)",
  "aq-devtools-btn--icon":
    "width: 2rem; height: 2rem; padding: 0; border-color: transparent; background: transparent; color: var(--aq-muted-foreground); font-size: 1.125rem; line-height: 1",
  "aq-devtools-btn--icon:hover":
    "background: var(--aq-accent); color: var(--aq-foreground); border-color: transparent",
  "aq-devtools-btn--primary":
    "border-color: transparent; background: var(--aq-primary); color: var(--aq-primary-foreground)",
  "aq-devtools-btn--primary:hover": "filter: brightness(1.05); color: var(--aq-primary-foreground)",
  "aq-devtools-btn:focus-visible":
    "outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--aq-background), 0 0 0 4px var(--aq-ring)",
  "aq-devtools-btn:hover": "background: var(--aq-accent); color: var(--aq-accent-foreground)",
  "aq-devtools-data-modes":
    "display: inline-flex; align-items: center; gap: 0.125rem; margin-bottom: 0.625rem; padding: 0.125rem; border-radius: calc(var(--aq-radius) - 2px); background: var(--aq-muted)",
  "aq-devtools-data-viewport": "min-height: 0",
  "aq-devtools-detail": `padding: 0; background: var(--aq-background); ${SCROLL_PANE}`,
  "aq-devtools-detail-content": "padding: 1rem 1.125rem 1.125rem",
  "aq-devtools-back":
    "flex-shrink: 0; height: 2.25rem; padding-inline: 0.875rem; font-size: 0.75rem; font-weight: 600",
  "aq-devtools-detail-header":
    "padding: 1rem 1.125rem 0.875rem; border-bottom: 1px solid var(--aq-border); background: color-mix(in srgb, var(--aq-muted) 35%, var(--aq-background))",
  "aq-devtools-detail-key":
    "display: block; margin: 0; font-size: 0.875rem; font-weight: 600; line-height: 1.45; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; word-break: break-word; color: var(--aq-foreground)",
  "aq-devtools-editor":
    "display: block; width: 100%; min-height: 8rem; margin-bottom: 0.625rem; padding: 0.875rem 1rem; border: 1px solid var(--aq-border); border-radius: calc(var(--aq-radius) - 2px); background: var(--aq-muted); color: var(--aq-foreground); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.75rem; line-height: 1.6; resize: vertical",
  "aq-devtools-editor-feedback":
    "margin-top: 0.5rem; font-size: 0.75rem; color: var(--aq-muted-foreground)",
  'aq-devtools-editor-feedback[data-tone="error"]': "color: var(--aq-destructive)",
  'aq-devtools-editor-feedback[data-tone="success"]': "color: var(--aq-success)",
  "aq-devtools-editor:focus":
    "outline: none; border-color: var(--aq-ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--aq-ring) 18%, transparent)",
  "aq-devtools-empty":
    "display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem; min-height: 8rem; padding: 2rem 1rem; color: var(--aq-muted-foreground); font-size: 0.875rem; line-height: 1.5; text-align: center",
  "aq-devtools-follow-latest":
    "display: inline-flex; align-items: center; gap: 0.375rem; flex-shrink: 0; font-size: 0.75rem; line-height: 1.25; color: var(--aq-muted-foreground); cursor: pointer; user-select: none; white-space: nowrap",
  "aq-devtools-global-action":
    "flex-shrink: 0; height: 2.25rem; padding-inline: 0.875rem; font-size: 0.75rem; font-weight: 600",
  "aq-devtools-grid":
    "display: grid; grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr)); gap: 0.625rem",
  "aq-devtools-header":
    "display: flex; flex-direction: column; gap: 0.625rem; padding: 0.875rem 1rem 0.75rem; border-bottom: 1px solid var(--aq-border); background: color-mix(in srgb, var(--aq-muted) 45%, var(--aq-card))",
  "aq-devtools-header-toolbar": "display: flex; flex-direction: column; gap: 0.5rem; min-width: 0",
  "aq-devtools-header-top": "display: flex; align-items: center; gap: 0.75rem; min-width: 0",
  "aq-devtools-item":
    "display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--aq-border); background: transparent; color: inherit; padding: 0.75rem 1rem; cursor: pointer; transition: background-color 0.15s ease",
  "aq-devtools-item-header":
    "display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; min-width: 0; margin-bottom: 0.375rem",
  "aq-devtools-item-key":
    "flex: 1; min-width: 0; font-size: 0.8125rem; font-weight: 500; line-height: 1.45; word-break: break-word; color: var(--aq-foreground)",
  "aq-devtools-item:hover": "background: var(--aq-accent)",
  "aq-devtools-item.is-selected":
    "background: color-mix(in srgb, var(--aq-brand-muted) 70%, var(--aq-background)); box-shadow: inset 3px 0 0 0 var(--aq-brand)",
  "aq-devtools-list": `border-right: 1px solid var(--aq-border); background: var(--aq-background); ${SCROLL_PANE}`,
  "aq-devtools-list-count":
    "display: inline-flex; align-items: center; justify-content: center; min-width: 1.25rem; height: 1.25rem; padding: 0 0.375rem; border-radius: 9999px; background: var(--aq-brand-muted); color: var(--aq-brand); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0; text-transform: none",
  "aq-devtools-list-header":
    "position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.625rem 1rem; border-bottom: 1px solid var(--aq-border); background: color-mix(in srgb, var(--aq-background) 92%, var(--aq-muted)); backdrop-filter: blur(8px); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--aq-muted-foreground)",
  "aq-devtools-toolbar-actions":
    "display: inline-flex; align-items: center; gap: 0.5rem; flex-shrink: 0; margin-left: auto",
  "aq-devtools-panel":
    "position: fixed; display: none; flex-direction: column; overflow: hidden; background: var(--aq-card); border: 1px solid var(--aq-border); color: var(--aq-card-foreground); box-shadow: var(--aq-shadow-lg); backdrop-filter: blur(12px)",
  "aq-devtools-panel--bottom":
    "left: 0.75rem; right: 0.75rem; bottom: 0.75rem; width: auto; height: min(460px, 58vh); border-radius: var(--aq-radius); transform: none",
  "aq-devtools-panel--right":
    "top: 0.75rem; right: 0.75rem; bottom: 0.75rem; width: min(420px, calc(100vw - 1.5rem)); border-radius: var(--aq-radius)",
  "aq-devtools-panel--right.aq-devtools-body":
    "grid-template-columns: 1fr; grid-template-rows: minmax(180px, 38%) 1fr",
  "aq-devtools-panel.is-open": "display: flex",
  "aq-devtools-pre":
    "margin: 0; padding: 0.875rem 1rem; border-radius: calc(var(--aq-radius) - 2px); background: var(--aq-muted); border: 1px solid var(--aq-border); font-size: 0.75rem; line-height: 1.6; overflow: auto; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: var(--aq-foreground)",
  "aq-devtools-resize-grip":
    "width: 2.5rem; height: 0.25rem; border-radius: 9999px; background: var(--aq-border)",
  "aq-devtools-resize-handle":
    "flex-shrink: 0; display: flex; align-items: center; justify-content: center; height: 0.875rem; padding: 0.375rem 0; cursor: ns-resize; touch-action: none; border-bottom: 1px solid var(--aq-border); background: color-mix(in srgb, var(--aq-muted) 50%, transparent)",
  "aq-devtools-root":
    '--aq-background: hsl(0 0% 100%); --aq-foreground: hsl(224 71% 4%); --aq-card: hsl(0 0% 100%); --aq-card-foreground: hsl(224 71% 4%); --aq-muted: hsl(220 14% 96%); --aq-muted-foreground: hsl(220 9% 46%); --aq-border: hsl(220 13% 91%); --aq-input: hsl(220 13% 91%); --aq-ring: hsl(262 83% 58%); --aq-brand: hsl(262 83% 58%); --aq-brand-foreground: hsl(0 0% 100%); --aq-brand-muted: hsl(262 60% 96%); --aq-primary: hsl(262 83% 58%); --aq-primary-foreground: hsl(0 0% 100%); --aq-secondary: hsl(220 14% 96%); --aq-secondary-foreground: hsl(224 71% 4%); --aq-accent: hsl(220 14% 96%); --aq-accent-foreground: hsl(224 71% 4%); --aq-destructive: hsl(0 84% 60%); --aq-destructive-foreground: hsl(0 0% 98%); --aq-success: hsl(142 76% 36%); --aq-success-foreground: hsl(0 0% 98%); --aq-warning: hsl(38 92% 50%); --aq-warning-foreground: hsl(224 71% 4%); --aq-warning-text: hsl(32 95% 38%); --aq-pending: hsl(262 83% 58%); --aq-pending-foreground: hsl(0 0% 100%); --aq-shadow: 0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.06); --aq-shadow-lg: 0 20px 25px -5px rgb(15 23 42 / 0.12), 0 8px 10px -6px rgb(15 23 42 / 0.08); --aq-tab-shadow: 0 1px 2px rgb(15 23 42 / 0.06); --aq-radius: 0.75rem; color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-feature-settings: "rlig" 1, "calt" 1; color: var(--aq-foreground); z-index: 2147483646; -webkit-font-smoothing: antialiased',
  "aq-devtools-root.aq-devtools-root--dark":
    "--aq-background: hsl(224 18% 12%); --aq-foreground: hsl(210 40% 98%); --aq-card: hsl(224 16% 16%); --aq-card-foreground: hsl(210 40% 98%); --aq-muted: hsl(224 14% 20%); --aq-muted-foreground: hsl(215 20% 65%); --aq-border: hsl(224 12% 24%); --aq-input: hsl(224 12% 24%); --aq-ring: hsl(263 70% 72%); --aq-brand: hsl(263 70% 72%); --aq-brand-foreground: hsl(224 71% 4%); --aq-brand-muted: hsl(263 35% 22%); --aq-primary: hsl(263 70% 72%); --aq-primary-foreground: hsl(224 71% 4%); --aq-secondary: hsl(224 14% 20%); --aq-secondary-foreground: hsl(210 40% 98%); --aq-accent: hsl(224 14% 22%); --aq-accent-foreground: hsl(210 40% 98%); --aq-destructive: hsl(0 62% 45%); --aq-destructive-foreground: hsl(0 0% 98%); --aq-success: hsl(142 71% 45%); --aq-success-foreground: hsl(0 0% 98%); --aq-warning: hsl(38 92% 50%); --aq-warning-foreground: hsl(224 71% 4%); --aq-warning-text: hsl(38 92% 62%); --aq-pending: hsl(263 70% 72%); --aq-pending-foreground: hsl(224 71% 4%); --aq-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.35), 0 2px 4px -2px rgb(0 0 0 / 0.25); --aq-shadow-lg: 0 24px 48px -12px rgb(0 0 0 / 0.55), 0 12px 24px -8px rgb(0 0 0 / 0.35); --aq-tab-shadow: 0 1px 2px rgb(0 0 0 / 0.35); color-scheme: dark",
  "aq-devtools-root.aq-devtools-root--light":
    "--aq-background: hsl(0 0% 100%); --aq-foreground: hsl(224 71% 4%); --aq-card: hsl(0 0% 100%); --aq-card-foreground: hsl(224 71% 4%); --aq-muted: hsl(220 14% 96%); --aq-muted-foreground: hsl(220 9% 46%); --aq-border: hsl(220 13% 91%); --aq-input: hsl(220 13% 91%); --aq-ring: hsl(262 83% 58%); --aq-brand: hsl(262 83% 58%); --aq-brand-foreground: hsl(0 0% 100%); --aq-brand-muted: hsl(262 60% 96%); --aq-primary: hsl(262 83% 58%); --aq-primary-foreground: hsl(0 0% 100%); --aq-secondary: hsl(220 14% 96%); --aq-secondary-foreground: hsl(224 71% 4%); --aq-accent: hsl(220 14% 96%); --aq-accent-foreground: hsl(224 71% 4%); --aq-destructive: hsl(0 84% 60%); --aq-destructive-foreground: hsl(0 0% 98%); --aq-success: hsl(142 76% 36%); --aq-success-foreground: hsl(0 0% 98%); --aq-warning: hsl(38 92% 50%); --aq-warning-foreground: hsl(224 71% 4%); --aq-warning-text: hsl(32 95% 38%); --aq-pending: hsl(262 83% 58%); --aq-pending-foreground: hsl(0 0% 100%); --aq-shadow: 0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.06); --aq-shadow-lg: 0 20px 25px -5px rgb(15 23 42 / 0.12), 0 8px 10px -6px rgb(15 23 42 / 0.08); --aq-tab-shadow: 0 1px 2px rgb(15 23 42 / 0.06); color-scheme: light",
  "aq-devtools-search":
    "flex: 1; min-width: 0; height: 2.25rem; border: 1px solid var(--aq-input); background: var(--aq-background); color: var(--aq-foreground); border-radius: calc(var(--aq-radius) - 2px); padding: 0 0.75rem 0 2rem; font-size: 0.8125rem; line-height: 1.25rem; background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z'/%3E%3C/svg%3E\"); background-repeat: no-repeat; background-position: 0.625rem center; transition: border-color 0.15s ease, box-shadow 0.15s ease",
  "aq-devtools-search:focus":
    "outline: none; border-color: var(--aq-ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--aq-ring) 18%, transparent)",
  "aq-devtools-section": "margin-bottom: 1.125rem",
  "aq-devtools-section:last-child": "margin-bottom: 0",
  "aq-devtools-section.h3":
    "margin: 0 0 0.625rem; font-size: 0.8125rem; font-weight: 600; line-height: 1.2; color: var(--aq-muted-foreground)",
  "aq-devtools-select": `box-sizing: border-box; height: 2.25rem; min-width: 0; border: 1px solid var(--aq-input); background-color: var(--aq-background); color: var(--aq-foreground); border-radius: calc(var(--aq-radius) - 2px); padding: 0.375rem 2rem 0.375rem 0.75rem; font-size: 0.75rem; line-height: 1.25; cursor: pointer; vertical-align: middle; appearance: none; -webkit-appearance: none; background-image: ${SELECT_CHEVRON}; background-repeat: no-repeat; background-position: right 0.625rem center; background-size: 0.75rem`,
  "aq-devtools-select--adapter": "max-width: 11.5rem; flex-shrink: 0",
  "aq-devtools-select--sort": "min-width: 10.5rem; max-width: 12rem; flex-shrink: 0",
  "aq-devtools-select:focus":
    "outline: none; border-color: var(--aq-ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--aq-ring) 18%, transparent)",
  "aq-devtools-stat":
    "display: flex; flex-direction: column; gap: 0.25rem; padding: 0.625rem 0.75rem; border-radius: calc(var(--aq-radius) - 2px); border: 1px solid var(--aq-border); background: var(--aq-muted)",
  "aq-devtools-stat-label":
    "font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; color: var(--aq-muted-foreground)",
  "aq-devtools-stat-value":
    "font-size: 0.8125rem; font-weight: 600; line-height: 1.3; color: var(--aq-foreground); word-break: break-word",
  "aq-devtools-stat-value--error": "color: var(--aq-destructive)",
  "aq-devtools-stat-value--muted": "color: var(--aq-muted-foreground); font-weight: 500",
  "aq-devtools-stat-value--success": "color: var(--aq-success)",
  "aq-devtools-stat-value--warning": "color: var(--aq-warning-text)",
  "aq-devtools-subtitle":
    "font-size: 0.75rem; line-height: 1.3; color: var(--aq-muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis",
  "aq-devtools-subtitle:empty": "display: none",
  "aq-devtools-tab":
    "display: inline-flex; align-items: center; justify-content: center; height: 2rem; padding: 0 0.75rem; border: 1px solid transparent; background: transparent; color: var(--aq-muted-foreground); border-radius: calc(var(--aq-radius) - 4px); font-size: 0.8125rem; font-weight: 500; line-height: 1; cursor: pointer; white-space: nowrap; transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease,\n    box-shadow 0.15s ease",
  "aq-devtools-tab:hover": "color: var(--aq-foreground)",
  "aq-devtools-tab.is-active":
    "background: var(--aq-background); color: var(--aq-foreground); box-shadow: var(--aq-tab-shadow)",
  "aq-devtools-tabs":
    "display: inline-flex; align-items: center; gap: 0.125rem; padding: 0.125rem; border-radius: calc(var(--aq-radius) - 2px); background: var(--aq-muted); flex-shrink: 0; margin-left: auto",
  "aq-devtools-title":
    "font-size: 0.9375rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; color: var(--aq-foreground)",
  "aq-devtools-toggle":
    "position: fixed; z-index: 2147483647; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 2.5rem; padding: 0 1rem 0 0.875rem; border: 1px solid color-mix(in srgb, var(--aq-brand) 35%, var(--aq-border)); background: var(--aq-card); color: var(--aq-foreground); border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; line-height: 1; cursor: pointer; box-shadow: var(--aq-shadow-lg); transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease,\n    box-shadow 0.15s ease",
  "aq-devtools-toggle--bottom-left": "bottom: 1rem; left: 1rem",
  "aq-devtools-toggle--bottom-right": "right: 1rem; bottom: 1rem",
  "aq-devtools-toggle--top-left": "top: 1rem; left: 1rem",
  "aq-devtools-toggle--top-right": "top: 1rem; right: 1rem",
  "aq-devtools-toggle:focus-visible":
    "outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--aq-background), 0 0 0 4px var(--aq-ring)",
  "aq-devtools-toggle:hover":
    "transform: translateY(-1px); border-color: color-mix(in srgb, var(--aq-brand) 55%, var(--aq-border)); background: color-mix(in srgb, var(--aq-brand-muted) 65%, var(--aq-card))",
  "aq-devtools-tree":
    "border: 1px solid var(--aq-border); border-radius: calc(var(--aq-radius) - 2px); background: var(--aq-muted); padding: 0.625rem 0.75rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.75rem; line-height: 1.5",
  "aq-devtools-tree-branch": "margin-left: 0.125rem",
  "aq-devtools-tree-children":
    "margin-left: 0.875rem; padding-left: 0.625rem; border-left: 1px solid var(--aq-border)",
  "aq-devtools-tree-key": "color: var(--aq-brand); font-weight: 600",
  "aq-devtools-tree-meta": "color: var(--aq-muted-foreground); font-size: 0.6875rem",
  "aq-devtools-tree-row": "display: flex; align-items: baseline; gap: 0.5rem; padding: 0.125rem 0",
  "aq-devtools-tree-summary":
    "cursor: pointer; list-style: none; display: flex; align-items: baseline; gap: 0.375rem; padding: 0.125rem 0",
  "aq-devtools-tree-value": "color: var(--aq-foreground); word-break: break-word",
  "aq-devtools-tree-value--bigint": "color: var(--aq-warning-text)",
  "aq-devtools-tree-value--boolean": "color: var(--aq-pending)",
  "aq-devtools-tree-value--number": "color: var(--aq-warning-text)",
  "aq-devtools-tree-value--string": "color: var(--aq-success)",
};

export function paintClasses(element: HTMLElement, ...classes: string[]): void {
  const names = classes.filter(Boolean);
  element.className = names.join(" ");
  const styles: string[] = [];

  for (const name of names) {
    const style = UI_STYLES[name];
    if (style) {
      styles.push(style);
    }
  }

  for (let index = 0; index < names.length; index++) {
    for (let other = index + 1; other < names.length; other++) {
      const compound = `${names[index]}.${names[other]}`;
      const style = UI_STYLES[compound];
      if (style) {
        styles.push(style);
      }
    }
  }

  applyCssText(element, styles.join("; "));
}

/** Native `<select>` elements ignore padding unless appearance is reset. */
export function paintSelect(element: HTMLSelectElement, ...classes: string[]): void {
  paintClasses(element, ...classes);
  element.style.setProperty("appearance", "none");
  element.style.setProperty("-webkit-appearance", "none");
  element.style.setProperty("padding-left", "0.75rem");
  element.style.setProperty("padding-right", "2rem");
  element.style.setProperty("padding-top", "0.375rem");
  element.style.setProperty("padding-bottom", "0.375rem");
  element.style.setProperty("background-image", SELECT_CHEVRON);
  element.style.setProperty("background-repeat", "no-repeat");
  element.style.setProperty("background-position", "right 0.625rem center");
  element.style.setProperty("background-size", "0.75rem");
}
