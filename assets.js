// compact-crawl/assets.js - Game assets and configuration
const CONFIG = {
    display: {
        fontSizeBase: 20,
        fontFamily: "monospace",
        forceSquareRatio: true,
        bg: "#111",
        fg: "#eee"
    },
    fov: {
        radius: 8,
        algorithm: "precise"
    },
    colors: {
        wall: {
            visible: "#777",
            explored: "#444"
        },
        floor: {
            visible: "#222",
            explored: "#111"
        },
        entities: {
            player: "#ff0",
            monster: {
                rat: "#a55",
                snake: "#5a5",
                goblin: "#5aa",
                orc: "#595",
                troll: "#b55"
            },
            item: {
                potion: "#f55",
                weapon: "#aaa",
                armor: "#a95",
                scroll: "#55f",
                food: "#b73"
            }
        },
        ui: {
            text: "#fff",
            highlight: "#ff9",
            warning: "#f55",
            info: "#5cf"
        }
    }
};

// Monster data
const MONSTERS = {
    rat: {
        name: "Giant Rat",
        symbol: "r",
        color: CONFIG.colors.entities.monster.rat,
        hp: 4,
        maxHp: 4,
        attack: 2,
        defense: 0,
        exp: 2,
        level: 1,
        speed: 100,
        abilities: []
    },
    snake: {
        name: "Cave Snake",
        symbol: "s",
        color: CONFIG.colors.entities.monster.snake,
        hp: 6,
        maxHp: 6,
        attack: 3,
        defense: 0,
        exp: 3,
        level: 1,
        speed: 120,
        abilities: ["poison"]
    },
    goblin: {
        name: "Goblin",
        symbol: "g",
        color: CONFIG.colors.entities.monster.goblin,
        hp: 8,
        maxHp: 8,
        attack: 3,
        defense: 1,
        exp: 5,
        level: 2,
        speed: 100,
        abilities: []
    },
    orc: {
        name: "Orc Warrior",
        symbol: "o",
        color: CONFIG.colors.entities.monster.orc,
        hp: 12,
        maxHp: 12,
        attack: 5,
        defense: 2,
        exp: 8,
        level: 3,
        speed: 90,
        abilities: ["rage"]
    },
    troll: {
        name: "Cave Troll",
        symbol: "T",
        color: CONFIG.colors.entities.monster.troll,
        hp: 20,
        maxHp: 20,
        attack: 8,
        defense: 3,
        exp: 15,
        level: 5,
        speed: 80,
        abilities: ["regeneration"]
    }
};

// Item data
const ITEMS = {
    healthPotion: {
        name: "Health Potion",
        symbol: "!",
        color: CONFIG.colors.entities.item.potion,
        type: "potion",
        effect: "heal",
        power: 10,
        stackable: true
    },
    strengthPotion: {
        name: "Strength Potion",
        symbol: "!",
        color: CONFIG.colors.entities.item.potion,
        type: "potion",
        effect: "strength",
        power: 2,
        duration: 20,
        stackable: true
    },
    shortSword: {
        name: "Short Sword",
        symbol: ")",
        color: CONFIG.colors.entities.item.weapon,
        type: "weapon",
        slot: "hand",
        attack: 3,
        stackable: false
    },
    longsword: {
        name: "Longsword",
        symbol: ")",
        color: CONFIG.colors.entities.item.weapon,
        type: "weapon",
        slot: "hand",
        attack: 5,
        stackable: false
    },
    leatherArmor: {
        name: "Leather Armor",
        symbol: "[",
        color: CONFIG.colors.entities.item.armor,
        type: "armor",
        slot: "body",
        defense: 1,
        stackable: false
    },
    chainmail: {
        name: "Chainmail",
        symbol: "[",
        color: CONFIG.colors.entities.item.armor,
        type: "armor",
        slot: "body",
        defense: 3,
        stackable: false
    },
    bread: {
        name: "Bread Ration",
        symbol: "%",
        color: CONFIG.colors.entities.item.food,
        type: "food",
        nutrition: 300,
        stackable: true
    },
    scrollMagicMapping: {
        name: "Scroll of Magic Mapping",
        symbol: "?",
        color: CONFIG.colors.entities.item.scroll,
        type: "scroll",
        effect: "magic_mapping",
        stackable: true
    },
    scrollTeleport: {
        name: "Scroll of Teleportation",
        symbol: "?",
        color: CONFIG.colors.entities.item.scroll,
        type: "scroll",
        effect: "teleport",
        stackable: true
    }
};

// Player skills
const SKILLS = {
    swordmastery: {
        name: "Sword Mastery",
        description: "Increases damage with swords by 20%",
        cost: 3,
        requires: []
    },
    toughness: {
        name: "Toughness",
        description: "Increases max HP by 10",
        cost: 2,
        requires: []
    },
    evasion: {
        name: "Evasion",
        description: "15% chance to completely avoid an attack",
        cost: 4,
        requires: []
    },
    criticalStrike: {
        name: "Critical Strike",
        description: "10% chance to deal double damage",
        cost: 3,
        requires: ["swordmastery"]
    },
    regeneration: {
        name: "Regeneration",
        description: "Slowly recover HP over time",
        cost: 5,
        requires: ["toughness"]
    }
};

// Utility functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function pickRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}