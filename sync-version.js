#!/usr/bin/env node
/**
 * Version synchronization script
 * Automatically updates version.js when package.json version changes
 * Usage: npm run sync-version or node sync-version.js [version]
 */

const fs = require('fs');
const path = require('path');

function updateVersion(newVersion) {
    // Update package.json
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (newVersion) {
        packageJson.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`✓ Updated package.json to version ${newVersion}`);
    }

    // Update version.js
    const version = packageJson.version;
    const versionFileContent = `// Version configuration - single source of truth
// This file is auto-generated during build from package.json
export const VERSION = "${version}";`;

    const versionFilePath = path.join(__dirname, 'public', 'version.js');
    fs.writeFileSync(versionFilePath, versionFileContent);
    
    console.log(`✓ Updated version.js to version ${version}`);
    return version;
}

// Command line usage
if (require.main === module) {
    const newVersion = process.argv[2];
    if (newVersion) {
        console.log(`Setting version to ${newVersion}...`);
        updateVersion(newVersion);
        console.log(`✓ Version synchronization complete!`);
        console.log(`Next steps: npm run build && pm2 restart solarsystem`);
    } else {
        console.log('Synchronizing version from package.json...');
        const currentVersion = updateVersion();
        console.log(`✓ Current version: ${currentVersion}`);
    }
}

module.exports = { updateVersion };