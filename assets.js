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
        abilities: [],
        behavior: "melee",
        spawnWeight: 12,
        depthScaling: -1,
        maxDepth: 5
    },
    snake: {
        name: "Cave Snake",
        symbol: "s",
        color: CONFIG.colors.entities.monster.snake,
        hp: 6,
        maxHp: 6,
        attack: 2, // Reduced from 3
        defense: 0,
        exp: 3,
        level: 1,
        speed: 100, // Reduced from 120 to match player speed
        abilities: ["poison"],
        behavior: "serpentine",
        segments: 4,
        spawnWeight: 10,
        depthScaling: -1,
        maxDepth: 6
    },
    goblin: {
        name: "Goblin",
        symbol: "g",
        color: CONFIG.colors.entities.monster.goblin,
        hp: 6, // Reduced from 8
        maxHp: 6, // Reduced from 8
        attack: 2, // Reduced from 3
        defense: 1,
        exp: 5,
        level: 2,
        speed: 100,
        abilities: [],
        behavior: "melee", // Ensures goblin uses meleeMovement
        spawnWeight: 8,
        depthScaling: 1
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
        abilities: ["rage"],
        spawnWeight: 5,
        depthScaling: 2
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
        abilities: ["regeneration"],
        spawnWeight: 2,
        depthScaling: 2
    },
    wisp: {
        name: "Will-o-wisp",
        symbol: "w",
        color: "#7af",
        hp: 3,
        maxHp: 3,
        attack: 2,
        defense: 0,
        exp: 4,
        level: 2,
        speed: 150,
        abilities: ["lighting"],
        behavior: "random",
        spawnWeight: 4,
        depthScaling: 1
    },
    kraken: {
        name: "Kraken Spawn",
        symbol: "K",
        color: "#0af",
        hp: 15,
        maxHp: 15,
        attack: 5,
        defense: 2,
        exp: 10,
        level: 4,
        speed: 80,
        abilities: ["grab"],
        behavior: "tentacle",
        segments: 6,
        tentacleColor: ["#089", "#067", "#056", "#045", "#034"],
        spawnWeight: 1,
        depthScaling: 2
    },
    shoggoth: {
        name: "Shoggoth",
        symbol: "S",
        color: "#a0f", 
        hp: 30,
        maxHp: 30,
        attack: 7,
        defense: 4,
        exp: 25,
        level: 7,
        speed: 60,
        abilities: ["dissolve", "split"],
        behavior: "tentacle",
        segments: 8,
        tentacleColor: ["#90d", "#80c", "#70b", "#609", "#508", "#407"],
        spawnWeight: 1,
        depthScaling: 2
    },
    hydra: {
        name: "Cave Hydra",
        symbol: "H",
        color: "#0c0",
        hp: 20,
        maxHp: 20,
        attack: 6,
        defense: 3,
        exp: 15,
        level: 5, 
        speed: 90,
        abilities: ["regrowth"],
        behavior: "multi_tentacle",
        segments: 5,
        heads: 3,
        tentacleColor: ["#0b0", "#090", "#070", "#050"],
        spawnWeight: 1,
        depthScaling: 2
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
        stackable: true,
        baseWeight: 18,
        depthScaling: 0
    },
    strengthPotion: {
        name: "Strength Potion",
        symbol: "!",
        color: CONFIG.colors.entities.item.potion,
        type: "potion",
        effect: "strength",
        power: 2,
        duration: 20,
        stackable: true,
        minDepth: 2,
        baseWeight: 4,
        depthScaling: 1
    },
    shortSword: {
        name: "Short Sword",
        symbol: ")",
        color: CONFIG.colors.entities.item.weapon,
        type: "weapon",
        slot: "hand",
        attack: 3,
        stackable: false,
        maxDepth: 5,
        baseWeight: 9,
        depthScaling: -2
    },
    longsword: {
        name: "Longsword",
        symbol: ")",
        color: CONFIG.colors.entities.item.weapon,
        type: "weapon",
        slot: "hand",
        attack: 5,
        stackable: false,
        minDepth: 3,
        baseWeight: 2,
        depthScaling: 2
    },
    leatherArmor: {
        name: "Leather Armor",
        symbol: "[",
        color: CONFIG.colors.entities.item.armor,
        type: "armor",
        slot: "body",
        defense: 1,
        stackable: false,
        maxDepth: 5,
        baseWeight: 8,
        depthScaling: -1
    },
    chainmail: {
        name: "Chainmail",
        symbol: "[",
        color: CONFIG.colors.entities.item.armor,
        type: "armor",
        slot: "body",
        defense: 3,
        stackable: false,
        minDepth: 3,
        baseWeight: 2,
        depthScaling: 2
    },
    bread: {
        name: "Bread Ration",
        symbol: "%",
        color: CONFIG.colors.entities.item.food,
        type: "food",
        nutrition: 300,
        stackable: true,
        baseWeight: 10,
        depthScaling: -1
    },
    scrollMagicMapping: {
        name: "Scroll of Magic Mapping",
        symbol: "?",
        color: CONFIG.colors.entities.item.scroll,
        type: "scroll",
        effect: "magic_mapping",
        stackable: true,
        minDepth: 2,
        baseWeight: 3,
        depthScaling: 1
    },
    scrollTeleport: {
        name: "Scroll of Teleportation",
        symbol: "?",
        color: CONFIG.colors.entities.item.scroll,
        type: "scroll",
        effect: "teleport",
        stackable: true,
        minDepth: 3,
        baseWeight: 3,
        depthScaling: 2
    }
};

function getItemSpawnWeights(depth) {
    const weights = {};

    if (!depth || depth < 1) {
        depth = 1;
    }

    for (const [id, item] of Object.entries(ITEMS)) {
        const minDepth = item.minDepth || 1;
        const maxDepth = item.maxDepth || Infinity;

        if (depth < minDepth || depth > maxDepth) {
            continue;
        }

        let weight = item.baseWeight != null ? item.baseWeight : 5;
        const scaling = item.depthScaling || 0;

        if (scaling !== 0) {
            const depthDelta = depth - minDepth;
            weight += depthDelta * scaling;
        }

        weight = Math.max(1, Math.floor(weight));

        if (weight > 0) {
            weights[id] = weight;
        }
    }

    return weights;
}

window.getItemSpawnWeights = getItemSpawnWeights;

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