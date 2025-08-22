import * as THREE from './lib/three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { VERSION } from './version.js';

let loadingSteps = [];
function updateLoadingStep(step) {
    const loadingStepsElement = document.getElementById('loading-steps');
    if (loadingStepsElement) {
        // Add the new step to the beginning of the array
        loadingSteps.unshift(step);
        // Keep only the last 3 steps
        if (loadingSteps.length > 3) {
            loadingSteps.pop();
        }
        // Clear the loading steps element
        loadingStepsElement.innerHTML = '';
        // Render the loading steps
        loadingSteps.forEach((s, index) => {
            const stepElement = document.createElement('div');
            stepElement.textContent = s;
            // Add a class to the new step for animation
            if (index === 0) {
                stepElement.classList.add('new-step');
            }
            loadingStepsElement.appendChild(stepElement);
        });
    }
}


// ======== START ========>

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const crosshairCanvas = document.getElementById('crosshair-canvas');
const crosshairCtx = crosshairCanvas.getContext('2d');
crosshairCanvas.width = window.innerWidth;
crosshairCanvas.height = window.innerHeight;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

document.getElementById('scene-container').appendChild(renderer.domElement);
renderer.domElement.tabIndex = 0; // Make canvas focusable
renderer.domElement.focus(); // Focus canvas on load
console.debug('renderer.domElement:', renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = true; // Re-enable OrbitControls
controls.enableDamping = false;
controls.dampingFactor = 0;
controls.minDistance = 10;
controls.maxDistance = 80000;
controls.enablePan = true; // Re-enable panning
controls.enableZoom = true; // Re-enable zooming
console.debug('Controls initialized:', controls);

camera.position.set(0, 1418, 3308);
controls.update();

// Set the application version in the UI
document.getElementById('app-version').textContent = `v${VERSION}`;
document.getElementById('app-version-link').href = `https://github.com/vcsoc/solar-system/tree/v${VERSION}`;

// ======== LIGHTING ========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1.5, 0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 2048;
pointLight.shadow.mapSize.height = 2048;
pointLight.shadow.camera.far = 80000;
pointLight.shadow.bias = -0.001;
scene.add(pointLight);

// ======== DATA ========
const SCALE_FACTOR = 100000;
const AU = 1500; // Astronomical Unit in scene units. 1 AU is the distance from the Sun to Earth.
const textureHost = 'textures/';

// Global Application Settings
const appSettings = {
    // Console settings
    console: {
        enableCustomConsole: false,
        log: true,
        info: true,
        warn: true,
        error: true,
        debug: true,
    },
    // UI and animation settings
    isAnimationPaused: false,
    orbitSpeedMultiplier: 1.0,
    sunIntensity: 1.5,
    orbitOpacity: 0.4,
    starDensity: 0.7,
    areLabelsVisible: false,
    showPlanetNames: true,
    showMoonNames: true,
    movementKeys: 'wasd',
    travelSpeedKmh: 10000,
    compareImageWidth: 1920,
    compareImageHeight: 1080,
    showBackgroundStars: true,
    enableKeyboardMovement: true, // New setting for keyboard movement
    crosshairStyle: 'none', // New setting for crosshair style
    crosshairColor: '#FFFFFF', // New setting for crosshair color
};

function showNotification(message, duration = 1500, type = 'info') {
    // Also output to console for debugging
    const consoleMessage = `[Notification] ${message}`;
    switch (type) {
        case 'error':
        case 'fail':
        case 'failed':
            console.warn(consoleMessage);
            break;
        case 'success':
        case 'saved':
        case 'copied':
            console.info(consoleMessage);
            break;
        case 'warning':
        case 'warn':
            console.warn(consoleMessage);
            break;
        default:
            console.info(consoleMessage);
    }

    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger reflow to ensure transition plays
    void notification.offsetWidth;

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        }, { once: true });
    }, duration);
}

// Store original console methods
const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
};

const customTerminal = document.getElementById('custom-terminal');

function saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
        const loaded = JSON.parse(savedSettings);
        // Merge loaded settings, ensuring new properties are not lost
        Object.assign(appSettings.console, loaded.console);
        Object.assign(appSettings, loaded);
    }

    // Apply console settings
    document.getElementById('toggle-custom-console').checked = appSettings.console.enableCustomConsole;
    document.getElementById('toggle-console-log').checked = appSettings.console.log;
    document.getElementById('toggle-console-info').checked = appSettings.console.info;
    document.getElementById('toggle-console-warn').checked = appSettings.console.warn;
    document.getElementById('toggle-console-error').checked = appSettings.console.error;
    document.getElementById('toggle-console-debug').checked = appSettings.console.debug;
    customTerminal.style.display = appSettings.console.enableCustomConsole ? 'block' : 'none';

    // Apply other settings to UI and application state
    appSettings.isAnimationPaused = appSettings.isAnimationPaused;
    document.getElementById('toggle-animation').textContent = appSettings.isAnimationPaused ? 'Play Animation' : 'Pause Animation';

    appSettings.orbitSpeedMultiplier = appSettings.orbitSpeedMultiplier;
    document.getElementById('speed-slider').value = appSettings.orbitSpeedMultiplier;
    document.getElementById('speed-display').textContent = `${appSettings.orbitSpeedMultiplier.toFixed(1)}x`;

    document.getElementById('sun-intensity').value = appSettings.sunIntensity;
    pointLight.intensity = appSettings.sunIntensity;
    if (sunMesh && sunMesh.material) {
        sunMesh.material.opacity = Math.min(1.0, appSettings.sunIntensity * 0.8);
        const brightnessFactor = appSettings.sunIntensity * 0.7;
        sunMesh.material.color.setRGB(brightnessFactor, brightnessFactor * 0.9, brightnessFactor * 0.6);
    }

    document.getElementById('orbit-opacity').value = appSettings.orbitOpacity;
    orbits.children.forEach(orbit => { orbit.material.opacity = appSettings.orbitOpacity; });

    document.getElementById('star-density').value = appSettings.starDensity;
    createBackgroundStars(appSettings.starDensity);

    document.getElementById('toggle-labels').checked = appSettings.areLabelsVisible;

    document.getElementById('movement-keys').value = appSettings.movementKeys;
    document.getElementById('travel-speed-input').value = appSettings.travelSpeedKmh;
    document.getElementById('compare-image-width-input').value = appSettings.compareImageWidth;
    document.getElementById('compare-image-height-input').value = appSettings.compareImageHeight;
    document.getElementById('toggle-background').checked = appSettings.showBackgroundStars;
    if (backgroundStars) {
        backgroundStars.visible = appSettings.showBackgroundStars;
    }
    document.getElementById('toggle-keyboard-movement').checked = appSettings.enableKeyboardMovement;
    document.getElementById('toggle-planet-names').checked = appSettings.showPlanetNames;
    document.getElementById('toggle-moon-names').checked = appSettings.showMoonNames;

    // Apply crosshair settings
    document.getElementById('crosshair-style').value = appSettings.crosshairStyle;
    document.getElementById('crosshair-color').value = appSettings.crosshairColor;
}

function appendToTerminal(message, type = 'log') {
    if (!appSettings.console.enableCustomConsole) return;

    const logElement = document.createElement('div');
    logElement.textContent = message;
    logElement.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
    logElement.style.wordBreak = 'break-all'; // Break long words

    switch (type) {
        case 'warn':
            logElement.style.color = 'yellow';
            break;
        case 'error':
            logElement.style.color = 'red';
            break;
        case 'info':
            logElement.style.color = 'lightblue';
            break;
        case 'debug':
            logElement.style.color = 'lightgray';
            break;
        default:
            logElement.style.color = '#0f0'; // Green for logs
    }
    customTerminal.appendChild(logElement);
    customTerminal.scrollTop = customTerminal.scrollHeight; // Auto-scroll to bottom
}

// Override console methods
console.log = function(...args) {
    if (appSettings.console.log) originalConsole.log.apply(console, args);
    appendToTerminal(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'log');
};

console.info = function(...args) {
    if (appSettings.console.info) originalConsole.info.apply(console, args);
    appendToTerminal(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'info');
};

console.warn = function(...args) {
    if (appSettings.console.warn) originalConsole.warn.apply(console, args);
    appendToTerminal(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'warn');
};

console.error = function(...args) {
    if (appSettings.console.error) originalConsole.error.apply(console, args);
    appendToTerminal(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'error');
};

console.debug = function(...args) {
    if (appSettings.console.debug) originalConsole.debug.apply(console, args);
    appendToTerminal(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '), 'debug');
};

// Event listeners for the toggle switches
document.getElementById('toggle-custom-console').addEventListener('change', (event) => {
    appSettings.console.enableCustomConsole = event.target.checked;
    if (appSettings.console.enableCustomConsole) {
        customTerminal.style.display = 'block';
        appendToTerminal('Custom console enabled.', 'info');
    } else {
        customTerminal.style.display = 'none';
        customTerminal.innerHTML = ''; // Clear terminal when disabled
    }
    saveSettings();
});

document.getElementById('toggle-console-log').addEventListener('change', (event) => {
    appSettings.console.log = event.target.checked;
    saveSettings();
});
document.getElementById('toggle-console-info').addEventListener('change', (event) => {
    appSettings.console.info = event.target.checked;
    saveSettings();
});
document.getElementById('toggle-console-warn').addEventListener('change', (event) => {
    appSettings.console.warn = event.target.checked;
    saveSettings();
});
document.getElementById('toggle-console-error').addEventListener('change', (event) => {
    appSettings.console.error = event.target.checked;
    saveSettings();
});
document.getElementById('toggle-console-debug').addEventListener('change', (event) => {
    appSettings.console.debug = event.target.checked;
    saveSettings();
});

const planetData = {
    sun: { name: "Sun", radius: 695510, tilt: 7.25, rotation: "25 days", orbit: "N/A", distance: 0, description: "The star at the center of our Solar System.", textures: { low: `${textureHost}sun.jpg`, high: `${textureHost}sun.jpg` }, moons: [] },
    mercury: { name: "Mercury", radius: 2440, tilt: 0.03, rotation: "58.6 days", orbit: "88 days", distance: 0.387, speed: 0.02, textures: { low: `${textureHost}mercury.jpg`, high: `${textureHost}mercury.jpg` }, moons: [] },
    venus: { name: "Venus", radius: 6052, tilt: 177.3, rotation: "243 days", orbit: "225 days", distance: 0.723, speed: 0.015, textures: { low: `${textureHost}venus.jpg`, high: `${textureHost}venus.jpg` }, moons: [] },
    earth: { name: "Earth", radius: 6371, tilt: 23.44, rotation: "23.9 hours", orbit: "365.2 days", distance: 1, speed: 0.01, textures: { low: `${textureHost}earth.jpg`, high: `${textureHost}earth.jpg` }, moons: [ { name: "Moon", radius: 1.737, distance: 60, speed: 1, orbitTilt: 5.1 } ] },
    mars: { name: "Mars", radius: 3390, tilt: 25.19, rotation: "24.6 hours", orbit: "687 days", distance: 1.52, speed: 0.008, textures: { low: `${textureHost}mars.jpg`, high: `${textureHost}mars.jpg` }, moons: [ { name: "Phobos", radius: 0.011, distance: 30, speed: 4, orbitTilt: 1.08 }, { name: "Deimos", radius: 0.006, distance: 40, speed: 2, orbitTilt: 1.79 } ] },
    jupiter: { name: "Jupiter", radius: 69911, tilt: 3.13, rotation: "9.9 hours", orbit: "11.9 years", distance: 5.2, speed: 0.004, textures: { low: `${textureHost}jupiter.jpg`, high: `${textureHost}jupiter.jpg` }, moons: [ { name: "Io", radius: 1.821, distance: 400, speed: 5, orbitTilt: 0.04 }, { name: "Europa", radius: 1.560, distance: 450, speed: 4, orbitTilt: 0.47 }, { name: "Ganymede", radius: 2.634, distance: 500, speed: 3, orbitTilt: 0.2 }, { name: "Callisto", radius: 2.410, distance: 550, speed: 2, orbitTilt: 0.2 } ] },
    saturn: { name: "Saturn", radius: 58232, tilt: 26.73, rotation: "10.7 hours", orbit: "29.5 years", distance: 9.54, speed: 0.003, ringTexture: `${textureHost}2k_saturn_ring_alpha.png`, textures: { low: `${textureHost}saturn.jpg`, high: `${textureHost}saturn.jpg` }, moons: [ { name: "Titan", radius: 2.575, distance: 350, speed: 2, orbitTilt: 0.33 }, { name: "Rhea", radius: 0.764, distance: 320, speed: 3, orbitTilt: 0.35 } ] },
    uranus: { name: "Uranus", radius: 25362, tilt: 97.77, rotation: "17.2 hours", orbit: "84 years", distance: 19.2, speed: 0.002, textures: { low: `${textureHost}uranus.jpg`, high: `${textureHost}uranus.jpg` }, moons: [ { name: "Titania", radius: 0.788, distance: 150, speed: 3, orbitTilt: 0.34 }, { name: "Oberon", radius: 0.761, distance: 170, speed: 2, orbitTilt: 0.06 } ] },
    neptune: { name: "Neptune", radius: 24622, tilt: 28.32, rotation: "16.1 hours", orbit: "164.8 years", distance: 30.06, speed: 0.001, textures: { low: `${textureHost}neptune.jpg`, high: `${textureHost}neptune.jpg` }, moons: [ { name: "Triton", radius: 1.353, distance: 150, speed: 2.5, orbitTilt: 157 } ] }
};

const constellationData = {
    threeSisters: { name: "The Three Sisters (Orion's Belt)", description: "A prominent asterism in the Orion constellation, also known as Drie Susters (Three Sisters) in South Africa. The three bright stars in a row are Alnitak, Alnilam, and Mintaka.", stars: [ { p: new THREE.Vector3(-0.5, 0.1, 0) }, { p: new THREE.Vector3(0, 0, 0) }, { p: new THREE.Vector3(0.5, -0.1, 0) } ], lines: [[0, 1], [1, 2]] },
    orion: { name: "Orion", description: "Orion, the Hunter, is one of the most recognizable constellations. Its belt of three bright stars (The Three Sisters) makes it easy to spot.", stars: [ { p: new THREE.Vector3(-1, 1.2, 0) }, { p: new THREE.Vector3(1, 1.2, 0) }, { p: new THREE.Vector3(-1.2, 1, 0) }, { p: new THREE.Vector3(-0.5, 0.1, 0) }, { p: new THREE.Vector3(0, 0, 0) }, { p: new THREE.Vector3(0.5, -0.1, 0) }, { p: new THREE.Vector3(-1, -1, 0) }, { p: new THREE.Vector3(1, -1, 0) } ], lines: [[0, 2], [1, 3], [0, 1], [3, 4], [4, 5], [6, 7], [0, 6], [1, 7], [2,3], [6,5]] },
    ursaMajor: { name: "Ursa Major (The Big Dipper)", description: "Ursa Major contains the famous asterism known as the Big Dipper. It's used to find Polaris, the North Star.", stars: [ { p: new THREE.Vector3(2.5, 0.5, 0) }, { p: new THREE.Vector3(1.5, 0.2, 0) }, { p: new THREE.Vector3(0.5, 0.5, 0) }, { p: new THREE.Vector3(-0.5, 0.2, 0) }, { p: new THREE.Vector3(-1.5, 0.5, 0) }, { p: new THREE.Vector3(-2, -0.5, 0) }, { p: new THREE.Vector3(-0.5, -0.2, 0) } ], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6]] },
    cassiopeia: { name: "Cassiopeia", description: "Cassiopeia is known for its distinctive 'W' shape, formed by five bright stars. It is named after a vain queen in Greek mythology.", stars: [ { p: new THREE.Vector3(-1.5, -0.5, 0) }, { p: new THREE.Vector3(-0.5, 0.5, 0) }, { p: new THREE.Vector3(0, 0, 0) }, { p: new THREE.Vector3(0.5, 0.5, 0) }, { p: new THREE.Vector3(1.5, -0.2, 0) } ], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    leo: { name: "Leo", description: "Leo, the Lion, is one of the zodiac constellations. Its head is marked by a sickle-shaped asterism that looks like a backward question mark.", stars: [ { p: new THREE.Vector3(0, 0.5, 0) }, { p: new THREE.Vector3(-0.5, 0.2, 0) }, { p: new THREE.Vector3(-0.7, -0.5, 0) }, { p: new THREE.Vector3(-0.2, -0.8, 0) }, { p: new THREE.Vector3(0.5, -0.5, 0) }, { p: new THREE.Vector3(1.5, -0.8, 0) }, { p: new THREE.Vector3(2.5, -0.5, 0) } ], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6]] },
    scorpius: { name: "Scorpius", description: "Scorpius, the Scorpion, is another zodiac constellation. Its bright, reddish star Antares marks the scorpion's heart, and its tail curves in a J-shape.", stars: [ { p: new THREE.Vector3(-0.5, 1, 0) }, { p: new THREE.Vector3(0, 0.8, 0) }, { p: new THREE.Vector3(0.5, 1, 0) }, { p: new THREE.Vector3(0.2, 0, 0) }, { p: new THREE.Vector3(0.5, -0.8, 0) }, { p: new THREE.Vector3(0.8, -1.5, 0) }, { p: new THREE.Vector3(0.5, -2, 0) }, { p: new THREE.Vector3(0, -2.2, 0) } ], lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7]] }
};

const planets = new THREE.Group();
const orbits = new THREE.Group();
const constellationGroup = new THREE.Group();
const labelGroup = new THREE.Group();
const allObjects = [];
scene.add(planets);
scene.add(orbits);
scene.add(constellationGroup);
scene.add(labelGroup);

// ======== OBJECT CREATION ========
const manager = new THREE.LoadingManager();
updateLoadingStep('Initializing asset loader...');
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    updateLoadingStep(`Loading asset: ${url} (${itemsLoaded}/${itemsTotal})`);
};
manager.onLoad = function () {
    updateLoadingStep('All assets loaded successfully.');
    document.getElementById('loading-overlay').style.display = 'none';
};

const textureLoader = new THREE.TextureLoader(manager);
const visualScale = 0.002; // A single scale factor for realistic relative sizes.
const sunVisualScale = 0.0005; // Use a smaller scale for the sun to keep inner orbits visible.

// Helper function to create text sprites
function makeTextSprite(message, parameters) {
    const fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
    const fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;
    const borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
    const borderColor = parameters.hasOwnProperty("borderColor") ? parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };
    const backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = "Bold " + fontsize + "px " + fontface;

    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";
    context.lineWidth = borderThickness;

    context.fillStyle = "rgba(255, 255, 255, 1.0)";
    context.fillText(message, borderThickness, fontsize + borderThickness);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(100, 50, 1.0);
    return sprite;
}

// Background Stars
let backgroundStars;
function createBackgroundStars(density) {
    updateLoadingStep('Creating background stars...');
    if (backgroundStars) scene.remove(backgroundStars);
    const starVertices = [];
    const numStars = 30000 * density;
    for (let i = 0; i < numStars; i++) {
        const x = (Math.random() - 0.5) * 100000;
        const y = (Math.random() - 0.5) * 100000;
        const z = (Math.random() - 0.5) * 100000;
        const distSq = x*x + y*y + z*z;
        if (distSq > (1000 * 1000)) { // Start stars further out
            starVertices.push(x, y, z);
        }
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 20, transparent: true, opacity: 0.8 });
    backgroundStars = new THREE.Points(starGeometry, starMaterial);
    scene.add(backgroundStars);
    updateLoadingStep('Background stars created.');
}
createBackgroundStars(0.7);

// Planets, Moons, and Labels
const moonTexture = textureLoader.load(`${textureHost}moon.jpg`);
let sunMesh = null; // Store reference to sun mesh for brightness control
updateLoadingStep('Creating celestial bodies...');
Object.keys(planetData).forEach(key => {
    updateLoadingStep(`- Creating ${planetData[key].name}`);
    const data = planetData[key];
    allObjects.push(data);
    const scale = key === 'sun' ? sunVisualScale : visualScale;
    const planetGeometry = new THREE.SphereGeometry(data.radius * scale, 64, 64);

    data.loadedTextures = {};
    data.loadedTextures.low = textureLoader.load(data.textures.low);
    data.loadedTextures.high = textureLoader.load(data.textures.high);
    data.lodState = 'low';

    let material;
    if (key === 'sun') {
        material = new THREE.MeshBasicMaterial({
            map: data.loadedTextures.low,
            transparent: true,
            opacity: 1.0
        });
    } else {
        material = new THREE.MeshStandardMaterial({
            map: data.loadedTextures.low,
            roughness: 0.8,
            metalness: 0.1
        });
    }

    const planet = new THREE.Mesh(planetGeometry, material);
    planet.castShadow = (key !== 'sun');
    planet.receiveShadow = true;
    planet.position.x = data.distance * AU;
    planet.userData = data;
    planets.add(planet);
    data.mesh = planet;

    if (key === 'sun') {
        sunMesh = planet;
    }

    const label = makeTextSprite(data.name, { fontsize: 48, fontface: "Arial", borderColor: {r:0, g:0, b:0, a:1.0} });
    labelGroup.add(label);
    data.labelMesh = label;

    if (data.moons.length > 0) {
        data.moons.forEach(moonData => {
            const moonGeometry = new THREE.SphereGeometry(moonData.radius * 1000 * visualScale, 32, 32);
            const moonMaterial = new THREE.MeshStandardMaterial({ 
                map: moonTexture,
                roughness: 0.8,
                metalness: 0.1
            });
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.castShadow = true;
            moon.receiveShadow = true;
            moon.userData = moonData;
            planet.add(moon);
            moonData.mesh = moon;
            allObjects.push(moonData);

            const label = makeTextSprite(moonData.name, { fontsize: 24, fontface: "Arial", borderColor: {r:0, g:0, b:0, a:1.0} });
            labelGroup.add(label);
            moonData.labelMesh = label;
        });
    }

    if (data.ringTexture) {
        const ringGeometry = new THREE.RingGeometry(data.radius * visualScale * 1.4, data.radius * visualScale * 2.4, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.load(data.ringTexture),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.receiveShadow = true;
        ring.rotation.x = -Math.PI / 2 + 0.2;
        planet.add(ring);
    }

    if (key !== 'sun') {
        const orbitGeometry = new THREE.RingGeometry(data.distance * AU - 2, data.distance * AU + 2, 256);
        const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = -Math.PI / 2;
        orbits.add(orbit);
        data.orbitMesh = orbit;
    }
});

// ======== UI & EVENT LISTENERS ========
let followedPlanetKey = null;
let followMode = 'none';
let lastTrackedPlanetPosition = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let contextPoint = new THREE.Vector3();
let contextObject = null;
let compareSource = null, compareTarget = null;
let compareRenderer, compareScene, compareCamera;
let keysPressed = {};
let longPressTriggered = false;

function drawConstellation(key) {
    while(constellationGroup.children.length > 0){
        constellationGroup.remove(constellationGroup.children[0]);
    }
    const infoBox = document.getElementById('constellation-info');
    infoBox.style.display = 'none';

    if (!key) return;

    const data = constellationData[key];
    if (!data) return;

    const CONSTELLATION_SCALE = 30000;

    const starPoints = [];
    data.stars.forEach(star => starPoints.push(star.p.clone().multiplyScalar(CONSTELLATION_SCALE)));
    const starGeometry = new THREE.BufferGeometry().setFromPoints(starPoints);
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 250, sizeAttenuation: true });
    const stars = new THREE.Points(starGeometry, starMaterial);
    constellationGroup.add(stars);

    const linePoints = [];
    data.lines.forEach(line => {
        linePoints.push(starPoints[line[0]]);
        linePoints.push(starPoints[line[1]]);
    });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.6 });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    constellationGroup.add(lines);

    constellationGroup.position.z = -50000;

    document.getElementById('constellation-name').textContent = data.name;
    document.getElementById('constellation-description').textContent = data.description;
    infoBox.style.display = 'block';
}

function parseCoordinateInput(input) {
    console.log("🔍 Parsing input:", input);
    const result = { x: 0, y: 0, z: 0, distance: 1000, direction: null };

    try {
        // First try to parse key-value format: "x:-115 y:-1546 z:3248 d:3 n:sw.215"
        const numericRegex = /([xyzd]):\s*(-?[\d.]+)/g;
        let match;
        const numericParts = {};
        while ((match = numericRegex.exec(input)) !== null) {
            numericParts[match[1]] = parseFloat(match[2]);
        }

        // Parse direction (n) - can include dots and letters
        const directionMatch = input.match(/n:\s*([a-zA-Z0-9.]+)/);
        const direction = directionMatch ? directionMatch[1] : null;

        console.log("🔍 Parsed numeric parts:", numericParts);
        console.log("🔍 Parsed direction:", direction);

        // Check if we have the required x, y, z coordinates from key-value format
        if (numericParts.x !== undefined && numericParts.y !== undefined && numericParts.z !== undefined) {
            result.x = numericParts.x;
            result.y = numericParts.y;
            result.z = numericParts.z;
            result.distance = numericParts.d !== undefined ? numericParts.d : 1000;
            result.direction = direction;
            console.log("🔍 Parsed from key-value format:", result);
            return result;
        }

        // If key-value parsing fails, try dot-separated parsing
        console.log("🔍 Trying dot-separated parsing...");
        
        // For dot-separated format like "0.1500.3500.3808.S.180"
        // Split by dots and intelligently parse each part
        const parts = input.split('.');
        console.log("🔍 Split parts:", parts);
        
        // Filter out empty parts and identify numeric vs text parts
        const cleanParts = parts.filter(part => part.trim().length > 0);
        const dotNumericParts = [];
        const textParts = [];
        
        for (const part of cleanParts) {
            const trimmedPart = part.trim();
            if (/^-?\d+$/.test(trimmedPart)) {
                // Pure numeric part
                dotNumericParts.push(parseFloat(trimmedPart));
            } else if (/^[A-Za-z]/.test(trimmedPart)) {
                // Text part (direction)
                textParts.push(trimmedPart);
            } else if (/^-?\d+\.\d+$/.test(trimmedPart)) {
                // Decimal number - this shouldn't happen with our format but handle it
                dotNumericParts.push(parseFloat(trimmedPart));
            }
        }
        
        console.log("🔍 Dot numeric parts:", dotNumericParts);
        console.log("🔍 Text parts:", textParts);
        
        // For formats like "0.1500.3500.3808.S.180" we expect:
        // dotNumericParts: [0, 1500, 3500, 3808, 180]
        // textParts: ["S"]
        
        if (dotNumericParts.length >= 3) {
            result.x = dotNumericParts[0];
            result.y = dotNumericParts[1];
            result.z = dotNumericParts[2];
            
            // If we have 4+ numeric parts, the 4th is distance
            if (dotNumericParts.length >= 4) {
                result.distance = dotNumericParts[3];
            }
            
            // Direction handling
            if (textParts.length > 0) {
                // If we have both text and a 5th numeric part, combine them
                if (dotNumericParts.length >= 5) {
                    result.direction = textParts[0] + '.' + dotNumericParts[4];
                } else {
                    result.direction = textParts[0];
                }
            }
            
            console.log("🔍 Final dot-separated result:", result);
            return result;
        }

        // Last resort: try simple split approach
        console.log("🔍 Trying simple split approach...");
        const simpleParts = input.split(/[,.\s]+/).filter(part => part.length > 0);
        console.log("🔍 Simple split parts:", simpleParts);
        
        if (simpleParts.length >= 3) {
            const x = parseFloat(simpleParts[0]);
            const y = parseFloat(simpleParts[1]);
            const z = parseFloat(simpleParts[2]);
            
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                result.x = x;
                result.y = y;
                result.z = z;
                
                if (simpleParts.length > 3 && !isNaN(parseFloat(simpleParts[3]))) {
                    result.distance = parseFloat(simpleParts[3]);
                }
                
                if (simpleParts.length > 4) {
                    result.direction = simpleParts[4];
                }
                
                console.log("🔍 Simple split result:", result);
                return result;
            }
        }

        console.warn("🔍 Parsing failed, using defaults");
        showNotification('Invalid coordinate format. Use "x:0 y:1500 z:3500 d:3808 n:S.180" or "0.1500.3500.3808.S.180".', 3000, 'error');
        return { x: 0, y: 0, z: 0, distance: 1000, direction: null }; // Return default on failure
    } catch (error) {
        console.error("🔍 Error in parseCoordinateInput:", error);
        return { x: 0, y: 0, z: 0, distance: 1000, direction: null };
    }
}

// Expose functions and objects globally for testing
window.parseCoordinateInput = parseCoordinateInput;
window.camera = camera;
window.controls = controls;
window.goToPosition = goToPosition;
window.navigationLock = () => navigationLock;
window.currentAnimationId = () => currentAnimationId;


function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('click', onSceneClick);
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    });

    let longPressTimer;
    let touchStartX, touchStartY;

    renderer.domElement.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            longPressTimer = setTimeout(() => {
                onSceneLongPress(event);
            }, 500); // 500ms for a long press
        }
    }, { passive: false });

    renderer.domElement.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1) {
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;
            const deltaX = Math.abs(touchX - touchStartX);
            const deltaY = Math.abs(touchY - touchStartY);
            if (deltaX > 10 || deltaY > 10) {
                clearTimeout(longPressTimer);
            }
        }
    });

    renderer.domElement.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });

    renderer.domElement.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
    });

    document.getElementById('orbit-opacity').addEventListener('input', e => {
        appSettings.orbitOpacity = parseFloat(e.target.value);
        orbits.children.forEach(orbit => { orbit.material.opacity = appSettings.orbitOpacity; });
        saveSettings();
    });
    document.getElementById('star-density').addEventListener('input', e => {
        appSettings.starDensity = parseFloat(e.target.value);
        createBackgroundStars(appSettings.starDensity);
        saveSettings();
    });

    const sunIntensitySlider = document.getElementById('sun-intensity');
    sunIntensitySlider.addEventListener('input', e => {
        appSettings.sunIntensity = parseFloat(e.target.value);
        pointLight.intensity = appSettings.sunIntensity;

        if (sunMesh && sunMesh.material) {
            sunMesh.material.opacity = Math.min(1.0, appSettings.sunIntensity * 0.8);
            const brightnessFactor = appSettings.sunIntensity * 0.7;
            sunMesh.material.color.setRGB(brightnessFactor, brightnessFactor * 0.9, brightnessFactor * 0.6);
        }
        saveSettings();
    });
    sunIntensitySlider.addEventListener('dblclick', () => {
        appSettings.sunIntensity = 1.5;
        sunIntensitySlider.value = appSettings.sunIntensity;
        sunIntensitySlider.dispatchEvent(new Event('input')); // Trigger input to update UI and save
    });

    document.getElementById('toggle-animation').addEventListener('click', () => {
        appSettings.isAnimationPaused = !appSettings.isAnimationPaused;
        document.getElementById('toggle-animation').textContent = appSettings.isAnimationPaused ? 'Play Animation' : 'Pause Animation';
        saveSettings();
    });

    const speedSlider = document.getElementById('speed-slider');
    speedSlider.addEventListener('input', e => {
        appSettings.orbitSpeedMultiplier = parseFloat(e.target.value);
        document.getElementById('speed-display').textContent = `${appSettings.orbitSpeedMultiplier.toFixed(1)}x`;
        saveSettings();
    });
    speedSlider.addEventListener('dblclick', () => {
        appSettings.orbitSpeedMultiplier = 1.0;
        speedSlider.value = appSettings.orbitSpeedMultiplier;
        speedSlider.dispatchEvent(new Event('input')); // Trigger input to update UI and save
    });

    const planetSelect = document.getElementById('planet-select');
    Object.keys(planetData).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = planetData[key].name;
        planetSelect.appendChild(option);
    });
    planetSelect.addEventListener('change', e => {
        followedPlanetKey = e.target.value;
        const planet = planetData[followedPlanetKey];
        const zoomSliderContainer = document.getElementById('zoom-slider-container');
        if(planet && planet.mesh) {
            const radius = planet.mesh.geometry.parameters.radius;
            const zoomSlider = document.getElementById('zoom-slider');
            zoomSlider.min = radius * 2;
            zoomSlider.max = radius * 50;
            zoomSlider.value = radius * 10;
            zoomSliderContainer.style.display = 'block';
            document.getElementById('planet-time-info').style.display = 'block';
            showPlanetInfo(planet);
        } else {
            zoomSliderContainer.style.display = 'none';
            document.getElementById('planet-time-info').style.display = 'none';
            document.getElementById('planet-info').style.display = 'none';
        }
    });

    document.getElementById('goto-planet').addEventListener('click', () => {
        if (followedPlanetKey) {
            followMode = 'none';
            document.getElementById('follow-mode').value = 'none';
            const planet = planetData[followedPlanetKey];
            const targetPosition = new THREE.Vector3();
            planet.mesh.getWorldPosition(targetPosition);

            const planetRadius = planet.mesh.geometry.parameters.radius;
            const sunPosition = new THREE.Vector3(0, 0, 0);
            const sunToPlanet = targetPosition.clone().sub(sunPosition);

            const cameraDistance = Math.max(planetRadius * 15, 500);
            const cameraOffset = sunToPlanet.normalize().multiplyScalar(cameraDistance);

            cameraOffset.y += cameraDistance * 0.3;
            cameraOffset.x += cameraDistance * 0.2;

            const cameraPosition = targetPosition.clone().add(cameraOffset);

            const startPosition = camera.position.clone();
            const startTarget = controls.target.clone();

            let animationProgress = 0;
            const animationDuration = 1500;
            const startTime = performance.now();

            function animateCamera(currentTime) {
                animationProgress = Math.min((currentTime - startTime) / animationDuration, 1);
                const easeOut = 1 - Math.pow(1 - animationProgress, 3);
                camera.position.lerpVectors(startPosition, cameraPosition, easeOut);
                controls.target.lerpVectors(startTarget, targetPosition, easeOut);
                controls.update();
                if (animationProgress < 1) {
                    requestAnimationFrame(animateCamera);
                }
            }
            requestAnimationFrame(animateCamera);
        }
    });

    const followModeSelect = document.getElementById('follow-mode');
    followModeSelect.addEventListener('change', e => {
        followMode = e.target.value;
        if (followMode === 'track' && followedPlanetKey) {
            const planet = planetData[followedPlanetKey];
            lastTrackedPlanetPosition.copy(planet.mesh.position);
        }
        saveSettings();
    });

    document.getElementById('reset-view').addEventListener('click', () => {
        followedPlanetKey = null;
        followMode = 'none';
        followModeSelect.value = 'none';
        planetSelect.value = "";
        controls.target.set(0, 0, 0);
        camera.position.set(0, 1500, 3500);

        document.getElementById('zoom-slider-container').style.display = 'none';
        document.getElementById('planet-time-info').style.display = 'none';
        document.getElementById('planet-info').style.display = 'none';

        // Reset appSettings to their default values
        appSettings.orbitSpeedMultiplier = 1.0;
        appSettings.sunIntensity = 1.5;
        appSettings.orbitOpacity = 0.4;
        appSettings.starDensity = 0.7;
        appSettings.areLabelsVisible = false; // Explicitly set to default
        appSettings.isAnimationPaused = false;
        appSettings.movementKeys = 'wasd';
        appSettings.travelSpeedKmh = 10000;
        appSettings.compareImageWidth = 1920;
        appSettings.compareImageHeight = 1080;
        appSettings.showBackgroundStars = true;
        appSettings.enableKeyboardMovement = true;
        appSettings.showPlanetNames = true; // Explicitly set to default
        appSettings.showMoonNames = true;   // Explicitly set to default
        appSettings.crosshairStyle = 'none';
        appSettings.crosshairColor = '#FFFFFF';

        // Reset console settings (if they were part of appSettings)
        appSettings.console.enableCustomConsole = false;
        appSettings.console.log = true;
        appSettings.console.info = true;
        appSettings.console.warn = true;
        appSettings.console.error = true;
        appSettings.console.debug = true;


        // Now, call loadSettings to apply these default values to the UI
        loadSettings();

        // Manually trigger input events for sliders to update their display values
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.value = appSettings.orbitSpeedMultiplier;
        speedSlider.dispatchEvent(new Event('input'));

        const sunIntensitySlider = document.getElementById('sun-intensity');
        sunIntensitySlider.value = appSettings.sunIntensity;
        sunIntensitySlider.dispatchEvent(new Event('input'));

        const orbitOpacitySlider = document.getElementById('orbit-opacity');
        orbitOpacitySlider.value = appSettings.orbitOpacity;
        orbitOpacitySlider.dispatchEvent(new Event('input'));

        const starDensitySlider = document.getElementById('star-density');
        starDensitySlider.value = appSettings.starDensity;
        starDensitySlider.dispatchEvent(new Event('input'));

        const moveSpeedSlider = document.getElementById('move-speed-slider');
        moveSpeedSlider.value = 1.0;
        moveSpeedSlider.dispatchEvent(new Event('input')); // Assuming this exists and needs update

        // Update other UI elements that are not handled by loadSettings directly
        document.getElementById('toggle-animation').textContent = 'Pause Animation'; // This is already there
        document.getElementById('constellation-select').value = "";
        drawConstellation(null);
        if (backgroundStars) {
            backgroundStars.visible = appSettings.showBackgroundStars;
        }

        // Ensure the main label toggle reflects the default state
        document.getElementById('toggle-labels').checked = appSettings.areLabelsVisible;
        labelGroup.visible = appSettings.areLabelsVisible; // Ensure scene labels are updated

        saveSettings();
    });

    document.getElementById('zoom-slider').addEventListener('input', e => {
        if (followedPlanetKey) {
            const newDistance = parseFloat(e.target.value);
            const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
            offset.setLength(newDistance);
            camera.position.copy(controls.target).add(offset);
        }
        // No need to save zoom, it's dynamic based on planet selection
    });

    const constellationSelect = document.getElementById('constellation-select');
    Object.keys(constellationData).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = constellationData[key].name;
        constellationSelect.appendChild(option);
    });
    constellationSelect.addEventListener('change', e => drawConstellation(e.target.value));

    document.getElementById('toggle-labels').addEventListener('change', (event) => {
        appSettings.areLabelsVisible = event.target.checked;
        // Also update the individual planet/moon name toggles in settings
        appSettings.showPlanetNames = appSettings.areLabelsVisible;
        appSettings.showMoonNames = appSettings.areLabelsVisible;
        document.getElementById('toggle-planet-names').checked = appSettings.areLabelsVisible;
        document.getElementById('toggle-moon-names').checked = appSettings.areLabelsVisible;
        saveSettings();
    });

    document.getElementById('clear-measurement').addEventListener('click', clearMeasurement);
    document.getElementById('measure-start').addEventListener('click', onMeasureStart);
    document.getElementById('measure-end').addEventListener('click', onMeasureEnd);

    document.querySelectorAll('#context-menu div').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('context-menu').style.display = 'none';
        });
    });

    document.addEventListener('click', (event) => {
        const menu = document.getElementById('context-menu');
        if (!menu.contains(event.target) && !event.ctrlKey) {
            menu.style.display = 'none';
            const compareEl = document.getElementById('select-compare-source');
            if (compareEl.style.color) {
                compareEl.textContent = 'Select for Compare';
                compareEl.style.color = '';
            }
        }
    });

    document.getElementById('save-image-button').addEventListener('click', () => {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `solar-system-${timestamp}.png`;

        // Render the scene first to ensure the renderer's canvas is up-to-date
        renderer.render(scene, camera);

        // Create a temporary canvas to draw the scene and then add text
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = renderer.domElement.width;
        tempCanvas.height = renderer.domElement.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the current scene rendering onto the temporary canvas
        tempCtx.drawImage(renderer.domElement, 0, 0);

        // Add footer text overlay
        const dateTime = new Date().toLocaleString();
        const currentUrl = window.location.href;
        const githubRepo = "https://github.com/vcsoc/solar-system.git";
        const footerText = `Created on ${dateTime} from ${currentUrl}. Code: ${githubRepo}`;

        tempCtx.fillStyle = 'white';
        tempCtx.font = '16px Arial'; // Adjust font as needed
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'bottom';
        tempCtx.fillText(footerText, tempCanvas.width / 2, tempCanvas.height - 10); // Position at bottom center

        // Add zoom indicator text (Coords, Distance, Scale)
        const coordsText = document.getElementById('coordinates-level').textContent;
        const distanceText = document.getElementById('zoom-level').textContent;
        const scaleText = document.getElementById('scale-level').textContent;

        tempCtx.textAlign = 'right';
        tempCtx.font = 'bold 16px Arial';
        tempCtx.fillText(coordsText, tempCanvas.width - 20, tempCanvas.height - 60); // Adjust position as needed
        tempCtx.fillText(distanceText, tempCanvas.width - 20, tempCanvas.height - 40); // Adjust position as needed
        tempCtx.font = '14px Arial'; // Smaller font for scale
        tempCtx.fillText(scaleText, tempCanvas.width - 20, tempCanvas.height - 20); // Adjust position as needed


        link.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Modals and Panels
    document.getElementById('settings-button').addEventListener('click', () => {
        document.getElementById('settings-modal-overlay').style.display = 'flex';
    });
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('settings-modal-overlay').style.display = 'none';
    });
    document.getElementById('help-link').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('help-panel').classList.add('visible');
    });
    document.getElementById('close-help-panel').addEventListener('click', () => {
        document.getElementById('help-panel').classList.remove('visible');
    });
    document.getElementById('close-compare-modal').addEventListener('click', () => {
        document.getElementById('compare-modal-overlay').style.display = 'none';
    });

    document.getElementById('fullscreen-compare-image').addEventListener('click', () => {
        const compareModalOverlay = document.getElementById('compare-modal-overlay'); // Target the overlay
        if (compareModalOverlay.classList.contains('fullscreen')) {
            // Exit fullscreen
            compareModalOverlay.classList.remove('fullscreen');
            document.getElementById('fullscreen-compare-image').textContent = 'Fullscreen';
        } else {
            // Enter fullscreen
            compareModalOverlay.classList.add('fullscreen');
            document.getElementById('fullscreen-compare-image').textContent = 'Exit Fullscreen';
        }
    });

    document.getElementById('toggle-background').addEventListener('change', (event) => {
        appSettings.showBackgroundStars = event.target.checked;
        if (backgroundStars) {
            backgroundStars.visible = appSettings.showBackgroundStars;
        }
        saveSettings();
    });

    document.getElementById('movement-keys').addEventListener('change', (event) => {
        appSettings.movementKeys = event.target.value;
        saveSettings();
    });

    document.getElementById('travel-speed-input').addEventListener('input', (event) => {
        appSettings.travelSpeedKmh = parseFloat(event.target.value);
        saveSettings();
    });

    document.getElementById('compare-image-width-input').addEventListener('input', (event) => {
        appSettings.compareImageWidth = parseFloat(event.target.value);
        saveSettings();
    });

    document.getElementById('compare-image-height-input').addEventListener('input', (event) => {
        appSettings.compareImageHeight = parseFloat(event.target.value);
        saveSettings();
    });

    // Comparison Logic
    document.getElementById('select-compare-source').addEventListener('click', () => {
        if (contextObject) {
            compareSource = contextObject;
            const el = document.getElementById('select-compare-source');
            el.textContent = `Selected: ${contextObject.userData.name}`;
            el.style.color = '#68d391'; // Green
        }
    });

    document.getElementById('select-compare-target').addEventListener('click', () => {
        if (contextObject && compareSource) {
            compareTarget = contextObject;
            openCompareModal();
        } else if (!compareSource) {
            showNotification("Please select a source object first using 'Select for Compare'.", 2000, 'warning');
        }
    });

    document.getElementById('save-compare-image').addEventListener('click', () => {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `comparison-${timestamp}.png`;

        // compositeCanvas already contains the comparison image
        const tempCanvas = compositeCanvas; // Use compositeCanvas directly
        const tempCtx = tempCanvas.getContext('2d');

        // Add text overlay
        const dateTime = new Date().toLocaleString();
        const currentUrl = window.location.href;
        const githubRepo = "https://github.com/vcsoc/solar-system.git";
        const text = `Created on ${dateTime} from ${currentUrl}. Code: ${githubRepo}`;

        tempCtx.fillStyle = 'white';
        tempCtx.font = '16px Arial'; // Adjust font as needed
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'bottom';
        tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height - 10); // Position at bottom center

        link.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    const moveSpeedSlider = document.getElementById('move-speed-slider');
    moveSpeedSlider.addEventListener('input', e => {
        document.getElementById('move-speed-display').textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    });
    moveSpeedSlider.addEventListener('dblclick', () => {
        moveSpeedSlider.value = 1.0;
        moveSpeedSlider.dispatchEvent(new Event('input')); // Trigger input to update UI
    });

    document.getElementById('toggle-keyboard-movement').addEventListener('change', (event) => {
        appSettings.enableKeyboardMovement = event.target.checked;
        saveSettings();
    });

    document.getElementById('toggle-planet-names').addEventListener('change', (event) => {
        appSettings.showPlanetNames = event.target.checked;
        saveSettings();
    });

    document.getElementById('toggle-moon-names').addEventListener('change', (event) => {
        appSettings.showMoonNames = event.target.checked;
        saveSettings();
    });

    document.getElementById('crosshair-style').addEventListener('change', (event) => {
        appSettings.crosshairStyle = event.target.value;
        saveSettings();
    });

    document.getElementById('crosshair-color').addEventListener('input', (event) => {
        appSettings.crosshairColor = event.target.value;
        saveSettings();
    });

    const panelToggleOpen = document.getElementById('panel-toggle-open');
    const panelToggleClose = document.getElementById('panel-toggle-close');
    const uiContainer = document.getElementById('ui-container');

    if (panelToggleOpen && panelToggleClose && uiContainer) {
        panelToggleOpen.addEventListener('click', () => {
            uiContainer.classList.remove('collapsed');
            panelToggleOpen.classList.remove('visible');
        });

        panelToggleClose.addEventListener('click', () => {
            uiContainer.classList.add('collapsed');
            panelToggleOpen.classList.add('visible');
        });

        // Initially collapse the panel on mobile
        if (window.innerWidth < 1024) {
            uiContainer.classList.add('collapsed');
            panelToggleOpen.classList.add('visible');
        }
    }

    document.getElementById('goto-position-btn').addEventListener('click', () => {
        console.log("🔥 Go button clicked!");
        try {
            const input = document.getElementById('goto-position-input').value;
            console.log("🔥 Input value:", input);
            const coords = parseCoordinateInput(input);
            console.log("🎯 About to call goToPosition with:", coords);
            console.log("🎯 Individual parameters:", { x: coords.x, y: coords.y, z: coords.z, distance: coords.distance, direction: coords.direction });
            goToPosition(coords.x, coords.y, coords.z, coords.distance, coords.direction);
        } catch (error) {
            console.error("🔥 Error in coordinate processing:", error);
        }
    });

    document.getElementById('save-bookmark-btn').addEventListener('click', saveBookmark);

    document.getElementById('toggle-sliders-panel').addEventListener('click', (e) => {
        const panel = document.getElementById('sliders-panel');
        const button = e.target;
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            button.textContent = 'Hide Sliders';
        } else {
            panel.classList.add('hidden');
            button.textContent = 'Show Sliders';
        }
    });

    document.getElementById('toggle-bookmarks-panel').addEventListener('click', (e) => {
        const panel = document.getElementById('bookmarks-panel');
        const button = e.target;
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            button.textContent = 'Hide Bookmarks';
        } else {
            panel.classList.add('hidden');
            button.textContent = 'Show Bookmarks';
        }
    });

    document.getElementById('copy-coords-button').addEventListener('click', () => {
        const coords = document.getElementById('coordinates-level').textContent.replace('Coords: ', '');
        const dist = document.getElementById('zoom-level').textContent.replace('Distance: ', '');
        const dir = document.getElementById('direction-level').textContent.replace('Direction: ', '');
        const textToCopy = `${coords} d:${dist} n:${dir}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showNotification('Coordinates copied to clipboard!', 1500, 'success');
        }).catch(err => {
            console.error('Failed to copy coordinates: ', err);
            showNotification('Failed to copy coordinates.', 2000, 'error');
        });
    });
}
    

function onSceneLongPress(event) {
    event.preventDefault();
    longPressTriggered = true;

    // Use the first touch point
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = `${touch.clientX}px`;
    menu.style.top = `${touch.clientY}px`;

    const intersects = raycaster.intersectObjects(planets.children, true);
    contextObject = intersects.length > 0 ? intersects[0].object : null;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    raycaster.ray.intersectPlane(plane, contextPoint);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    crosshairCanvas.width = window.innerWidth;
    crosshairCanvas.height = window.innerHeight;
}

function onSceneClick(event) {
    if (longPressTriggered) {
        longPressTriggered = false;
        return;
    }
    const uiContainer = document.getElementById('ui-container');
    const settingsModal = document.getElementById('settings-modal');
    if (uiContainer.contains(event.target) || settingsModal.contains(event.target)) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (event.ctrlKey) {
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        const intersects = raycaster.intersectObjects(planets.children, true);
        contextObject = intersects.length > 0 ? intersects[0].object : null;

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(plane, contextPoint);
        return;
    }

    const intersects = raycaster.intersectObjects(planets.children, true);
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const data = clickedObject.userData;
        showPlanetInfo(data);

        if (data.hasOwnProperty('tilt')) {
            const planetKey = Object.keys(planetData).find(key => planetData[key].name === data.name);
            if (planetKey) {
                document.getElementById('planet-select').value = planetKey;
                document.getElementById('planet-select').dispatchEvent(new Event('change'));
            }
        }
    } else {
        document.getElementById('planet-info').style.display = 'none';
    }
}

function showPlanetInfo(data) {
    document.getElementById('planet-info').style.display = 'block';
    document.getElementById('planet-name').textContent = data.name;
    const detailsEl = document.getElementById('planet-details');

    let radius = data.radius;
    if (!data.hasOwnProperty('tilt')) { // It's a moon
        radius *= 1000;
    }
    let detailsHtml = `<p><strong>Radius:</strong> ${radius.toLocaleString(undefined, {maximumFractionDigits: 0})} km</p>`;

    if (data.hasOwnProperty('tilt')) {
         detailsHtml += `
            <p><strong>Axial Tilt:</strong> ${data.tilt}°</p>
            <p><strong>Rotation:</strong> ${data.rotation}</p>
            <p><strong>Orbit:</strong> ${data.orbit}</p>
            <p><strong>Moons:</strong> ${data.moons.length}</p>
        `;
    }

    detailsEl.innerHTML = detailsHtml;
}



// ======== MEASUREMENT LOGIC ========
let measureStartPoint = null, measureEndPoint = null, measurementLine = null;

function onMeasureStart() {
    measureStartPoint = contextPoint.clone();
    if (measureEndPoint) {
        drawMeasurementLine();
        calculateAndDisplayMeasurement();
    }
}

function onMeasureEnd() {
    measureEndPoint = contextPoint.clone();
    if (measureStartPoint) {
        drawMeasurementLine();
        calculateAndDisplayMeasurement();
    }
}

function drawMeasurementLine() {
    if (measurementLine) scene.remove(measurementLine);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
    const geometry = new THREE.BufferGeometry().setFromPoints([measureStartPoint, measureEndPoint]);
    measurementLine = new THREE.Line(geometry, material);
    scene.add(measurementLine);
}

function calculateAndDisplayMeasurement() {
    const distance3D = measureStartPoint.distanceTo(measureEndPoint);
    const realDistanceKm = distance3D * SCALE_FACTOR;
    const travelSpeedKmh = parseFloat(document.getElementById('travel-speed-input').value) || 10000;
    const travelHours = realDistanceKm / travelSpeedKmh;
    const travelDays = travelHours / 24;
    const travelYears = travelDays / 365.25;

    document.getElementById('measurement-result').style.display = 'block';
    document.getElementById('distance-text').textContent = `Distance: ${realDistanceKm.toLocaleString()} km`;
    document.getElementById('distance-analogy').textContent = getDistanceAnalogy(realDistanceKm);
    document.getElementById('travel-time-text').textContent = `Travel Time (at ${travelSpeedKmh.toLocaleString()} km/h): ${formatTravelTime(travelYears)}`;
}

function clearMeasurement() {
    measureStartPoint = null; measureEndPoint = null;
    if (measurementLine) {
        scene.remove(measurementLine);
        measurementLine.geometry.dispose();
        measurementLine.material.dispose();
        measurementLine = null;
    }
    document.getElementById('measurement-result').style.display = 'none';
}

function getDistanceAnalogy(km) {
    const earthCircumference = 40075;
    if (km > 384400 * 1.5) return `That's about ${(km / 384400).toFixed(1)} times the distance to the Moon!`;
    if (km > earthCircumference) return `That's like traveling around the Earth ${(km / earthCircumference).toFixed(0)} times!`;
    return "A very, very long way!";
}

function formatTravelTime(years) {
    if (years < 0.001) return `${Math.round(years * 365.25 * 24 * 60)} minutes`;
    if (years < 1/365.25 * 2) return `${Math.round(years * 365.25 * 24)} hours`;
    if (years < 1) return `${Math.round(years * 365.25)} days`;
    return `${years.toFixed(1)} years`;
}

// ======== COMPARISON LOGIC ========
let compositeCanvas;

function openCompareModal() {
    const modal = document.getElementById('compare-modal-overlay');
    modal.style.display = 'flex';
    renderComparison();
}

function initComparisonRenderer() {
    const canvas = document.createElement('canvas');
    let compareImageWidth = parseFloat(document.getElementById('compare-image-width-input').value) || 1920;
    let compareImageHeight = parseFloat(document.getElementById('compare-image-height-input').value) || 1080;

    canvas.width = compareImageWidth;
    canvas.height = compareImageHeight;
    compareRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    compareRenderer.setSize(canvas.width, canvas.height);
    compareScene = new THREE.Scene();
}

function renderComparison() {
    if (!compareRenderer) initComparisonRenderer();

    while(compareScene.children.length > 0){
        compareScene.remove(compareScene.children[0]);
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    compareScene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 0.7);
    point.position.set(200, 200, 200);
    compareScene.add(point);

    // Create new meshes for comparison objects
    const obj1Geometry = compareSource.geometry.clone();
    let obj1Material;
    if (compareSource.userData.name === 'Sun') {
        obj1Material = new THREE.MeshBasicMaterial({ map: compareSource.material.map });
    } else {
        obj1Material = new THREE.MeshStandardMaterial({ map: compareSource.material.map, roughness: compareSource.material.roughness, metalness: compareSource.material.metalness });
    }
    const obj1 = new THREE.Mesh(obj1Geometry, obj1Material);
    const { mesh, labelMesh, ...restOfUserData1 } = compareSource.userData;
    obj1.userData = { ...restOfUserData1 };

    const obj2Geometry = compareTarget.geometry.clone();
    let obj2Material;
    if (compareTarget.userData.name === 'Sun') {
        obj2Material = new THREE.MeshBasicMaterial({ map: compareTarget.material.map });
    } else {
        obj2Material = new THREE.MeshStandardMaterial({ map: compareTarget.material.map, roughness: compareTarget.material.roughness, metalness: compareTarget.material.metalness });
    }
    const obj2 = new THREE.Mesh(obj2Geometry, obj2Material);
    const { mesh: mesh2, labelMesh: labelMesh2, ...restOfUserData2 } = compareTarget.userData;
    obj2.userData = { ...restOfUserData2 };

    const r1 = obj1.userData.radius * (obj1.userData.name === 'Sun' ? sunVisualScale : visualScale);
    const r2 = obj2.userData.radius * (obj2.userData.name === 'Sun' ? sunVisualScale : visualScale);

    const canvas = compareRenderer.domElement;
    const aspect = canvas.width / canvas.height;

    let cameraHeight, cameraWidth;

    // Landscape/Desktop layout: stack horizontally
    const totalWidth = r1 * 2 + r2 * 2;
    const maxHeight = Math.max(r1, r2) * 2;

    if (totalWidth / aspect > maxHeight) {
        cameraWidth = totalWidth * 1.2;
        cameraHeight = cameraWidth / aspect;
    } else {
        cameraHeight = maxHeight * 1.2;
        cameraWidth = cameraHeight * aspect;
    }

    compareCamera = new THREE.OrthographicCamera(-cameraWidth / 2, cameraWidth / 2, cameraHeight / 2, -cameraHeight / 2, 1, 1000);
    compareCamera.position.z = 500;

    const padding = (cameraWidth - (r1 * 2 + r2 * 2)) / 3;
    obj1.position.x = -cameraWidth / 2 + padding + r1;
    obj2.position.x = -cameraWidth / 2 + padding * 2 + r1 * 2 + r2;

    compareScene.add(obj1);
    compareScene.add(obj2);

    compareRenderer.render(compareScene, compareCamera);

    // Create composite image with details
    compositeCanvas = document.createElement('canvas');
    const ctx = compositeCanvas.getContext('2d');
    let compareImageWidth = parseFloat(document.getElementById('compare-image-width-input').value) || 1920;
    let compareImageHeight = parseFloat(document.getElementById('compare-image-height-input').value) || 1080;

    if (window.innerHeight > window.innerWidth && compareImageWidth > compareImageHeight) {
        [compareImageWidth, compareImageHeight] = [compareImageHeight, compareImageWidth]; // Swap width and height
    }

    compositeCanvas.width = compareImageWidth;
    compositeCanvas.height = compareImageHeight;

    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

    const renderedImageWidth = compareRenderer.domElement.width;
    const renderedImageHeight = compareRenderer.domElement.height;
    const drawX = (compositeCanvas.width - renderedImageWidth) / 2;
    const drawY = (compositeCanvas.height - renderedImageHeight) / 2;

    ctx.drawImage(compareRenderer.domElement, drawX, drawY);

    ctx.fillStyle = 'white';
    ctx.font = '14px Inter, sans-serif';

    function getObjectDetailsArray(object) {
        const data = object.userData;
        let radius = data.radius;
        if (!data.hasOwnProperty('tilt')) { // It's a moon
            radius *= 1000;
        }
        let details = [
            `Name: ${data.name}`,
            `Radius: ${radius.toLocaleString(undefined, {maximumFractionDigits: 0})} km`
        ];
        if (data.hasOwnProperty('tilt')) {
             details.push(`Axial Tilt: ${data.tilt}°`);
             details.push(`Rotation: ${data.rotation}`);
             details.push(`Orbit: ${data.orbit}`);
             details.push(`Moons: ${data.moons.length}`);
        }
        return details;
    }

    const details1 = getObjectDetailsArray(compareSource);
    const details2 = getObjectDetailsArray(compareTarget);

    details1.forEach((line, i) => {
        ctx.fillText(line, 20, 100 + i * 20);
    });

    details2.forEach((line, i) => {
        ctx.fillText(line, compositeCanvas.width - 200, 100 + i * 20);
    });

    document.getElementById('compare-image').src = compositeCanvas.toDataURL();
}

function handleKeyboardInput(deltaTime) {
    if (!appSettings.enableKeyboardMovement) return;

    const speedMultiplier = parseFloat(document.getElementById('move-speed-slider').value);
    const travelSpeed = parseFloat(document.getElementById('travel-speed-input').value) || 10000;
    const moveSpeed = speedMultiplier * travelSpeed * deltaTime;

    const moveVector = new THREE.Vector3(0, 0, 0);
    const selectedKeys = document.getElementById('movement-keys').value;
    const keymap = {
        forward: selectedKeys === 'wasd' ? 'w' : 'arrowup',
        backward: selectedKeys === 'wasd' ? 's' : 'arrowdown',
        left: selectedKeys === 'wasd' ? 'a' : 'arrowleft',
        right: selectedKeys === 'wasd' ? 'd' : 'arrowright',
    };

    if (keysPressed[keymap.forward]) { moveVector.z = -1; }
    if (keysPressed[keymap.backward]) { moveVector.z = 1; }
    if (keysPressed[keymap.left]) { moveVector.x = -1; }
    if (keysPressed[keymap.right]) { moveVector.x = 1; }

    if (moveVector.length() === 0) return;

    const worldMoveVector = moveVector.applyQuaternion(camera.quaternion).normalize().multiplyScalar(moveSpeed);
    camera.position.add(worldMoveVector);
    controls.target.add(worldMoveVector);
}

// ======== ANIMATION LOOP ========
const clock = new THREE.Clock();
let simulationTime = 0;

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (!appSettings.isAnimationPaused) {
        simulationTime += deltaTime * appSettings.orbitSpeedMultiplier;

        Object.values(planetData).forEach(data => {
            if (data.mesh && data.speed) {
                const orbitRadius = data.distance * AU;
                data.mesh.position.x = Math.cos(simulationTime * data.speed) * orbitRadius;
                data.mesh.position.z = Math.sin(simulationTime * data.speed) * orbitRadius;
                data.mesh.rotation.y += 0.005 * appSettings.orbitSpeedMultiplier; // Planet self-rotation tied to orbitSpeedMultiplier
            }
            if (data.mesh && data.name === 'Sun') {
                data.mesh.rotation.y += 0.002 * appSettings.orbitSpeedMultiplier;
            }
            
            if (data.moons.length > 0) {
                const planetWorldPos = new THREE.Vector3();
                data.mesh.getWorldPosition(planetWorldPos);

                data.moons.forEach(moonData => {
                    const moonPosition = new THREE.Vector3(
                        Math.cos(simulationTime * moonData.speed) * moonData.distance,
                        0,
                        Math.sin(simulationTime * moonData.speed) * moonData.distance
                    );
                    moonPosition.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(moonData.orbitTilt || 0));
                    moonData.mesh.position.copy(moonPosition);

                    if (moonData.mesh) {
                        const moonWorldPos = new THREE.Vector3();
                        moonData.mesh.getWorldPosition(moonWorldPos);

                        const sunToMoon = moonWorldPos.clone().normalize();
                        const sunToPlanet = planetWorldPos.clone().normalize();
                        const angularSeparation = sunToMoon.angleTo(sunToPlanet);

                        const planetRadius = data.radius * visualScale;
                        const distancePlanetToMoon = moonWorldPos.distanceTo(planetWorldPos);
                        const planetAngularSize = Math.atan(planetRadius / distancePlanetToMoon);

                        const moonDistanceFromSun = moonWorldPos.length();
                        const planetDistanceFromSun = planetWorldPos.length();
                        const isInShadow = moonDistanceFromSun > planetDistanceFromSun && angularSeparation < planetAngularSize;

                        if (isInShadow) {
                            const shadowIntensity = 0.15;
                            moonData.mesh.material.color.setScalar(shadowIntensity);
                            if (!moonData.mesh.userData.originalColor) {
                                moonData.mesh.userData.originalColor = moonData.mesh.material.color.clone();
                            }
                        } else {
                            if (moonData.mesh.userData.originalColor) {
                                moonData.mesh.material.color.copy(moonData.mesh.userData.originalColor);
                            } else {
                                moonData.mesh.material.color.setScalar(1.0);
                            }
                        }
                    }
                    moonData.mesh.rotation.y += (moonData.rotationSpeed || 0.01) * appSettings.orbitSpeedMultiplier; // Moon self-rotation tied to orbitSpeedMultiplier
                });
            }
        });

        if (followedPlanetKey) {
            const planet = planetData[followedPlanetKey];
            const targetPosition = new THREE.Vector3();
            planet.mesh.getWorldPosition(targetPosition);

            if (followMode === 'focus') {
                controls.target.lerp(targetPosition, 0.1);
            } else if (followMode === 'track') {
                const delta = new THREE.Vector3().subVectors( planet.mesh.position, lastTrackedPlanetPosition);
                camera.position.add(delta);
                controls.target.lerp(targetPosition, 0.1);
                lastTrackedPlanetPosition.copy(planet.mesh.position);
            }

            updatePlanetDate(planet, simulationTime);
        }
    }

    handleKeyboardInput(deltaTime);
    updateLODs();
    updateZoomIndicator();
    controls.update();
    renderer.render(scene, camera);
    drawCrosshair(); // Draw crosshair after rendering the scene

    allObjects.forEach(data => {
        if (data.labelMesh) {
            if (appSettings.areLabelsVisible) {
                if (data.hasOwnProperty('tilt')) { // It's a planet
                    data.labelMesh.visible = appSettings.showPlanetNames;
                } else { // It's a moon
                    data.labelMesh.visible = appSettings.showMoonNames;
                }
            } else {
                data.labelMesh.visible = false;
            }

            if (data.mesh) {
                const worldPosition = new THREE.Vector3();
                data.mesh.getWorldPosition(worldPosition);
                const yOffset = data.mesh.geometry.parameters.radius * 1.0 + 10; // Adjusted to bring names closer
                data.labelMesh.position.copy(worldPosition).y += yOffset;
                data.labelMesh.scale.set(yOffset * 5, yOffset * 2.5, 1.0);
            }
        }
    });
}

function updatePlanetDate(planet, currentTime) {
    if (!planet.speed) {
        document.getElementById('planet-date-text').textContent = 'N/A';
        return;
    }
    const orbitalPeriodDays = parseFloat(planet.orbit) * (planet.orbit.includes('years') ? 365.25 : 1);
    const angle = (currentTime * planet.speed) % (2 * Math.PI);
    const percentOfYear = angle / (2 * Math.PI);
    const dayOfYear = Math.floor(percentOfYear * orbitalPeriodDays);

    const date = new Date(2000, 0, 1);
    date.setDate(date.getDate() + dayOfYear);

    const formattedDate = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    document.getElementById('planet-date-text').textContent = `${planet.name} Year Day ${dayOfYear+1} (${formattedDate} equivalent)`;
}

function updateLODs() {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    Object.values(planetData).forEach(data => {
        if (!data.mesh) return;

        const planetPosition = new THREE.Vector3();
        data.mesh.getWorldPosition(planetPosition);
        const distance = cameraPosition.distanceTo(planetPosition);

        const vFOV = camera.fov * Math.PI / 180;
        const height = 2 * Math.tan(vFOV / 2) * distance;
        const screenPixels = renderer.domElement.clientHeight;
        const planetRadius = data.mesh.geometry.parameters.radius;
        const projectedSize = (planetRadius / height) * screenPixels;

        const threshold = 200;

        let newLodState = (projectedSize > threshold) ? 'high' : 'low';

        if (newLodState !== data.lodState) {
            data.lodState = newLodState;
            const newTexture = (newLodState === 'high') ? data.loadedTextures.high : data.loadedTextures.low;

            const material = data.mesh.material;
            let targetMap = material.map;
            if (material.emissiveMap) {
                targetMap = material.emissiveMap;
            }

            if (targetMap !== newTexture) {
                if (material.map) material.map = newTexture;
                if (material.emissiveMap) material.emissiveMap = newTexture;
                material.needsUpdate = true;
            }
        }
    });
}

function updateZoomIndicator() {
    const distance = camera.position.distanceTo(controls.target);
    document.getElementById('coordinates-level').textContent = `Coords: X:${camera.position.x.toFixed(0)} Y:${camera.position.y.toFixed(0)} Z:${camera.position.z.toFixed(0)}`;
    document.getElementById('zoom-level').textContent = `Distance: ${distance.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    const scaleEl = document.getElementById('scale-level');
    if (distance < 2000) scaleEl.textContent = "Scale: Planet Close-up";
    else if (distance < 15000) scaleEl.textContent = "Scale: Inner Solar System";
    else if (distance < 50000) scaleEl.textContent = "Scale: Outer Solar System";
    else scaleEl.textContent = "Scale: Interstellar View";

    // Calculate and display direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    document.getElementById('direction-level').textContent = `Direction: ${getCompassDirection(cameraDirection)}`;
}

function getCompassDirection(cameraDirection) {
    // Project the camera's forward vector onto the XZ plane (ignoring Y-axis for horizontal direction)
    const flatDirection = new THREE.Vector2(cameraDirection.x, cameraDirection.z).normalize();

    // Calculate the angle in radians from the positive Z-axis (North)
    // atan2(y, x) gives angle from positive X-axis. We want from positive Z-axis.
    // So, swap x and y, and negate x for clockwise angle from Z.
    let angle = Math.atan2(flatDirection.x, flatDirection.y);

    // Convert angle to degrees and normalize to 0-360
    angle = THREE.MathUtils.radToDeg(angle);
    if (angle < 0) {
        angle += 360;
    }

    // Determine compass point
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(angle / 45) % 8;
    const compassPoint = directions[index];

    return `${compassPoint} (${angle.toFixed(0)}°)`;
}

function getDirectionVector(directionString) {
    const parts = directionString.split('.');
    const compassPoint = parts[0].toUpperCase();
    const angle = parseFloat(parts[1]);

    let baseAngleRad = 0; // Angle from positive Z-axis (North) clockwise

    switch (compassPoint) {
        case 'N': baseAngleRad = THREE.MathUtils.degToRad(0); break;
        case 'NE': baseAngleRad = THREE.MathUtils.degToRad(45); break;
        case 'E': baseAngleRad = THREE.MathUtils.degToRad(90); break;
        case 'SE': baseAngleRad = THREE.MathUtils.degToRad(135); break;
        case 'S': baseAngleRad = THREE.MathUtils.degToRad(180); break;
        case 'SW': baseAngleRad = THREE.MathUtils.degToRad(225); break;
        case 'W': baseAngleRad = THREE.MathUtils.degToRad(270); break;
        case 'NW': baseAngleRad = THREE.MathUtils.degToRad(315); break;
        default: baseAngleRad = THREE.MathUtils.degToRad(0); break; // Default to North
    }

    // Adjust by the specific angle within the quadrant
    const finalAngleRad = baseAngleRad + THREE.MathUtils.degToRad(angle);

    // Convert to a 3D vector (assuming XZ plane for horizontal direction)
    const directionVector = new THREE.Vector3(
        Math.sin(finalAngleRad), // X component
        0,                        // Y component (horizontal direction)
        Math.cos(finalAngleRad)   // Z component
    );
    return directionVector.normalize();
}

// Navigation lock to prevent overlapping animations
let navigationLock = false;
let currentAnimationId = null;

function goToPosition(x, y, z, distance, direction) {
    console.log("🚀 goToPosition called with:", { x, y, z, distance, direction });
    
    // Check if navigation is locked (another animation is in progress)
    if (navigationLock) {
        console.log("🔒 Navigation locked, canceling current animation and starting new one");
        if (currentAnimationId) {
            cancelAnimationFrame(currentAnimationId);
            currentAnimationId = null;
        }
    }
    
    // Lock navigation
    navigationLock = true;
    
    const targetPosition = new THREE.Vector3(x, y, z);
    console.log("🚀 Target position vector:", targetPosition);
    let cameraPosition;

    if (direction) {
        const dirVector = getDirectionVector(direction);
        // Position camera 'distance' units away from target, in the opposite direction of 'dirVector'
        cameraPosition = new THREE.Vector3().addVectors(targetPosition, dirVector.multiplyScalar(-distance));
        // Add a slight Y offset for better viewing angle, similar to default camera position
        cameraPosition.y += distance * 0.1; // Adjust this multiplier as needed
    } else {
        // Original logic if no direction is provided
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target).normalize().multiplyScalar(distance);
        cameraPosition = new THREE.Vector3().addVectors(targetPosition, offset);
    }

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    let animationProgress = 0;
    const animationDuration = 1500;
    const startTime = performance.now();

    function animateCamera(currentTime) {
        // Check if this animation was canceled
        if (!navigationLock) {
            console.log("🚫 Animation canceled");
            return;
        }
        
        animationProgress = Math.min((currentTime - startTime) / animationDuration, 1);
        const easeOut = 1 - Math.pow(1 - animationProgress, 3);
        camera.position.lerpVectors(startPosition, cameraPosition, easeOut);
        controls.target.lerpVectors(startTarget, targetPosition, easeOut);
        controls.update();
        
        if (animationProgress < 1) {
            currentAnimationId = requestAnimationFrame(animateCamera);
        } else {
            // Animation completed, unlock navigation
            navigationLock = false;
            currentAnimationId = null;
            console.log("✅ Navigation animation completed and unlocked");
        }
    }
    currentAnimationId = requestAnimationFrame(animateCamera);
}

function saveBookmark() {
    const name = document.getElementById('bookmark-name-input').value;
    if (!name) {
        showNotification('Please enter a name for the bookmark.', 2000, 'warning');
        return;
    }

    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    if (bookmarks[name]) {
        showNotification(`Bookmark with name "${name}" already exists.`, 2000, 'warning');
        return;
    }

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const currentDirection = getCompassDirection(cameraDirection);

    bookmarks[name] = {
        position: camera.position.clone(),
        target: controls.target.clone(),
        distance: camera.position.distanceTo(controls.target),
        direction: currentDirection // Save the current direction
    };

    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    document.getElementById('bookmark-name-input').value = '';
    renderBookmarks();
    showNotification(`Bookmark "${name}" saved.`, 2000, 'success');
}

function loadBookmarks() {
    renderBookmarks();
}

function renderBookmarks() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    const bookmarksList = document.getElementById('bookmarks-list');
    bookmarksList.innerHTML = '';

    for (const name in bookmarks) {
        const bookmark = bookmarks[name];
        const listItem = document.createElement('li');
        listItem.className = 'flex items-center justify-between p-2 bg-gray-800 rounded mt-2';

        const nameEl = document.createElement('span');
        nameEl.textContent = name;
        listItem.appendChild(nameEl);

        // Display coordinates and direction
        const coordsDisplay = document.createElement('span');
        coordsDisplay.className = 'text-xs text-gray-400 ml-2';
        coordsDisplay.textContent = `x:${bookmark.position.x.toFixed(0)} y:${bookmark.position.y.toFixed(0)} z:${bookmark.position.z.toFixed(0)} d:${bookmark.distance.toFixed(0)} n:${bookmark.direction || 'N/A'}`;
        listItem.appendChild(coordsDisplay);

        const buttonsEl = document.createElement('div');

        const goBtn = document.createElement('button');
        goBtn.textContent = 'Go';
        goBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs';
        goBtn.onclick = () => goToPosition(bookmark.position.x, bookmark.position.y, bookmark.position.z, bookmark.distance, bookmark.direction);
        buttonsEl.appendChild(goBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Del';
        deleteBtn.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs ml-1';
        deleteBtn.onclick = () => deleteBookmark(name);
        buttonsEl.appendChild(deleteBtn);

        const defaultBtn = document.createElement('button');
        defaultBtn.textContent = 'Set Default';
        defaultBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs ml-1';
        defaultBtn.onclick = () => setDefaultBookmark(name);
        buttonsEl.appendChild(defaultBtn);

        listItem.appendChild(buttonsEl);
        bookmarksList.appendChild(listItem);
    }
}

function deleteBookmark(name) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    delete bookmarks[name];
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    renderBookmarks();
    showNotification(`Bookmark "${name}" deleted.`, 2000, 'success');
}

function setDefaultBookmark(name) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    if (bookmarks[name]) {
        localStorage.setItem('defaultBookmark', JSON.stringify(bookmarks[name]));
        showNotification(`Bookmark "${name}" set as default.`, 2000, 'success');
    } else {
        showNotification('Bookmark not found.', 2000, 'error');
    }
}

function drawCrosshair() {
    const crosshairStyle = appSettings.crosshairStyle;
    const crosshairColor = appSettings.crosshairColor;

    crosshairCtx.clearRect(0, 0, crosshairCanvas.width, crosshairCanvas.height);

    if (crosshairStyle === 'none') {
        return; // No crosshair to draw
    }

    crosshairCtx.save(); // Save the current context state
    crosshairCtx.strokeStyle = crosshairColor;
    crosshairCtx.fillStyle = crosshairColor;
    crosshairCtx.lineWidth = 2;

    const centerX = crosshairCanvas.width / 2;
    const centerY = crosshairCanvas.height / 2;

    switch (crosshairStyle) {
        case 'dot':
            crosshairCtx.beginPath();
            crosshairCtx.arc(centerX, centerY, 3, 0, Math.PI * 2, false);
            crosshairCtx.fill();
            break;
        case 'cross':
            crosshairCtx.beginPath();
            crosshairCtx.moveTo(centerX - 10, centerY);
            crosshairCtx.lineTo(centerX + 10, centerY);
            crosshairCtx.moveTo(centerX, centerY - 10);
            crosshairCtx.lineTo(centerX, centerY + 10);
            crosshairCtx.stroke();
            break;
        case 'circle':
            crosshairCtx.beginPath();
            crosshairCtx.arc(centerX, centerY, 10, 0, Math.PI * 2, false);
            crosshairCtx.stroke();
            break;
        case 'dot-ring':
            crosshairCtx.beginPath();
            crosshairCtx.arc(centerX, centerY, 3, 0, Math.PI * 2, false); // Dot
            crosshairCtx.fill();
            crosshairCtx.beginPath();
            crosshairCtx.arc(centerX, centerY, 10, 0, Math.PI * 2, false); // Ring
            crosshairCtx.stroke();
            break;
    }

    crosshairCtx.restore(); // Restore the context state
}

// ======== START ========
setupEventListeners();
loadSettings(); // Load settings after event listeners are set up
animate();