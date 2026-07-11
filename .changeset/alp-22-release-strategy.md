---
"@ailuracode/alpinejs-toolkit": patch
---

Adopt a single **manual publishing** release strategy (ALP-22).

- Removed the `publish:ci` script from the root `package.json`.
- Rewrote the README "Versioning & release" section to describe the manual flow only (versioning → changelog → npm publish → provenance → failure recovery) and removed the claim that GitHub Actions versions/publishes automatically with `NPM_TOKEN`.
- Updated `.changeset/README.md` to a manual release flow (no Release workflow).
- Clarified `ci.yml` and `scripts/changeset-check.mjs` comments: CI validates only and never publishes.

CI and release permissions are now explicitly separated; only a maintainer with npm 2FA and `@ailuracode` scope access can publish via `pnpm run release`.
