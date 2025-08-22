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
