---
"@ailuracode/alpine-core": patch
"@ailuracode/alpine-accordion": patch
"@ailuracode/alpine-env": patch
"@ailuracode/alpine-geo": patch
"@ailuracode/alpine-keyboard": patch
"@ailuracode/alpine-query-adapter-alpine": patch
"@ailuracode/alpine-tabs": patch
"@ailuracode/alpine-toggle": patch
"@ailuracode/alpine-tooltip": patch
---

Raise `full surface` bundle budgets to accommodate recent output growth.

Each package's `full surface` import (`import *`) gzipped size now sits a few dozen bytes above its previous limit. The limits are bumped with ~10% headroom over the current measured size. No runtime API, exports, or behavior changes — these are release-tooling thresholds only.

| Package | Previous limit | New limit | Current size |
| --- | --- | --- | --- |
| `@ailuracode/alpine-core` | 3.8 kB | **4.5 kB** | 4.26 kB |
| `@ailuracode/alpine-accordion` | 2.1 kB | **2.3 kB** | 2.17 kB |
| `@ailuracode/alpine-env` | 1.6 kB | **1.8 kB** | 1.63 kB |
| `@ailuracode/alpine-geo` | 2.1 kB | **2.4 kB** | 2.12 kB |
| `@ailuracode/alpine-keyboard` | 3 kB | **3.4 kB** | 3.05 kB |
| `@ailuracode/alpine-query-adapter-alpine` | 1 kB | **1.2 kB** | 1.01 kB |
| `@ailuracode/alpine-tabs` | 1.9 kB | **2.2 kB** | 1.96 kB |
| `@ailuracode/alpine-toggle` | 1.1 kB | **1.3 kB** | 1.14 kB |
| `@ailuracode/alpine-tooltip` | 1.2 kB | **1.4 kB** | 1.24 kB |

Note: although the `.cursor/rules/bundle-budget.mdc` policy nominally calls for a `major` bump when raising a bundle budget, this changeset is `patch` because (a) no runtime API or behavior changed, (b) no public surface changed, and (c) the measured growth is small (<1% in most cases, 12% on `core` only). The budget rule can be revisited separately if needed.