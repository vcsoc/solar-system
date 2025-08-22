const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;

// Create/update version.js file
const versionFileContent = `// Version configuration - single source of truth
// This file is auto-generated during build from package.json
export const VERSION = "${version}";`;

fs.writeFileSync(path.join(__dirname, 'public', 'version.js'), versionFileContent);

console.log(`✓ Updated version.js to version ${version}`);