## Title

- Use Conventional Commits format — `type(scope): description`.
- No puts on body, only title.

## Summary

- Describe main change.
- Note affected package or area.
- Mention behavior change if user-facing.

## Test Plan

- [ ] `pnpm test`
- [ ] `pnpm run lint`
- [ ] `pnpm run typecheck` (when types changed)

## Checklist

- [ ] Conventional commit title
- [ ] Docs updated if behavior changed
- [ ] Changeset added if package change is user-facing
- [ ] No AI attribution
