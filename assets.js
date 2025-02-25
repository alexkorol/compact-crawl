// compact-crawl/assets.js - Asset management and game configuration
// Game configuration
const CONFIG = {
    display: {
        width: 80,
        height: 25,
        fontSize: 18,
        fontFamily: "monospace",
        forceSquareRatio: true,
        bg: "#111"
    },
    player: {
        startingHP: 30,
        startingAttack: 5,
        startingDefense: 2
    },
    colors: {
        wall: "#444",
        floor: "#222",
        player: "#ff0",
        text: {
            normal: "#fff",
            important: "#ff9",
            warning: "#f55"
        }
    }
};

// Monster data
const MONSTERS = {
    rat: {
        name: "Giant Rat",
        symbol: "r",
        color: "#a55",
        hp: 5,
        attack: 2,
        defense: 0
    },
    snake: {
        name: "Cave Snake",
        symbol: "s",
        color: "#5a5",
        hp: 4,
        attack: 3,
        defense: 0
    },
    goblin: {
        name: "Goblin",
        symbol: "g",
        color: "#5aa",
        hp: 8,
        attack: 3,
        defense: 1
    }
};

// Item data
const ITEMS = {
    healthPotion: {
        name: "Health Potion",
        symbol: "!",
        color: "#f55",
        effect: "heal",
        power: 10
    },
    sword: {
        name: "Short Sword",
        symbol: ")",
        color: "#aaa",
        effect: "weapon",
        power: 3
    },
    shield: {
        name: "Wooden Shield",
        symbol: "[",
        color: "#a95",
        effect: "armor",
        power: 1
    }
};

// Helper functions that were originally in utils.js
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function pickRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}