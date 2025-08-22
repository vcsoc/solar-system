# Pull Request Checklist

## Summary
- What does this change do and why?

## Linked Issues
- Closes #123 (replace with real issue IDs)

## Changes
- Type: feat | fix | docs | refactor | test | chore | build | ci | perf
- Scope: brief area (e.g., renderer, parser, styles)
- Breaking changes: yes/no (describe migration if yes)

## Screenshots / GIFs (if UI)
- Drag images here to help reviewers.

## Test Plan
- Commands run:
  - `npm test`
  - `npm run build`
  - Optional: `npm run electron-dev` or `npm run dist`
- Manual steps to verify:
  - Step 1 …
  - Step 2 …

## Checklist
- [ ] Follows repository style (2-space indent, semicolons, camelCase).
- [ ] Code lives in the right place (`public/` for browser, `src/` for shared utils).
- [ ] Unit tests added/updated for logic changes (`*.test.js`).
- [ ] `npm test` passes locally (and CI, if applicable).
- [ ] `npm run build` succeeds; no stray changes in `dist/` committed.
- [ ] Updated docs if behavior is user-visible (README, ELECTRON.md as needed).
- [ ] If releasing, used `npm run commit:patch|minor|major` to update changelog/version.

## Notes for Reviewers
- Call out any tricky areas, trade-offs, or follow-ups.
