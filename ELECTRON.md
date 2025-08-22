# Solar System 3D - Desktop Application

This application can now be run as a desktop application using Electron!

## Development

### Prerequisites
Make sure you have Node.js installed, then install dependencies:
```bash
npm install
```

### Running the Desktop App
1. **Build the web application first:**
   ```bash
   npm run build
   ```

2. **Launch the Electron app:**
   ```bash
   npm run electron
   ```

3. **For development with auto-rebuild:**
   ```bash
   npm run electron-dev
   ```

## Building Distributables

### Build for current platform:
```bash
npm run dist
```

### Build installers:
```bash
npm run build-electron
```

This will create installers in the `release/` directory for your current platform:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` installer  
- **Linux**: `.AppImage` file

## Features

### Desktop-Specific Features:
- **Native Menus**: File, View, Help menus with keyboard shortcuts
- **Fullscreen Mode**: F11 (Windows/Linux) or Ctrl+Cmd+F (macOS)
- **Zoom Controls**: Ctrl/Cmd + Plus/Minus
- **Developer Tools**: Ctrl+Shift+I (Windows/Linux) or Alt+Cmd+I (macOS)
- **Window Management**: Minimize, maximize, close with native controls

### Keyboard Shortcuts:
- `Ctrl/Cmd + S`: Save current view as image
- `Ctrl/Cmd + R`: Reload application
- `Ctrl/Cmd + Shift + R`: Force reload (clear cache)
- `Ctrl/Cmd + 0`: Reset zoom to actual size
- `Ctrl/Cmd + Plus`: Zoom in
- `Ctrl/Cmd + Minus`: Zoom out
- `F11` (Windows/Linux) / `Ctrl+Cmd+F` (macOS): Toggle fullscreen
- `Ctrl/Cmd + Shift + I`: Toggle developer tools

### Security:
- Context isolation enabled
- Node integration disabled
- Web security enabled
- External links open in default browser

## File Structure

```
├── electron.js           # Main Electron process
├── electron-preload.js   # Preload script for security
├── dist/                 # Built web application
├── release/              # Built desktop applications
└── package.json          # Electron configuration
```

## Troubleshooting

### App won't start:
1. Make sure you've run `npm run build` first
2. Check that `dist/index.html` exists
3. Try `npm run electron-dev` for debugging

### Build fails:
1. Ensure all dependencies are installed: `npm install`
2. Clear cache: `rm -rf node_modules/.cache`
3. Rebuild: `npm run build && npm run electron`

### Distribution issues:
1. Make sure electron-builder is installed: `npm install -g electron-builder`
2. Check the `build` section in `package.json`
3. Ensure all required files are included in the `files` array

## Platform Notes

### Windows:
- Creates NSIS installer
- Supports auto-updater
- Desktop shortcuts created automatically

### macOS:
- Creates DMG installer
- App signing may be required for distribution
- Gatekeeper compatibility

### Linux:
- Creates AppImage (portable executable)
- No installation required
- Works on most Linux distributions