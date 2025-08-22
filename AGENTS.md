# Repository Guidelines

This guide distills how to build, test, and contribute to Solar System 3D (Node.js + Parcel + Electron).

## Project Structure & Module Organization
- `public/`: Browser app entry (`index.html`, `main.js`, `styles.css`), assets (`textures/`), libraries.
- `src/`: Small shared utilities and unit tests (e.g., `coordinateParser.js`, `coordinateParser.test.js`).
- `dist/`: Build output (generated). Do not edit or commit local builds.
- `release/`: Packaged desktop builds from Electron Builder.
- `electron.js`, `electron-preload.js`: Electron app entry and preload.
- `server.js`: Dev web server (localhost:3022). `ELECTRON.md` has extra tips.
- `tools/commit_release.py`: Changelog + versioning workflow.

## Build, Test, and Development Commands
- `npm start`: Start dev server at `http://localhost:3022` (clears port via `prestart`).
- `npm run build`: Parcel build of `public/index.html` → `dist/` (version sync runs in `prebuild`).
- `npm run electron:start`: Build, wait for server, then launch Electron.
- `npm run electron-dev`: Run web server and Electron together for rapid iteration.
- `npm run dist`: Package desktop app to `release/` (Windows x64 by default).
- `npm test` | `npm run test:watch` | `npm run test:coverage`: Run Jest, watch mode, coverage.
- `npm run commit:patch|minor|major`: Generate changelog, bump version, and tag.

## Coding Style & Naming Conventions
- JavaScript: 2‑space indent; use `const`/`let`; include semicolons; camelCase for variables/functions; PascalCase for classes.
- Files: keep browser code in `public/`; shared utilities in `src/`; avoid deep nesting.
- No ESLint/Prettier configured—match the current style and keep diffs minimal.

## Testing Guidelines
- Framework: Jest. Co‑locate tests as `*.test.js` next to source (e.g., `src/coordinateParser.test.js`).
- Add tests for new features and bug fixes; focus on pure utilities (parsers, math) for reliable coverage.
- Run `npm test` before opening a PR; ensure `npm run test:coverage` shows no regressions in critical modules.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `build:`, `perf:`).
- Prefer `npm run commit:patch|minor|major` (backs `tools/commit_release.py`) to produce changelog entries and version bumps.
- PRs: include a clear summary, linked issues, screenshots/GIFs for visual changes, and test steps. Keep changes scoped and incremental.

## Security & Configuration Tips
- Don’t commit secrets. Packaging includes only `dist/` and listed files.
- Keep port `3022` free during dev; `npm run prestart` will clean it if stuck.
