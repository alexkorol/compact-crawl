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
                // Choose monster based on level
                const possibleMonsters = Object.entries(MONSTERS)
                    .filter(([_, data]) => data.level <= level)
                    .map(([id, _]) => id);
                
                const monsterType = pickRandomElement(possibleMonsters);
                const monsterData = MONSTERS[monsterType];
                
                monsters.push(new Monster(center.x, center.y, monsterData));
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