---
"@ailuracode/alpine-command": minor
---

Evolve the command palette with search ranking, aliases, dynamic predicates, nested pages, async loading/execution, persistence hooks, and headless ARIA helpers.

- `register()` now returns an unregister callback
- `filteredItems` includes disabled commands; keyboard execution skips them
- `filter` is deprecated in favor of `rank` or `searchStrategy`
