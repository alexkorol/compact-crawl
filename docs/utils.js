// compact-crawl/utils.js - Utility functions and helpers

// Normalize various point formats to an { x, y } object
function normalizePoint(point) {
    if (!point) {
        return null;
    }

    if (Array.isArray(point) && point.length >= 2) {
        const [x, y] = point;
        if (typeof x === 'number' && typeof y === 'number') {
            return { x, y };
        }
    } else if (typeof point === 'object') {
        const { x, y } = point;
        if (typeof x === 'number' && typeof y === 'number') {
            return { x, y };
        }
    }

    return null;
}

// Attempt to pull a random, walkable position from a ROT.js room.
// Falls back to manual bounds calculations if needed.
function getValidRoomPosition(room, rng = (typeof ROT !== 'undefined' ? ROT.RNG : null)) {
    if (!room) {
        return null;
    }

    const tryRandomPosition = () => {
        if (typeof room.getRandomPosition !== 'function') {
            return null;
        }

        try {
            const args = [];
            if (room.getRandomPosition.length > 0 && rng) {
                args.push(rng);
            }
            const position = room.getRandomPosition(...args);
            return normalizePoint(position);
        } catch (error) {
            console.warn('getValidRoomPosition: room.getRandomPosition failed', error);
            return null;
        }
    };

    const positionFromRandom = tryRandomPosition();
    if (positionFromRandom) {
        return positionFromRandom;
    }

    const resolveBound = (...candidates) => {
        for (const candidate of candidates) {
            if (typeof candidate === 'function') {
                try {
                    const value = candidate.call(room);
                    if (typeof value === 'number') {
                        return value;
                    }
                } catch (error) {
                    // Ignore errors from incompatible room implementations
                }
            } else if (typeof candidate === 'number') {
                return candidate;
            }
        }
        return null;
    };

    const left = resolveBound(room.getLeft, room.left, room._x1, room.x1, room.x);
    const right = resolveBound(room.getRight, room.right, room._x2, room.x2, room.x);
    const top = resolveBound(room.getTop, room.top, room._y1, room.y1, room.y);
    const bottom = resolveBound(room.getBottom, room.bottom, room._y2, room.y2, room.y);

    if ([left, right, top, bottom].some(value => typeof value !== 'number')) {
        return normalizePoint(typeof room.getCenter === 'function' ? room.getCenter() : null);
    }

    const adjustInterior = (min, max) => {
        if (max - min >= 2) {
            return [min + 1, max - 1];
        }
        return [Math.min(min, max), Math.max(min, max)];
    };

    const pickInRange = (min, max) => {
        if (min > max) {
            [min, max] = [max, min];
        }

        if (min === max) {
            return min;
        }

        const span = max - min + 1;
        const roll = rng && typeof rng.getUniform === 'function'
            ? rng.getUniform()
            : Math.random();
        return min + Math.floor(roll * span);
    };

    const [minX, maxX] = adjustInterior(left, right);
    const [minY, maxY] = adjustInterior(top, bottom);

    const x = pickInRange(minX, maxX);
    const y = pickInRange(minY, maxY);

    if (typeof x === 'number' && typeof y === 'number') {
        return { x, y };
    }

    return normalizePoint(typeof room.getCenter === 'function' ? room.getCenter() : null);
}

// Simple distance calculator function
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Determine if a point is within a rectangle
function pointInRect(x, y, rect) {
    return (
        x >= rect.x && 
        x < rect.x + rect.width && 
        y >= rect.y && 
        y < rect.y + rect.height
    );
}

// Get random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get random element from array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Generate unique ID
function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Direction utils
const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

const DIRECTION_VECTORS = [
    [0, -1],  // Up
    [1, 0],   // Right
    [0, 1],   // Down
    [-1, 0]   // Left
];

const OPPOSITE_DIRECTIONS = [2, 3, 0, 1]; // DOWN, LEFT, UP, RIGHT

// Get direction from movement vector
function getDirectionFromVector(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else {
        return dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }
}

// Get direction name
function getDirectionName(direction) {
    return ["up", "right", "down", "left"][direction];
}

// Get opposite direction
function getOppositeDirection(direction) {
    return OPPOSITE_DIRECTIONS[direction];
}

// Create a weighted random selection from an object of weights
function weightedRandomSelection(weights) {
    let total = 0;
    for (const key in weights) {
        total += weights[key];
    }
    
    let random = Math.random() * total;
    for (const key in weights) {
        random -= weights[key];
        if (random <= 0) {
            return key;
        }
    }
    
    // Fallback to first item
    return Object.keys(weights)[0];
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Make a 2D grid of given dimensions
function make2DArray(width, height, defaultValue = null) {
    return Array(height).fill().map(() => Array(width).fill(defaultValue));
}

// Find path between two points (A*)
function findPath(startX, startY, endX, endY, isPassable) {
    const astar = new ROT.Path.AStar(endX, endY, isPassable);
    const path = [];
    
    astar.compute(startX, startY, (x, y) => {
        path.push([x, y]);
    });
    
    return path;
}

// Check if point is in bounds
function isInBounds(x, y, width, height) {
    return x >= 0 && y >= 0 && x < width && y < height;
}

// Get surrounding coordinates
function getSurroundingCoords(x, y, includeDiagonals = true) {
    const coords = [];
    
    // Cardinal directions
    coords.push([x, y-1]); // North
    coords.push([x+1, y]); // East
    coords.push([x, y+1]); // South
    coords.push([x-1, y]); // West
    
    if (includeDiagonals) {
        coords.push([x+1, y-1]); // Northeast
        coords.push([x+1, y+1]); // Southeast
        coords.push([x-1, y+1]); // Southwest
        coords.push([x-1, y-1]); // Northwest
    }
    
    return coords;
}

// Find items in an array matching a predicate
function findAllMatching(array, predicate) {
    return array.filter(predicate);
}

// Add debugging functions

// Enable/disable debug mode
let DEBUG_MODE = false;

function setDebugMode(enabled) {
    DEBUG_MODE = !!enabled;
    console.log(`Debug mode ${DEBUG_MODE ? 'enabled' : 'disabled'}`);
}

function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log('[DEBUG]', ...args);
    }
}

function debugError(...args) {
    if (DEBUG_MODE) {
        console.error('[DEBUG ERROR]', ...args);
    }
}

function debugPerformance(label, func) {
    if (!DEBUG_MODE) {
        return func();
    }
    
    console.time(label);
    const result = func();
    console.timeEnd(label);
    return result;
}

function inspectObject(obj, maxDepth = 2) {
    if (!DEBUG_MODE) return;

    function objToString(o, depth = 0) {
        if (depth > maxDepth) return '{ ... }';
        
        const indent = '  '.repeat(depth);
        let result = '{\n';
        
        for (const key in o) {
            if (Object.prototype.hasOwnProperty.call(o, key)) {
                const value = o[key];
                
                if (value === null) {
                    result += `${indent}  ${key}: null,\n`;
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    result += `${indent}  ${key}: ${objToString(value, depth + 1)},\n`;
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        result += `${indent}  ${key}: [],\n`;
                    } else {
                        result += `${indent}  ${key}: [${value.map(v => typeof v === 'object' ? objToString(v, depth + 1) : JSON.stringify(v)).join(', ')}],\n`;
                    }
                } else if (typeof value === 'function') {
                    result += `${indent}  ${key}: [Function],\n`;
                } else {
                    result += `${indent}  ${key}: ${JSON.stringify(value)},\n`;
                }
            }
        }
        
        result += `${indent}}`;
        return result;
    }
    
    console.log(`Object inspection: ${objToString(obj)}`);
}

if (typeof window !== 'undefined') {
    window.normalizePoint = window.normalizePoint || normalizePoint;
    window.getValidRoomPosition = window.getValidRoomPosition || getValidRoomPosition;
}

// Game state validation
function validateGameState(game) {
    const issues = [];
    
    // Check player
    if (!game.player) {
        issues.push("Player object missing");
    } else {
        if (typeof game.player.x !== 'number' || isNaN(game.player.x)) issues.push("Invalid player X position");
        if (typeof game.player.y !== 'number' || isNaN(game.player.y)) issues.push("Invalid player Y position");
        if (typeof game.player.hp !== 'number' || isNaN(game.player.hp)) issues.push("Invalid player HP");
    }
    
    // Check map
    if (!game.map || Object.keys(game.map).length === 0) {
        issues.push("Map missing or empty");
    }
    
    // Check entities
    if (!game.entities || game.entities.size === 0) {
        issues.push("Entities missing or empty");
    }
    
    // Check game state
    if (!['title', 'menu', 'playing', 'gameover', 'help'].includes(game.gameState)) {
        issues.push(`Invalid game state: ${game.gameState}`);
    }
    
    if (issues.length > 0) {
        console.error("Game state validation failed:", issues);
        return false;
    }
    
    return true;
}

// Add font utilities for sandbox mode

// Enhanced version of isFontAvailable function that correctly detects different fonts
function isFontAvailable(fontName) {
    // Use a canvas for more accurate measurement than span width comparison
    // This works better to detect subtle differences between similar fonts
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const sampleText = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const fontSize = '20px';
    
    // First measure fallback font
    context.font = `${fontSize} sans-serif`;
    const fallbackWidth = context.measureText(sampleText).width;
    
    // Now try the specified font with fallback
    context.font = `${fontSize} ${fontName}, sans-serif`;
    const testWidth = context.measureText(sampleText).width;
    
    // Since fonts might have very similar widths, also try specific test characters
    // that often have different representations across monospace fonts
    const specialChars = 'il1|0Oo@#';
    
    context.font = `${fontSize} sans-serif`;
    const specialFallbackWidth = context.measureText(specialChars).width;
    
    context.font = `${fontSize} ${fontName}, sans-serif`;
    const specialTestWidth = context.measureText(specialChars).width;
    
    // More accurate check:
    // 1. Check if widths are different
    // 2. Check if special characters have different widths
    // 3. Include fallback for common similar font pairs
    const similarFontPairs = [
        ['DejaVu Sans Mono', 'Monaco'],
        ['Courier New', 'Courier'],
        ['Lucida Console', 'Monaco']
    ];
    
    for (const [font1, font2] of similarFontPairs) {
        if ((fontName === font1 || fontName === font2) && 
            Math.abs(testWidth - fallbackWidth) < 2 && 
            Math.abs(specialTestWidth - specialFallbackWidth) < 2) {
            
            // For known similar fonts, do additional tests with specific characters
            const testChar = '@#%';
            
            context.font = `${fontSize} ${font1}`;
            const width1 = context.measureText(testChar).width;
            
            context.font = `${fontSize} ${font2}`;
            const width2 = context.measureText(testChar).width;
            
            if (Math.abs(width1 - width2) < 1) {
                // Truly can't tell them apart
                console.log(`Cannot differentiate between ${font1} and ${font2}`);
                
                // If checking the second font in the pair and we can't tell them apart,
                // consider it not available to avoid duplicates
                if (fontName === font2) {
                    return false;
                }
            }
        }
    }
    
    return (
        Math.abs(testWidth - fallbackWidth) > 0.5 || 
        Math.abs(specialTestWidth - specialFallbackWidth) > 0.5
    );
}

// Add improved method for font detection
function getActuallyDifferentFonts(fontList) {
    const uniqueFonts = [];
    const fontFingerprints = new Set();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // A selection of characters that tend to be distinctive across fonts
    const testString = "Il1|0O@#.";
    const fontSize = 20;
    
    for (const font of fontList) {
        ctx.font = `${fontSize}px ${font}, monospace`;
        const metrics = ctx.measureText(testString);
        
        // Create a fingerprint using width and other metrics
        const fingerprint = [
            Math.round(metrics.width * 100) / 100,
            Math.round(metrics.actualBoundingBoxAscent * 100) / 100,
            Math.round(metrics.actualBoundingBoxDescent * 100) / 100
        ].join(',');
        
        // If we haven't seen this fingerprint, add the font
        if (!fontFingerprints.has(fingerprint)) {
            fontFingerprints.add(fingerprint);
            uniqueFonts.push(font);
        } else {
            console.log(`Font ${font} appears to be a duplicate based on metrics`);
        }
    }
    
    return uniqueFonts;
}

// Improved version of detectSystemFonts to filter out duplicates
function detectSystemFonts() {
    const baseFonts = ['monospace', 'sans-serif', 'serif', 'fantasy', 'cursive'];
    const commonFonts = [
        'Courier New', 'Consolas', 'DejaVu Sans Mono', 'Lucida Console', 'Monaco',
        'Fira Code', 'Source Code Pro', 'Roboto Mono', 'Ubuntu Mono',
        'Andale Mono', 'OCR A Extended', 'Terminal', 'Fixed', 'Fixedsys',
        'Menlo', 'Liberation Mono', 'Inconsolata'
    ];
    
    let availableFonts = [];
    
    // Add base fonts first
    availableFonts = [...baseFonts];
    
    // Test common monospace fonts that work well for roguelikes
    commonFonts.forEach(font => {
        if (isFontAvailable(font)) {
            availableFonts.push(font);
        }
    });
    
    // Filter out fonts that appear to be duplicates
    availableFonts = getActuallyDifferentFonts(availableFonts);
    
    console.log('Available unique fonts:', availableFonts);
    return availableFonts;
}

// Function to create a font preview with a sample
function createFontPreview(fontName, container) {
    const preview = document.createElement('div');
    preview.className = 'font-sample';
    preview.style.fontFamily = fontName;
    preview.innerHTML = `
        <strong>${fontName}</strong><br>
        ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz<br>
        0123456789 !@#$%^&*()_+-=[]{}|;':",./<>?
    `;
    container.appendChild(preview);
}

// Function to create a comparison of multiple fonts
function compareFonts(fontNames, container) {
    // Clear container
    container.innerHTML = '';
    
    // Add a heading
    const heading = document.createElement('h3');
    heading.textContent = 'Font Comparison';
    container.appendChild(heading);
    
    // Add each font preview
    fontNames.forEach(font => {
        createFontPreview(font, container);
    });
}

// Export utils if module system is used
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateDistance,
        pointInRect,
        getRandomInt,
        getRandomElement,
        shuffleArray,
        generateUID,
        DIRECTIONS,
        DIRECTION_VECTORS,
        getDirectionFromVector,
        getDirectionName,
        getOppositeDirection,
        weightedRandomSelection,
        formatNumber,
        make2DArray,
        findPath,
        isInBounds,
        getSurroundingCoords,
        findAllMatching,
        setDebugMode,
        debugLog,
        debugError,
        debugPerformance,
        inspectObject,
        validateGameState,
        isFontAvailable,
        detectSystemFonts,
        createFontPreview,
        compareFonts
    };
}

// Make font utility functions directly available in global scope
if (typeof window !== 'undefined') {
    window.isFontAvailable = isFontAvailable;
    window.detectSystemFonts = detectSystemFonts;
    window.getActuallyDifferentFonts = getActuallyDifferentFonts;
    window.createFontPreview = createFontPreview;
    window.compareFonts = compareFonts;
}