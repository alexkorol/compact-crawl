// compact-crawl/utils.js - Utility functions and helper methods
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function pickRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}