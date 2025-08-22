/**
 * Coordinate parsing utilities
 * Handles parsing coordinate strings in various formats
 */

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
        return { x: 0, y: 0, z: 0, distance: 1000, direction: null }; // Return default on failure
    } catch (error) {
        console.error("🔍 Error in parseCoordinateInput:", error);
        return { x: 0, y: 0, z: 0, distance: 1000, direction: null };
    }
}

module.exports = {
    parseCoordinateInput
};