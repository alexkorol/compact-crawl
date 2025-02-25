// compact-crawl/dungeons.js - Dungeon generation systems
class DungeonGenerator {
    constructor(game) {
        this.game = game;
    }

    generateStandard(width, height, level) {
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
                map[key] = '#';
            } else {
                map[key] = '.';
                freeCells.push({x, y});
            }
        });

        const rooms = digger.getRooms();
        const startRoom = rooms[0];
        const startPosition = startRoom.getCenter();

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

        return {
            map,
            freeCells,
            startPosition
        };
    }
}
