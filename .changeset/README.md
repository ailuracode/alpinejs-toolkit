# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning.

## Add a changeset

After making a user-facing change:

```bash
pnpm run changeset
```

Select the package(s), choose semver bump, and write a short summary.

## Release flow (manual)

This repository publishes **manually**. CI only validates PRs; it never versions or publishes. A maintainer runs the release locally:

1. Open a PR with your changes and a changeset (`.changeset/*.md`).
2. Once the PR is approved and CI passes, merge to `master`.
3. On `master`, a maintainer runs `pnpm run version` to apply pending changesets (bumps versions + CHANGELOGs) and commits the bump.
4. The same maintainer runs `pnpm run release` (build + test + `changeset publish`). This requires npm 2FA and access to the `@ailuracode` scope — `npm login` first.

CI does not have an `NPM_TOKEN` and cannot publish. Only unpublished package versions are published on each release.
