// Browser-based coordinate parsing tests
// Run this in the console to verify coordinate parsing

function runCoordinateTests() {
    console.log('🧪 Running Coordinate Parsing Tests...');
    
    const tests = [
        {
            name: "Basic key-value format",
            input: "x:100 y:200 z:300",
            expected: { x: 100, y: 200, z: 300, distance: 1000, direction: null }
        },
        {
            name: "Key-value with distance and direction",
            input: "x:0 y:1500 z:3500 d:3808 n:S.180",
            expected: { x: 0, y: 1500, z: 3500, distance: 3808, direction: "S.180" }
        },
        {
            name: "Negative coordinates",
            input: "x:-115 y:-1546 z:3248 d:3 n:sw.215",
            expected: { x: -115, y: -1546, z: 3248, distance: 3, direction: "sw.215" }
        },
        {
            name: "Problem case 1: -734.700.1370.10.ne.80",
            input: "-734.700.1370.10.ne.80",
            expected: { x: -734, y: 700, z: 1370, distance: 10, direction: "ne.80" }
        },
        {
            name: "Problem case 2: -1160.729.1189.961.SE.121",
            input: "-1160.729.1189.961.SE.121",
            expected: { x: -1160, y: 729, z: 1189, distance: 961, direction: "SE.121" }
        },
        {
            name: "Problem case 3: 0.1500.3500.3808.S.120",
            input: "0.1500.3500.3808.S.120",
            expected: { x: 0, y: 1500, z: 3500, distance: 3808, direction: "S.120" }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log(`   Input: "${test.input}"`);
        
        try {
            const result = parseCoordinateInput(test.input);
            console.log(`   Result:`, result);
            console.log(`   Expected:`, test.expected);
            
            // Check if results match
            const matches = (
                result.x === test.expected.x &&
                result.y === test.expected.y &&
                result.z === test.expected.z &&
                result.distance === test.expected.distance &&
                result.direction === test.expected.direction
            );
            
            if (matches) {
                console.log(`   ✅ PASSED`);
                passed++;
            } else {
                console.error(`   ❌ FAILED`);
                console.error(`   Differences:`, {
                    x: result.x !== test.expected.x ? `got ${result.x}, expected ${test.expected.x}` : 'OK',
                    y: result.y !== test.expected.y ? `got ${result.y}, expected ${test.expected.y}` : 'OK',
                    z: result.z !== test.expected.z ? `got ${result.z}, expected ${test.expected.z}` : 'OK',
                    distance: result.distance !== test.expected.distance ? `got ${result.distance}, expected ${test.expected.distance}` : 'OK',
                    direction: result.direction !== test.expected.direction ? `got ${result.direction}, expected ${test.expected.direction}` : 'OK'
                });
                failed++;
            }
        } catch (error) {
            console.error(`   ❌ ERROR:`, error);
            failed++;
        }
    }
    
    console.log(`\n🧪 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.error('❌ Some tests failed. Check the parsing logic.');
    }
    
    return { passed, failed };
}

// Test navigation by comparing actual camera position after goToPosition
function testNavigation() {
    console.log('🚀 Testing Navigation System...');
    
    const testCases = [
        {
            name: "Simple test case",
            input: "0.100.200.50",
            expected: { x: 0, y: 100, z: 200, distance: 50 }
        },
        {
            name: "Problem case 1",
            input: "-734.700.1370.10.ne.80",
            expected: { x: -734, y: 700, z: 1370, distance: 10 }
        }
    ];
    
    for (const test of testCases) {
        console.log(`\n🚀 Testing navigation: ${test.name}`);
        console.log(`   Input: "${test.input}"`);
        
        // Parse coordinates
        const parsed = parseCoordinateInput(test.input);
        console.log(`   Parsed:`, parsed);
        console.log(`   Expected:`, test.expected);
        
        // Store current camera state
        const beforeCamera = {
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            target: { x: controls.target.x, y: controls.target.y, z: controls.target.z }
        };
        console.log(`   Before navigation - Camera:`, beforeCamera);
        
        // Navigate
        console.log(`   Calling goToPosition(${parsed.x}, ${parsed.y}, ${parsed.z}, ${parsed.distance}, "${parsed.direction}")...`);
        goToPosition(parsed.x, parsed.y, parsed.z, parsed.distance, parsed.direction);
        
        // Check camera state after navigation (need to wait a bit for animation)
        setTimeout(() => {
            const afterCamera = {
                position: { x: Math.round(camera.position.x), y: Math.round(camera.position.y), z: Math.round(camera.position.z) },
                target: { x: Math.round(controls.target.x), y: Math.round(controls.target.y), z: Math.round(controls.target.z) }
            };
            console.log(`   After navigation - Camera:`, afterCamera);
            
            // The target should match the parsed coordinates
            const targetMatches = (
                Math.abs(afterCamera.target.x - parsed.x) < 1 &&
                Math.abs(afterCamera.target.y - parsed.y) < 1 &&
                Math.abs(afterCamera.target.z - parsed.z) < 1
            );
            
            if (targetMatches) {
                console.log(`   ✅ Target matches parsed coordinates`);
            } else {
                console.error(`   ❌ Target doesn't match!`);
                console.error(`   Expected target: x:${parsed.x}, y:${parsed.y}, z:${parsed.z}`);
                console.error(`   Actual target: x:${afterCamera.target.x}, y:${afterCamera.target.y}, z:${afterCamera.target.z}`);
            }
        }, 2000); // Wait 2 seconds for animation to complete
    }
}

// Test the navigation lock mechanism
function testNavigationLock() {
    console.log('🔒 Testing Navigation Lock System...');
    
    // Test rapid sequential calls to goToPosition
    const testCases = [
        { name: "First call", input: "100.200.300.50", expected: { x: 100, y: 200, z: 300 } },
        { name: "Second call (should cancel first)", input: "0.500.1000.75", expected: { x: 0, y: 500, z: 1000 } },
        { name: "Third call (should cancel second)", input: "-200.800.600.100", expected: { x: -200, y: 800, z: 600 } }
    ];
    
    console.log('🚀 Making rapid sequential navigation calls...');
    
    // Store initial state
    const initialCamera = {
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        target: { x: controls.target.x, y: controls.target.y, z: controls.target.z }
    };
    console.log('📍 Initial state:', initialCamera);
    
    // Make three rapid calls (should test the lock mechanism)
    testCases.forEach((test, index) => {
        const parsed = parseCoordinateInput(test.input);
        console.log(`🚀 Call ${index + 1} - ${test.name}: goToPosition(${parsed.x}, ${parsed.y}, ${parsed.z}, ${parsed.distance || 50})`);
        console.log(`   Navigation lock before call: ${navigationLock()}`);
        
        goToPosition(parsed.x, parsed.y, parsed.z, parsed.distance || 50, parsed.direction);
        
        console.log(`   Navigation lock after call: ${navigationLock()}`);
        console.log(`   Animation ID after call: ${currentAnimationId() ? 'Active' : 'None'}`);
    });
    
    console.log('⏳ Waiting 3 seconds for final animation to complete...');
    
    // Check final state after animations complete
    setTimeout(() => {
        const finalCamera = {
            position: { x: Math.round(camera.position.x), y: Math.round(camera.position.y), z: Math.round(camera.position.z) },
            target: { x: Math.round(controls.target.x), y: Math.round(controls.target.y), z: Math.round(controls.target.z) }
        };
        
        console.log('📍 Final state:', finalCamera);
        console.log(`🔒 Final navigation lock: ${navigationLock()}`);
        console.log(`🎬 Final animation ID: ${currentAnimationId() ? 'Active' : 'None'}`);
        
        // The final position should match the last (third) call
        const expectedFinal = testCases[2];
        const parsedFinal = parseCoordinateInput(expectedFinal.input);
        
        const targetMatches = (
            Math.abs(finalCamera.target.x - parsedFinal.x) < 5 &&
            Math.abs(finalCamera.target.y - parsedFinal.y) < 5 &&
            Math.abs(finalCamera.target.z - parsedFinal.z) < 5
        );
        
        if (targetMatches) {
            console.log('✅ Navigation lock test PASSED - Final position matches last call');
        } else {
            console.error('❌ Navigation lock test FAILED - Final position does not match last call');
            console.error(`   Expected: x:${parsedFinal.x}, y:${parsedFinal.y}, z:${parsedFinal.z}`);
            console.error(`   Actual: x:${finalCamera.target.x}, y:${finalCamera.target.y}, z:${finalCamera.target.z}`);
        }
        
        // Check that navigation is unlocked
        if (!navigationLock() && !currentAnimationId()) {
            console.log('✅ Navigation properly unlocked after completion');
        } else {
            console.error('❌ Navigation still locked or animation still running');
        }
        
    }, 3000);
}

// Export for use in console
window.runCoordinateTests = runCoordinateTests;
window.testNavigation = testNavigation;
window.testNavigationLock = testNavigationLock;