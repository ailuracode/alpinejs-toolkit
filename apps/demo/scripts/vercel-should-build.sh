#!/usr/bin/env bash
# Exit 0 → skip Vercel build. Exit 1 → proceed with build.
set -euo pipefail

resolve_base_ref() {
  if [ -n "${VERCEL_GIT_PREVIOUS_SHA:-}" ] && [ "${VERCEL_GIT_PREVIOUS_SHA}" != "undefined" ]; then
    printf '%s\n' "${VERCEL_GIT_PREVIOUS_SHA}"
    return 0
  fi

  for branch in master main; do
    git fetch origin "${branch}" --depth=1 2>/dev/null || continue
    if git rev-parse "origin/${branch}" >/dev/null 2>&1; then
      git merge-base HEAD "origin/${branch}"
      return 0
    fi
  done

  git rev-parse HEAD^ 2>/dev/null || printf 'HEAD\n'
}

BASE_REF="$(resolve_base_ref)"

CHANGED="$(
  git diff --name-only "${BASE_REF}" HEAD -- \
    apps/demo \
    packages \
    pnpm-lock.yaml \
    pnpm-workspace.yaml \
    package.json \
    2>/dev/null \
    | grep -vE '(^|/)README\.md$|(^|/)CHANGELOG\.md$|/test/|(^|/)\.changeset/|^docs/|^\.github/|^\.cursor/|^AGENTS\.md$' \
    || true
)"

if [ -z "${CHANGED}" ]; then
  printf 'No demo-affecting changes detected. Skipping Vercel build.\n'
  exit 0
fi

printf 'Demo-affecting changes detected:\n%s\n' "${CHANGED}"
exit 1
