# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning.

## Add a changeset

After making a user-facing change:

```bash
npm run changeset
```

Select the package(s), choose semver bump, and write a short summary.

## Release flow

1. Merge changesets to `master`.
2. GitHub Action **Release** opens a "Version Packages" PR (bumps versions + CHANGELOGs).
3. Merge that PR → packages publish to npm automatically (requires `NPM_TOKEN` secret).

Manual release:

```bash
npm run version
npm run release
```
