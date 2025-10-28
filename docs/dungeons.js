console.log("Initializing DungeonGenerator class");

// Provide compatibility helpers for ROT.js room features across versions
if (typeof ROT !== 'undefined' && ROT.Map && ROT.Map.Feature && ROT.Map.Feature.Room) {
    const roomProto = ROT.Map.Feature.Room.prototype;

    if (typeof roomProto.getRandomPosition !== 'function') {
        console.log("Polyfilling ROT.Map.Feature.Room#getRandomPosition");

        roomProto.getRandomPosition = function() {
            const left = typeof this.getLeft === 'function' ? this.getLeft() : this._x1;
            const right = typeof this.getRight === 'function' ? this.getRight() : this._x2;
            const top = typeof this.getTop === 'function' ? this.getTop() : this._y1;
            const bottom = typeof this.getBottom === 'function' ? this.getBottom() : this._y2;

            const adjustRange = (min, max) => {
                if (typeof min !== 'number' || typeof max !== 'number') {
                    return [min, max];
                }

                if (max - min >= 2) {
                    return [min + 1, max - 1];
                }

                return [min, max];
            };

            const [minX, maxX] = adjustRange(left, right);
            const [minY, maxY] = adjustRange(top, bottom);

            const pickInRange = (min, max) => {
                if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
                    return null;
                }

                if (min === max) {
                    return min;
                }

                const span = max - min + 1;
                return min + Math.floor(ROT.RNG.getUniform() * span);
            };

            const x = pickInRange(minX, maxX);
            const y = pickInRange(minY, maxY);

            if (x === null || y === null) {
                const center = typeof this.getCenter === 'function' ? this.getCenter() : [left, top];
                if (Array.isArray(center)) {
                    return center;
                }
                if (center && typeof center === 'object') {
                    return [center.x, center.y];
                }
                return [left, top];
            }

            return [x, y];
        };
    }
}

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
        const startPosition = this.normalizePoint(startRoom ? startRoom.getCenter() : null) || {
            x: Math.floor(width / 2),
            y: Math.floor(height / 2)
        };
        console.log("Start position:", startPosition);

        const { upstairs, downstairs } = this.selectStairPositions(
            rooms,
            map,
            freeCells,
            startPosition
        );

        return {
            map,
            freeCells,
            rooms,
            startPosition,
            corridors: digger.getCorridors(),
            upstairsPosition: upstairs,
            downstairsPosition: downstairs
        };
    }

    generateArena(width, height, wave = 1) {
        const map = {};
        const freeCells = [];
        const spawnPoints = [];

        const maxX = width - 1;
        const maxY = height - 1;
        const center = {
            x: Math.floor(width / 2),
            y: Math.floor(height / 2)
        };

        const outerWall = 0;
        const spawnMargin = Math.max(2, Math.floor(Math.min(width, height) / 6));
        const featureCount = Math.min(3, Math.floor(wave / 3));

        const featureOffsets = [];
        for (let i = 0; i < featureCount; i++) {
            featureOffsets.push(2 + i * 2);
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let tile = '.';

                const isOuterWall = (
                    x === outerWall ||
                    y === outerWall ||
                    x === maxX ||
                    y === maxY
                );

                if (isOuterWall) {
                    tile = '#';
                }

                // Add concentric obstacles that grow with the wave count
                if (tile !== '#') {
                    for (const offset of featureOffsets) {
                        const withinVerticalBand = (
                            (y === outerWall + offset || y === maxY - offset) &&
                            x > outerWall + offset - 1 &&
                            x < maxX - offset + 1
                        );
                        const withinHorizontalBand = (
                            (x === outerWall + offset || x === maxX - offset) &&
                            y > outerWall + offset - 1 &&
                            y < maxY - offset + 1
                        );

                        if (withinVerticalBand || withinHorizontalBand) {
                            tile = '#';
                            break;
                        }
                    }
                }

                const key = `${x},${y}`;
                map[key] = tile;
                if (tile !== '#') {
                    freeCells.push({ x, y });
                }
            }
        }

        // Build spawn points around the arena edges just inside the wall to avoid overlaps
        for (let x = spawnMargin; x <= maxX - spawnMargin; x++) {
            spawnPoints.push({ x, y: spawnMargin });
            spawnPoints.push({ x, y: maxY - spawnMargin });
        }
        for (let y = spawnMargin + 1; y <= maxY - spawnMargin - 1; y++) {
            spawnPoints.push({ x: spawnMargin, y });
            spawnPoints.push({ x: maxX - spawnMargin, y });
        }

        return {
            map,
            freeCells,
            rooms: [],
            startPosition: center,
            spawnPoints,
            upstairsPosition: null,
            downstairsPosition: null
        };
    }

    normalizePoint(position) {
        if (!position) {
            return null;
        }

        if (Array.isArray(position)) {
            return { x: position[0], y: position[1] };
        }

        return { x: position.x, y: position.y };
    }

    getRoomBounds(room) {
        if (!room) {
            return null;
        }

        const resolve = (...candidates) => {
            for (const candidate of candidates) {
                if (typeof candidate === 'function') {
                    try {
                        const value = candidate.call(room);
                        if (typeof value === 'number') {
                            return value;
                        }
                    } catch (error) {
                        // Ignore errors from legacy room implementations
                    }
                } else if (typeof candidate === 'number') {
                    return candidate;
                }
            }

            return null;
        };

        const left = resolve(room.getLeft, room.left, room._x1, room.x1, room.x);
        const right = resolve(room.getRight, room.right, room._x2, room.x2, room.x);
        const top = resolve(room.getTop, room.top, room._y1, room.y1, room.y);
        const bottom = resolve(room.getBottom, room.bottom, room._y2, room.y2, room.y);

        if ([left, right, top, bottom].some(value => typeof value !== 'number')) {
            return null;
        }

        return {
            left: Math.min(left, right),
            right: Math.max(left, right),
            top: Math.min(top, bottom),
            bottom: Math.max(top, bottom)
        };
    }

    getRoomRandomPosition(room) {
        if (!room) {
            return null;
        }

        if (typeof getValidRoomPosition === 'function') {
            const rng = (typeof ROT !== 'undefined' && ROT.RNG) ? ROT.RNG : null;
            const position = getValidRoomPosition(room, rng);
            if (position) {
                return { x: position.x, y: position.y };
            }
        }

        if (typeof room.getRandomPosition === 'function') {
            const normalized = this.normalizePoint(room.getRandomPosition());
            if (normalized) {
                return normalized;
            }
        }

        const bounds = this.getRoomBounds(room);
        if (!bounds) {
            return this.normalizePoint(room.getCenter && room.getCenter());
        }

        const adjustInterior = (min, max) => {
            if (max - min >= 2) {
                return [min + 1, max - 1];
            }
            return [min, max];
        };

        const pickInRange = (min, max) => {
            if (min > max) {
                [min, max] = [max, min];
            }

            if (min === max) {
                return min;
            }

            const span = max - min + 1;
            const roll = (typeof ROT !== 'undefined' && ROT.RNG)
                ? ROT.RNG.getUniform()
                : Math.random();
            return min + Math.floor(roll * span);
        };

        const [minX, maxX] = adjustInterior(bounds.left, bounds.right);
        const [minY, maxY] = adjustInterior(bounds.top, bounds.bottom);

        const x = pickInRange(minX, maxX);
        const y = pickInRange(minY, maxY);

        if (typeof x === 'number' && typeof y === 'number') {
            return { x, y };
        }

        return this.normalizePoint(room.getCenter && room.getCenter());
    }

    selectStairPositions(rooms, map, freeCells, startPosition) {
        const result = { upstairs: null, downstairs: null };

        if (!rooms || rooms.length === 0) {
            return result;
        }

        const startPoint = this.normalizePoint(startPosition) || { x: 0, y: 0 };
        const startKey = `${startPoint.x},${startPoint.y}`;

        const roomEntries = rooms
            .slice(1)
            .map(room => {
                const center = this.normalizePoint(room.getCenter());
                const distance = Math.hypot(center.x - startPoint.x, center.y - startPoint.y);
                return { room, center, distance };
            })
            .sort((a, b) => b.distance - a.distance);

        const usedRooms = new Set();

        const pickPositionInRoom = (room) => {
            if (!room) {
                return null;
            }

            for (let attempt = 0; attempt < 10; attempt++) {
                const pos = this.getRoomRandomPosition(room);
                if (!pos) {
                    break;
                }

                const key = `${pos.x},${pos.y}`;
                if (key === startKey) {
                    continue;
                }
                if (map[key] === '.') {
                    return { x: pos.x, y: pos.y };
                }
            }

            const fallback = this.normalizePoint(room.getCenter());
            if (!fallback) {
                return null;
            }

            const fallbackKey = `${fallback.x},${fallback.y}`;
            if (fallbackKey !== startKey && map[fallbackKey] === '.') {
                return { x: fallback.x, y: fallback.y };
            }

            return null;
        };

        if (roomEntries.length > 0) {
            const entry = roomEntries[0];
            result.downstairs = pickPositionInRoom(entry.room);
            usedRooms.add(entry.room);
        }

        if (roomEntries.length > 1) {
            const entry = roomEntries.find(candidate => !usedRooms.has(candidate.room));
            if (entry) {
                result.upstairs = pickPositionInRoom(entry.room);
                usedRooms.add(entry.room);
            }
        }

        const startDistance = (cell) => Math.hypot(cell.x - startPoint.x, cell.y - startPoint.y);
        const fallbackCells = freeCells
            .map(cell => ({ x: cell.x, y: cell.y }))
            .filter(cell => {
                const key = `${cell.x},${cell.y}`;
                return key !== startKey;
            })
            .sort((a, b) => startDistance(b) - startDistance(a));

        if (!result.downstairs && fallbackCells.length > 0) {
            result.downstairs = fallbackCells.shift();
        }

        if (!result.upstairs && fallbackCells.length > 0) {
            const downstairsKey = result.downstairs ? `${result.downstairs.x},${result.downstairs.y}` : null;
            const candidate = fallbackCells.find(cell => `${cell.x},${cell.y}` !== downstairsKey);
            if (candidate) {
                result.upstairs = candidate;
            }
        }

        if (result.upstairs) {
            const key = `${result.upstairs.x},${result.upstairs.y}`;
            map[key] = '<';
        }

        if (result.downstairs) {
            const key = `${result.downstairs.x},${result.downstairs.y}`;
            if (!result.upstairs || key !== `${result.upstairs.x},${result.upstairs.y}`) {
                map[key] = '>';
            }
        }

        return result;
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
        const itemWeights = typeof getItemSpawnWeights === 'function'
            ? getItemSpawnWeights(level)
            : this.calculateItemWeights(level);

        if (!Array.isArray(rooms) || rooms.length === 0) {
            return items;
        }

        const hasWeights = itemWeights && Object.values(itemWeights).some(weight => weight > 0);
        if (!hasWeights) {
            return items;
        }

        // Place items in random rooms
        for (let i = 0; i < itemCount; i++) {
            const room = pickRandomElement(rooms);
            if (!room) {
                continue;
            }

            const position = this.getRoomRandomPosition(room);
            if (!position) {
                continue;
            }

            const key = `${position.x},${position.y}`;

            // Make sure the position is empty
            if (map[key] === '.') {
                // Choose an item type based on weights
                const itemType = this.selectWeightedItem(itemWeights);
                if (!itemType || !ITEMS[itemType]) {
                    console.warn('Skipping item placement for unknown type:', itemType);
                    continue;
                }

                const itemData = ITEMS[itemType];

                items.push({
                    x: position.x,
                    y: position.y,
                    id: itemType,
                    type: itemData.type || 'misc',
                    ...itemData
                });

                // Mark the position as having an item (for FOV rendering)
                map[key] = 'i';
            }
        }

        return items;
    }
    
    calculateItemWeights(level) {
        if (typeof getItemSpawnWeights === 'function') {
            return getItemSpawnWeights(level);
        }

        // As level increases, better items become more common (fallback)
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
        if (!weights) {
            return null;
        }

        let total = 0;
        for (let item in weights) {
            const weight = weights[item];
            if (typeof weight !== 'number' || weight <= 0) {
                continue;
            }
            total += weight;
        }

        if (total <= 0) {
            return null;
        }

        let random = Math.floor(Math.random() * total);
        for (let item in weights) {
            const weight = weights[item];
            if (typeof weight !== 'number' || weight <= 0) {
                continue;
            }
            random -= weight;
            if (random < 0) {
                return item;
            }
        }

        return null;
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
                    
                    monsters.push(new Monster(monsterX, monsterY, finalMonsterData, this.game));
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
                const monster = new Monster(center.x, center.y, goblinData, this.game);
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