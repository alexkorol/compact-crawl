// compact-crawl/utils.js - Utility functions and helpers

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
        findAllMatching
    };
}