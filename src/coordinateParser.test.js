const { parseCoordinateInput } = require('./coordinateParser');

// Mock console methods to avoid cluttering test output
const mockConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};
global.console = mockConsole;

describe('Coordinate Parser', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('Key-Value Format Parsing', () => {
        test('should parse basic key-value format', () => {
            const result = parseCoordinateInput('x:100 y:200 z:300');
            expect(result).toEqual({
                x: 100,
                y: 200,
                z: 300,
                distance: 1000,
                direction: null
            });
        });

        test('should parse key-value format with distance and direction', () => {
            const result = parseCoordinateInput('x:0 y:1500 z:3500 d:3808 n:S.180');
            expect(result).toEqual({
                x: 0,
                y: 1500,
                z: 3500,
                distance: 3808,
                direction: 'S.180'
            });
        });

        test('should handle negative coordinates in key-value format', () => {
            const result = parseCoordinateInput('x:-115 y:-1546 z:3248 d:3 n:sw.215');
            expect(result).toEqual({
                x: -115,
                y: -1546,
                z: 3248,
                distance: 3,
                direction: 'sw.215'
            });
        });
    });

    describe('Dot-Separated Format Parsing', () => {
        test('should parse basic dot-separated coordinates', () => {
            const result = parseCoordinateInput('0.1500.3500.3808.S.180');
            expect(result).toEqual({
                x: 0,
                y: 1500,
                z: 3500,
                distance: 3808,
                direction: 'S.180'
            });
        });

        test('should parse negative dot-separated coordinates', () => {
            const result = parseCoordinateInput('-734.700.1370.10.ne.80');
            expect(result).toEqual({
                x: -734,
                y: 700,
                z: 1370,
                distance: 10,
                direction: 'ne.80'
            });
        });

        test('should parse complex negative coordinates', () => {
            const result = parseCoordinateInput('-1160.729.1189.961.SE.121');
            expect(result).toEqual({
                x: -1160,
                y: 729,
                z: 1189,
                distance: 961,
                direction: 'SE.121'
            });
        });

        test('should parse coordinates with zero values', () => {
            const result = parseCoordinateInput('0.1500.3500.3808.S.120');
            expect(result).toEqual({
                x: 0,
                y: 1500,
                z: 3500,
                distance: 3808,
                direction: 'S.120'
            });
        });

        test('should parse coordinates without direction', () => {
            const result = parseCoordinateInput('100.200.300.50');
            expect(result).toEqual({
                x: 100,
                y: 200,
                z: 300,
                distance: 50,
                direction: null
            });
        });

        test('should parse coordinates without distance', () => {
            const result = parseCoordinateInput('100.200.300');
            expect(result).toEqual({
                x: 100,
                y: 200,
                z: 300,
                distance: 1000,
                direction: null
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty input', () => {
            const result = parseCoordinateInput('');
            expect(result).toEqual({
                x: 0,
                y: 0,
                z: 0,
                distance: 1000,
                direction: null
            });
        });

        test('should handle invalid input', () => {
            const result = parseCoordinateInput('invalid input');
            expect(result).toEqual({
                x: 0,
                y: 0,
                z: 0,
                distance: 1000,
                direction: null
            });
        });

        test('should handle incomplete coordinates', () => {
            const result = parseCoordinateInput('100.200');
            expect(result).toEqual({
                x: 0,
                y: 0,
                z: 0,
                distance: 1000,
                direction: null
            });
        });
    });

    describe('Real-world test cases from user', () => {
        test('should correctly parse -734.700.1370.10.ne.80', () => {
            const result = parseCoordinateInput('-734.700.1370.10.ne.80');
            expect(result.x).toBe(-734);
            expect(result.y).toBe(700);
            expect(result.z).toBe(1370);
            expect(result.distance).toBe(10);
            expect(result.direction).toBe('ne.80');
        });

        test('should correctly parse -1160.729.1189.961.SE.121', () => {
            const result = parseCoordinateInput('-1160.729.1189.961.SE.121');
            expect(result.x).toBe(-1160);
            expect(result.y).toBe(729);
            expect(result.z).toBe(1189);
            expect(result.distance).toBe(961);
            expect(result.direction).toBe('SE.121');
        });

        test('should correctly parse 0.1500.3500.3808.S.120', () => {
            const result = parseCoordinateInput('0.1500.3500.3808.S.120');
            expect(result.x).toBe(0);
            expect(result.y).toBe(1500);
            expect(result.z).toBe(3500);
            expect(result.distance).toBe(3808);
            expect(result.direction).toBe('S.120');
        });
    });
});