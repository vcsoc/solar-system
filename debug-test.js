const { parseCoordinateInput } = require('./src/coordinateParser');

console.log('=== Testing problematic coordinates ===');

console.log('\n1. Testing: -734.700.1370.10.ne.80');
console.log('Expected: x:-734, y:700, z:1370, d:10, n:ne.80');
const result1 = parseCoordinateInput('-734.700.1370.10.ne.80');
console.log('Actual result:', result1);

console.log('\n2. Testing: -1160.729.1189.961.SE.121');
console.log('Expected: x:-1160, y:729, z:1189, d:961, n:SE.121');
const result2 = parseCoordinateInput('-1160.729.1189.961.SE.121');
console.log('Actual result:', result2);

console.log('\n3. Testing: 0.1500.3500.3808.S.120');
console.log('Expected: x:0, y:1500, z:3500, d:3808, n:S.120');
const result3 = parseCoordinateInput('0.1500.3500.3808.S.120');
console.log('Actual result:', result3);