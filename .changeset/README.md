# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning.

## Add a changeset

After making a user-facing change:

```bash
pnpm run changeset
```

Select the package(s), choose semver bump, and write a short summary.

## Release flow

1. Open a PR with your changes and a changeset (`.changeset/*.md`).
2. On push, the **Release** workflow applies pending changesets on the **same PR branch** (bumps versions + CHANGELOGs) and pushes the commit back only when versions actually change. No separate "Version Packages" PR is created.
3. Merge the PR to `master` once CI passes (the PR already includes version bumps).
4. The push to `master` triggers **Release** again. With no pending changesets left, only unpublished package versions are published to npm (`NPM_TOKEN` required).

Manual release:

```bash
pnpm run version
pnpm run release
```
