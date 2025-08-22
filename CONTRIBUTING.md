# Contributing

Thanks for helping improve Solar System 3D! This short guide explains how to set up, make changes, and open a pull request.

## Quick Start
- Clone and install: `git clone <repo>` then `npm install`.
- Dev server: `npm start` (http://localhost:3022). Electron: `npm run electron-dev`.
- Build: `npm run build` (output in `dist/`).

## Branching & Commits
- Branch names: `feat/<short-topic>`, `fix/<short-topic>`, or `chore/<topic>`.
- Use Conventional Commits: `feat: add orbit speed control`, `fix(renderer): correct aspect ratio`.
- Keep commits small and focused.

## Coding & Tests
- Follow style/naming in AGENTS.md (2‑space indent, semicolons, camelCase; keep browser code in `public/`, shared utils in `src/`).
- Add/adjust unit tests next to code as `*.test.js` (Jest).
- Run locally: `npm test`, `npm run test:coverage`, and `npm run build`.

## Pull Requests
- Use the PR template (auto‑included). Provide a clear summary, linked issues, screenshots/GIFs for UI changes, and a test plan.
- Ensure no generated `dist/` files are committed.
- For release PRs, maintainers will handle version + changelog via `npm run commit:patch|minor|major`.

## Reference
- Contributor guide: see `AGENTS.md` for project structure, commands, and conventions.
- Electron tips: `ELECTRON.md`.
