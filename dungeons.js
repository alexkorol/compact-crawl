console.log("Initializing DungeonGenerator class");

// compact-crawl/dungeons.js - Dungeon generation systems
class DungeonGenerator {
    constructor(game) {
        this.game = game;
        console.log("DungeonGenerator created");
    }

    generateStandard(width, height, level) {
        console.log("Generating standard dungeon", width, height, level);
        
        const digger = new ROT.Map.Digger(width, height, {
            roomWidth: [3, 9],
            roomHeight: [3, 7],
            corridorLength: [2, 6],
            dugPercentage: 0.2
        });
        
        const map = {};
        const freeCells = [];
        
        digger.create((x, y, value) => {
            const key = `${x},${y}`;
            if (value) {
                map[key] = '#'; // Wall
            } else {
                map[key] = '.'; // Floor
                freeCells.push({x, y});
            }
        });

        console.log("Dungeon generated with", Object.keys(map).length, "cells");
        
        const rooms = digger.getRooms();
        console.log("Rooms:", rooms.length);
        
        const startRoom = rooms[0];
        const startPosition = startRoom.getCenter();
        console.log("Start position:", startPosition);

        return {
            map,
            freeCells,
            rooms,
            startPosition,
            corridors: digger.getCorridors()
        };
    }

    generateAbyss(width, height, seed) {
        ROT.RNG.setSeed(seed);
        const cellular = new ROT.Map.Cellular(width, height);
        
        cellular.randomize(0.5);
        for (let i = 0; i < 4; i++) {
            cellular.create();
        }
        
        const map = {};
        const freeCells = [];
        
        cellular.create((x, y, value) => {
            const key = `${x},${y}`;
            if (value) {
                map[key] = '.';
                freeCells.push({x, y});
            } else {
                map[key] = '#';
            }
        });

        const startIndex = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        const startPosition = freeCells[startIndex];
        
        // Place a portal back
        const portalIndex = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        const portalPosition = freeCells[portalIndex];
        map[`${portalPosition.x},${portalPosition.y}`] = 'O';

        return {
            map,
            freeCells,
            startPosition,
            portalPosition
        };
    }
    
    placeItems(level, map, freeCells, rooms) {
        const items = [];
        
        // Determine how many items to place based on level
        const itemCount = getRandomInt(2, 3 + Math.floor(level/2));
        
        // Calculate item probabilities based on level
        const itemWeights = this.calculateItemWeights(level);
        
        // Place items in random rooms
        for (let i = 0; i < itemCount; i++) {
            const room = pickRandomElement(rooms);
            const position = room.getRandomPosition();
            const key = `${position.x},${position.y}`;
            
            // Make sure the position is empty
            if (map[key] === '.') {
                // Choose an item type based on weights
                const itemType = this.selectWeightedItem(itemWeights);
                const itemData = ITEMS[itemType];
                
                items.push({
                    x: position.x,
                    y: position.y,
                    type: itemType,
                    ...itemData
                });
                
                // Mark the position as having an item (for FOV rendering)
                map[key] = 'i';
            }
        }
        
        return items;
    }
    
    calculateItemWeights(level) {
        // As level increases, better items become more common
        return {
            healthPotion: 20,
            strengthPotion: 5 + Math.floor(level/2),
            shortSword: level <= 3 ? 10 : 5,
            longsword: level >= 3 ? 10 : 2,
            leatherArmor: level <= 3 ? 10 : 5,
            chainmail: level >= 3 ? 10 : 2,
            bread: 15,
            scrollMagicMapping: 5,
            scrollTeleport: 5 + Math.floor(level/2)
        };
    }
    
    selectWeightedItem(weights) {
        let total = 0;
        for (let item in weights) {
            total += weights[item];
        }
        
        let random = Math.floor(Math.random() * total);
        for (let item in weights) {
            random -= weights[item];
            if (random < 0) {
                return item;
            }
        }
        
        // Fallback
        return Object.keys(weights)[0];
    }
    
    generateMonsters(level, rooms, playerPosition) {
        const monsters = [];
        
        // Skip the first room (player starts there)
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            const center = room.getCenter();
            
            // 50% chance for each room
            if (Math.random() > 0.5) {
                // Choose monster based on level and rarity
                let possibleMonsters = [];
                
                // Filter monsters based on dungeon level
                for (const [id, data] of Object.entries(MONSTERS)) {
                    if (data.level <= level) {
                        // Calculate spawn weight based on monster level and current dungeon level
                        let weight = 10;
                        
                        // Monsters close to current level are more common
                        const levelDiff = level - data.level;
                        if (levelDiff === 0) weight = 20;
                        else if (levelDiff === 1) weight = 15;
                        else if (levelDiff >= 4) weight = 5;
                        
                        // Tentacle monsters and special monsters are rarer
                        if (data.behavior === "tentacle" || data.behavior === "multi_tentacle") {
                            weight = Math.max(1, weight - 5);
                        }
                        
                        // Add to possible monsters with weight
                        for (let j = 0; j < weight; j++) {
                            possibleMonsters.push(id);
                        }
                    }
                }
                
                if (possibleMonsters.length > 0) {
                    const monsterType = ROT.RNG.getItem(possibleMonsters);
                    const monsterData = MONSTERS[monsterType];
                    
                    // Add tentacle-based monsters to deeper levels
                    // Force snake on first level for demo purposes
                    let finalMonsterType = monsterType;
                    if (level === 1) {
                        finalMonsterType = "snake"; // Always start with snakes on level 1
                    } else if (level >= 4 && Math.random() < 0.3) {
                        finalMonsterType = "kraken"; // Krakens appear from level 4
                    } else if (level >= 7 && Math.random() < 0.2) {
                        finalMonsterType = "shoggoth"; // Shoggoths appear from level 7
                    } else if (level >= 5 && Math.random() < 0.25) {
                        finalMonsterType = "hydra"; // Hydras appear from level 5
                    }
                    
                    const finalMonsterData = MONSTERS[finalMonsterType];
                    
                    // Find suitable position for the monster
                    let monsterX = center.x;
                    let monsterY = center.y;
                    
                    // For tentacle monsters, ensure there's enough space
                    if (finalMonsterData.behavior === "tentacle" || finalMonsterData.behavior === "multi_tentacle") {
                        // Find a position with enough empty space around it
                        const candidates = [];
                        for (let y = room.top + 2; y < room.bottom - 2; y++) {
                            for (let x = room.left + 2; x < room.right - 2; x++) {
                                let hasSpace = true;
                                // Check for a 3x3 area of empty space
                                for (let dy = -1; dy <= 1; dy++) {
                                    for (let dx = -1; dx <= 1; dx++) {
                                        const nx = x + dx;
                                        const ny = y + dy;
                                        if (nx < room.left || nx >= room.right || 
                                            ny < room.top || ny >= room.bottom || 
                                            this.game.map[ny][nx] !== '.') {
                                            hasSpace = false;
                                        }
                                    }
                                }
                                if (hasSpace) {
                                    candidates.push({x, y});
                                }
                            }
                        }
                        
                        if (candidates.length > 0) {
                            const pos = ROT.RNG.getItem(candidates);
                            monsterX = pos.x;
                            monsterY = pos.y;
                        }
                    }
                    
                    monsters.push(new Monster(monsterX, monsterY, finalMonsterData));
                }
            }
        }
        
        // Skip room 0 (player start), then for each room add goblins with 50% chance
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            const center = room.getCenter();
            if (Math.random() > 0.5) {
                // Spawn a goblin using MONSTERS.goblin data
                const goblinData = MONSTERS.goblin;
                const monster = new Monster(center.x, center.y, goblinData);
                monsters.push(monster);
            }
        }
        
        return monsters;
    }
    
    calculateMonsterWeights(level) {
        // Different monsters appear at different dungeon depths
        return {
            rat: Math.max(20 - level * 3, 5),
            snake: 10 + (level <= 3 ? 10 : 0),
            goblin: 5 + (level >= 2 ? 15 : 0),
            orc: level >= 3 ? 15 : 0,
            troll: level >= 5 ? 10 : 0
        };
    }
}