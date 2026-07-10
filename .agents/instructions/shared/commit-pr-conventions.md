---
description: 'Commit and PR conventions for @ailuracode/alpinejs-toolkit contributions.'
---

# Commit & PR Conventions

## Commit subject

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

- `type` ∈ {`feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `revert`, `release`}
- `scope` is the package or area affected, kebab-case. For package-local changes use the package short name: `theme`, `core`, `media`, `debug`. For repo-wide: `repo`, `docs`, `ci`, `conventions`, `tooling`.
- `description` ≤ 72 chars, imperative mood, no trailing period.

## Commit body

Body is optional. When present:

- One blank line after the subject.
- Wrap lines at **72 chars**.
- Explain WHY, not WHAT. The diff already shows WHAT.

```
feat(theme): add cross-tab sync via storage event

Previously a theme change in one tab required a page reload
to propagate. The default localStorage adapter already supports
a `subscribe()` hook that wires `storage` events, but the theme
manager did not pick it up. Connect the manager to the
subscribe hook so multi-tab stays consistent.
```

## Breaking changes

Use a footer separated by a blank line:

```
feat(theme)!: rename `set` argument from value to preference

BREAKING CHANGE: `theme.set('dark')` is now `theme.set({ preference: 'dark' })`.
The previous one-argument form is removed; consumers must migrate.
```

`!` after the type signals a breaking change. The `BREAKING CHANGE:` footer is mandatory when `!` is used.

## Co-authorship

AI attribution is **PROHIBITED in commit messages**. Specifically:

- Never include `Co-Authored-By: ... <AI product name>` trailers.
- Never add `Generated with ...` trailers.

The author is the human who reviewed and pushed the change. Tools are tools.

## PR title

The PR title MUST match the commit subject format. After squash and merge, the PR title becomes the commit on `main`.

## PR description

Use `.github/pull_request_template.md`. Sections:

- `## Summary` — what changed and why.
- `## Testing` — what you ran, what passes.
- `## Changeset` — link to the `.changeset/*.md` you added.
- `## Breaking changes` — if any, link the ADR or expand on the migration.

CI enforces all four sections present.

## Changesets

Required for any consumer-observable change. Add under `.changeset/<kebab-title>.md`:

```md
---
'@ailuracode/alpine-theme': minor
---

Add cross-tab sync via storage event. Existing localStorage adapter now subscribes automatically; no API change.
```

Run `bunx changeset` to scaffold. Versions are managed by changesets, NOT edited manually.
