# Interactive Solar System

This is a simple interactive 3D solar system visualization for kids, built with Node.js, Express, and three.js.

## Version

1.1.31

Notes:
- The visible footer version on the page is sourced from `public/version.js`, which is kept in sync with `package.json`.
- `npm run build` (via Parcel) bundles assets into `dist/`, which the server serves.

## Features

*   **Latest Features (v1.1.31)**:
    *   **Help Panel Visibility**: Clicking Help now opens a styled panel; CSS (`#help-panel.visible`) aligns with the existing JS toggles.
    *   **Loading Overlay Styling**: Full-screen overlay includes a panel background, border, and subtle step animation for readability.
    *   **Footer Version Visibility**: Footer (version) is fixed-position with z-index and background so it renders above the canvas.
    *   **Docs**: Clarified these changes in the changelog and README.

## Troubleshooting

- Dist is empty or server shows HTML as module error: run `npm run build` after cleaning `dist`.
- Port 3022 in use when starting server: run `npm run prestart` or stop the conflicting process, then `npm start`.
- Node not found or npm missing: install Node.js LTS and ensure `node`/`npm` are on PATH.

## Release Tools

### tools/commit_release.py
- Purpose: generates CHANGELOG and README “Latest changes” from recent commits, optional AI summary, optional semver bump/tag, and optional push via `tools/sync_repos.py`.
- Key flags:
  - `--bump major|minor|patch|none`: bump `package.json` version (default: none).
  - `--tag`: create git tag `vX.Y.Z` after a successful bump+commit.
  - `--since <ref>`: start range (default: last tag or initial commit).
  - `--allow-dirty`: skip clean worktree check.
  - `--summarize` (+ OpenAI-compatible options): add an AI summary block.
- `--push`, `--push-private`, `--push-public`: call `tools/sync_repos.py` after committing.
  - `--public-mode cherry-pick|snapshot`: how the public repo is updated (default: cherry-pick last commit only).
- `--sync-script`: path to the sync script (default: `tools/sync_repos.py`).
- `--sync-verbose`: pass `--verbose` to the sync script.

Interactive dirty worktree
- If the working tree has uncommitted changes and you did not pass `--allow-dirty`, the script detects an interactive TTY and offers to stage and commit for you.
- Prompt flow: “Stage all changes and create a commit now? [y/N]” → asks for a commit message (default: `chore: checkpoint before release`) → runs `git add -A` and `git commit -m` → continues.
- To bypass the prompt: clean your worktree first or pass `--allow-dirty`.
- Examples:
  - Update docs only from last tag: `python tools/commit_release.py`
  - Bump patch, tag, and push to both remotes: `python tools/commit_release.py --bump patch --tag --push --sync-verbose`
  - Use snapshot mode on public: `python tools/commit_release.py --push --public-mode snapshot`

#### AI Summary (--summarize)
This script can append a short, AI‑generated summary of recent changes to both `CHANGELOG.md` and the README’s latest section. It uses any OpenAI‑compatible `/chat/completions` API.

- Enable: add `--summarize` to your command. Soft‑fail: if keys are missing or the API errors, the summary is skipped.
- Model and tokens: `--summary-model <name>` (default from `OPENAI_SUMMARY_MODEL` or `gpt-5`), `--summary-max-tokens <int>` (default 400).
- Endpoint and key precedence:
  1) `OPENAI_API_KEY` with `OPENAI_BASE_URL` (defaults to `https://api.openai.com/v1`).
  2) `OPENROUTER_API_KEY` (base auto: `https://openrouter.ai/api/v1`).
  3) `GROQ_API_KEY` (base auto: `https://api.groq.com/openai/v1`).
  4) `AZURE_OPENAI_API_KEY` (requires an OpenAI‑compatible gateway; set `--summary-base-url`).
  5) `OLLAMA_API_KEY` (any value) for local Ollama; base auto: `http://localhost:11434/v1`.

Examples
```bash
# Default OpenAI-compatible (set your key once in the shell)
export OPENAI_API_KEY=sk-... && python tools/commit_release.py --summarize

# Specify model explicitly
python tools/commit_release.py --summarize --summary-model gpt-4o-mini

# OpenRouter
export OPENROUTER_API_KEY=or-... && python tools/commit_release.py --summarize

# Groq
export GROQ_API_KEY=groq-... && python tools/commit_release.py --summarize

# Ollama (local, no network)
export OLLAMA_API_KEY=ollama && python tools/commit_release.py --summarize

# Custom base URL + API key (e.g., self-hosted gateway)
python tools/commit_release.py --summarize \
  --summary-base-url https://my-gateway.example.com/v1 \
  --summary-api-key $MY_KEY --summary-model my-model
```

LM Studio (Local Server)
1) Install LM Studio and open the Local Server panel. Start the server and select/download a model. Note the port (default: 1234).
2) Run the release script pointing at LM Studio’s OpenAI‑compatible endpoint:
```bash
# Any non-empty key is accepted; adjust port if changed
python tools/commit_release.py --summarize \
  --summary-base-url http://localhost:1234/v1 \
  --summary-api-key lm-studio \
  --summary-model local
```
Tips
- In LM Studio, copy the served model ID (if shown) and pass it via `--summary-model`.
- If LM Studio ignores `model`, any short placeholder (e.g., `local`) is fine.
- Keep `--summary-max-tokens` modest (e.g., 200–400) for faster local responses.

Notes
- The API must accept `Authorization: Bearer <key>` and the OpenAI `/chat/completions` schema.
- For Azure OpenAI, use a compatibility gateway or proxy that translates to Azure’s headers/paths; direct Azure endpoints are not supported out‑of‑the‑box by this script.

### tools/sync_repos.py
- Purpose: pushes full history to the private remote, and updates the public remote without exposing full history.
- Public update modes:
  - `cherry-pick` (default): cherry-picks only the latest local commit onto public’s tip.
  - `snapshot`: force replaces public with a single-commit snapshot of the current tree.
- Tagging: after a public update, automatically creates/pushes tag `v<version>` (read from `package.json`). This keeps the in‑app version link valid.
- Logging: prints to console and appends to `sync_repos.log`. With `--verbose`, echoes each git command plus stdout/stderr.
- Important behavior:
  - Uses a temporary worktree for cherry-pick; does not switch your working branch.
  - Uses fully qualified refspecs (e.g., `refs/heads/main`) for reliable pushes.
  - If the public branch doesn’t exist, initializes it with a snapshot and then tags it.
- Key flags:
  - `--private-remote`, `--public-remote` (or `--private-url`, `--public-url` to add remotes).
  - `--public-branch` (default: `main`).
  - `--public-mode cherry-pick|snapshot` (default: cherry-pick).
  - `--verbose` for detailed logging.
- Examples:
  - Use configured remotes: `python tools/sync_repos.py --private-remote private --public-remote public --verbose`
  - With URLs (adds remotes if missing):
    `python tools/sync_repos.py --private-url https://github.com/vcsoc/solarsystem --public-url https://github.com/vcsoc/solar-system --verbose`
  - Force snapshot: `python tools/sync_repos.py --public-mode snapshot --verbose`

### Version Link and Tags
- The footer version link points to Releases tag: `https://github.com/vcsoc/solar-system/releases/tag/v<version>`.
- The sync script pushes the `v<version>` tag to the public repo so the link resolves. If pushing manually, ensure you tag the public tip:
  - `git fetch public main && git tag -a v<version> FETCH_HEAD -m "Release v<version>" && git push public v<version>`

## Settings
- Enable Coords: In the Settings modal, toggling “Enable Coords” shows/hides the bottom-right coordinates HUD and the entire Bookmarks UI. Disabled by default and persisted in `localStorage` (key: `appSettings`).
*   **Latest Features (v1.1.5)**:
    *   **Semi-transparent Left Panel**: The left side panel now has a semi-transparent background for improved visual integration.
*   **Latest Features (v1.1.4)**:
    *   **Copy Coordinates**: Added a copy icon next to the coordinate display to easily copy the current camera coordinates (x, y, z, d) to the clipboard.
*   **Other Changes (v1.1.4)**:
    *   Removed duplicate `setupEventListeners` and `parseCoordinateInput` functions from `main.js`.
*   **Latest Features (v1.1.3)**:
    *   **Measurement Tool**: Users can measure the distance between two points in the 3D space.
    *   **Starfield Toggle**: A setting to show or hide the starfield background.
    *   **Granular Label Control**: Separate settings to control the visibility of planet and moon names.
    *   **Crosshair Customization**: Users can now customize the style and color of the crosshair.
    *   **Enhanced Zoom Indicator**: The zoom indicator now displays the camera's coordinates, zoom level, and the current scale.
    *   **Consolidated Coordinate Input**: The coordinate input fields have been consolidated into a single field, allowing users to input coordinates in various formats.

*   **Navigation & Interaction**:
    *   **Collapsible Bookmarks Panel**: The bookmarks section in the left panel is now grouped into a collapsible panel, collapsed by default, to improve UI organization.
    *   **Bookmarks**: Users can now save and load camera positions as bookmarks.
    *   **Manual Camera Positioning**: Users can now manually enter coordinates and distance to move the camera.
    *   **Set Default Start Position**: A bookmark can be set as the default starting position.
    *   **Keyboard Navigation**: Use `W,A,S,D` or `Arrow Keys` to move the camera.
    *   **Adjustable Movement Speed**: Control the speed of keyboard navigation.
    *   **Configurable Travel Speed**: Adjust the travel speed for measurements.
    *   **Interactive 3D Solar System:** Explore the planets and the sun in a 3D environment.
    *   **Planet Information:** Click on a planet to learn more about it.
    *   **Go To Planet**: Smoothly navigate to a selected celestial body with an optimal zoom level.

*   **Visuals & Display**:
    *   **Camera Direction Tracking**: Added a new coordinate to track the direction the user is looking, similar to North, East, West, South, and an angle for accuracy in the virtualized space.
    *   **Collapsible Sliders Panel**: All sliders in the left panel are now grouped into a collapsible panel, collapsed by default, to improve UI organization.
    *   **Realistic and Kid-Friendly Modes:** Switch between realistic and scaled views of the solar system.
    *   **Toggle Orbits and Labels:** Show or hide the planet orbits and labels.
    *   **Crosshair:** A crosshair to help with navigation and targeting.
    *   **Show All Names Toggle:** A toggle switch to control the visibility of all planet and moon names.
    *   **Enhanced Sun Visual Control**: Control sun intensity, affecting both lighting and visual brightness.
    *   **Sun Rotation Animation**: Realistic sun rotation animation.
    *   **Moon System**: Comprehensive moon system with realistic orbital periods and distances.
    *   **Advanced Shadow System**: Realistic moon shadow effects (eclipses).
    *   **Enhanced Graphics**: Texture support for all planets, shadow casting/receiving, improved material properties, emissive sun.

*   **Modals & UI**:
    *   **Responsive Modals**: All modal windows are now responsive, ensuring a better user experience on mobile devices.
    *   **Portrait Mode Comparison**: The comparison image generated on mobile devices will now correctly swap width and height to match the device's portrait orientation.
    *   **Comparison Image Generation**: The comparison image generated on mobile devices will now correctly swap width and height to match the device's portrait orientation, if the user's settings were for a landscape image.
    *   **Collapsible Side Panel**: The side panel is now collapsible on mobile devices to provide a better viewing experience of the solar system.
    *   **Fullscreen Comparison Modal**: Expands the comparison image in the modal to fill the entire browser window.
    *   **Comparison Mode**: Compare two celestial bodies side-by-side with detailed information.

*   **Utilities**:
    *   **Coordinate Format Update**: The coordinate display and input now include direction (n) in the format `x:X y:Y z:Z d:D n:COMPASS.ANGLE`. When using the 'Go to Position' input, you can specify the camera's target (x, y, z), distance (d), and the direction (n) from which the camera views the target. For example, `x:100 y:50 z:200 d:500 n:N.0` would position the camera 500 units south of (100, 50, 200) and make it look North towards that point.
    *   **Playback Controls:** Pause, play, and control the speed of the simulation.
    *   **Save Current View**: Capture the current 3D view as a high-quality PNG image.
    *   **Loading Screen**: Displays a loading modal with progress until all 3D assets are loaded.
    *   **Persistent Settings**: All user-configurable settings are permanently persisted using `localStorage`.
    *   **Granular Console Output Control**: Individual toggle buttons in settings for `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug`.


## Getting Started

### Prerequisites

*   Node.js (version 16 or higher)
*   npm

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/interactive-solar-system.git
    ```

2.  Navigate to the project directory:

    ```bash
    cd interactive-solar-system
    ```

3.  Install the dependencies:

    ```bash
    npm install
    ```

### Running the Application

1.  Start the server:

    ```bash
    npm start
    ```

2.  Open your browser and navigate to `http://localhost:3022`.

### Building for Production

To create a production-ready build with optimized and hashed assets (for cache busting), use Parcel:

```bash
npm run build
```

This will generate the optimized files in the `dist` directory.

## How to Use

*   **Navigation**:
    *   **Drag** with your mouse to rotate the camera around the solar system.
    *   **Scroll** with your mouse wheel to zoom in and out.
    *   **Keyboard Movement**: Use `W`, `A`, `S`, `D` keys or `Arrow Keys` to move the camera forward, left, backward, and right relative to its current orientation. Adjust movement speed using the "Movement Speed" slider in the settings.
*   **Interacting with Celestial Bodies**:
    *   **Click** on any planet or moon to view detailed information about it.
    *   **Go To**: Use the "Go To" button in the information panel to smoothly navigate to a selected celestial body, with an optimal zoom level.
*   **Controls and Settings**:
    *   **Playback Controls**: Use the controls (play, pause, speed) in the top-left corner to manage the simulation's animation.
    *   **Toggle Orbits and Labels**: Use the respective toggles to show or hide planetary orbits and names/labels for all celestial bodies.
    *   **Sun Intensity**: Adjust the "Sun Intensity" slider to control the sun's visual brightness and the overall scene lighting.
    *   **Comparison Mode**:
        1.  `CTRL` + `Left-click` on a celestial body to open the context menu.
        2.  Select "Select for Compare" for the first object.
        3.  `CTRL` + `Left-click` on a second celestial body and select "Compare with Selected".
        4.  A modal will appear displaying both objects side-by-side, rendered to scale, with detailed information.
        5.  Use the "Fullscreen" button to expand the comparison modal to fill your browser window.
        6.  Use the "Save Image" button to download the comparison view as a PNG.
    *   **Save Current View**: Click the "Save Image" button in the top-right corner to capture your current 3D view as a high-quality PNG file.
    *   **Persistent Settings**: All your chosen settings (animation state, orbit speed, sun intensity, etc.) are automatically saved and will be restored the next time you visit the site.
    *   **Console Output Control**: In the settings, you can individually toggle `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug` outputs to both the browser's developer console and the custom in-app terminal.

## Changelog

For a detailed list of changes, please see the [changelog.md](changelog.md) file.

## Project Structure

*   `server.js`: The Express server that serves the application.
*   `public/`: The directory containing the front-end files.
    *   `index.html`: The main HTML file.
    *   `main.js`: The JavaScript file that contains the three.js code.
    *   `styles.css`: The CSS file for styling the application.
*   `package.json`: The file that contains the project metadata and dependencies.
*   `readme.md`: This file.

## Latest changes

<!-- LATEST-CHANGES-START -->
### Features
- feat: link version to public Releases tag; sync script auto-tags public v<version> after push (Chris Visser, 923c47b)
- feat: Add semi-transparent background to left panel (Chris Visser, 9a17a53)

### Docs
- docs: add troubleshooting and clarify v1.1.31 behavior in changelog and README (Chris Visser, 89e5c3b)
- docs: refine v1.1.31 notes in changelog and README (Chris Visser, a08549d)
- docs: Update readme.md with latest version (Chris Visser, b3d5b51)

### Chores
- chore: checkpoint before release (Chris Visser, 590f448)
- chore(release): 2025-08-22, bump version to 1.1.39 (Chris Visser, 7ff748d)
- chore(release): 2025-08-22, bump version to 1.1.38 (Chris Visser, 96ad672)
- chore(release): 2025-08-22, bump version to 1.1.37 (Chris Visser, be7f4ff)
- chore(release): 2025-08-22, bump version to 1.1.36 (Chris Visser, aef786d)
- chore(release): 2025-08-22, bump version to 1.1.35 (Chris Visser, 79066f0)
- chore(release): 2025-08-22, bump version to 1.1.34 (Chris Visser, b8910bd)
- chore: checkpoint before release (Chris Visser, 8b93f35)
- chore(release): 2025-08-22, bump version to 1.1.33 (Chris Visser, 60b5735)
- chore: checkpoint before release (Chris Visser, 2223ac9)
- chore: checkpoint before release (Chris Visser, 2d3ccfa)
- chore(sync): log to sync_repos.log and console; fix push refspec to refs/heads/<branch> (Chris Visser, 3c46898)
- chore(sync): add --verbose flag and command tracing (Chris Visser, 44828b0)
- chore(sync): replace script on main with v4 (public cherry-pick via worktree + snapshot fallback) (Chris Visser, 48159f3)
- chore: bump to v1.1.31; fix UI\n\n- Help: add #help-panel.visible so Help link opens panel\n- Loading: add panel styling + step animation for overlay\n- Footer: make version footer fixed, visible over canvas\n\nDocs: update changelog and readme for v1.1.31\n (Chris Visser, d8035e1)

### Other
- Added setting for context-menu hold-down delay (Chris Visser, 7d14fe8)
- fixed go-to button width (Chris Visser, e83423c)
- Made coords optional (Chris Visser, 41be943)
- bug fixes (Chris Visser, 9b12f0a)
- WIP before running release script (Chris Visser, 54263d3)
- WIP before running release script (Chris Visser, 8db678d)
- Updated .gitignore (Chris Visser, 157e3d8)
- Added version on build. Bug fixes (Chris Visser, bf07e15)
<!-- LATEST-CHANGES-END -->










