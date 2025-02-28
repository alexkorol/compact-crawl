// compact-crawl/entities.js - Entity definitions
class Entity {
    constructor(x, y, symbol, color) {
        this.x = x;
        this.y = y;
        this.symbol = symbol;
        this.color = color;
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, '@', '#ff0');
        this.hp = 10;
        this.maxHp = 10;
        this.level = 1;
        this.visibleTiles = {};  // Track visible tiles
        this.fov = new ROT.FOV.PreciseShadowcasting(
            (x, y) => {
                const key = `${x},${y}`;
                return key in game.map && game.map[key] !== '#';
            }
        );
    }

    act() {
        // Compute FOV when it's player's turn
        this.computeFOV();
        game.engine.lock();
    }

    computeFOV() {
        // Clear current visible tiles
        this.visibleTiles = {};
        
        console.log("Computing FOV from", this.x, this.y);
        
        // Compute new FOV
        this.fov.compute(this.x, this.y, 8, (x, y, r, visibility) => {
            const key = `${x},${y}`;
            console.log("FOV includes", x, y);
            this.visibleTiles[key] = true;
            game.explored[key] = true;
        });
        
        console.log("Visible tiles after FOV:", Object.keys(this.visibleTiles).length);
        
        return this.visibleTiles;
    }

    handleInput(e) {
        const keyMap = {
            'ArrowUp': [0, -1],
            'ArrowDown': [0, 1],
            'ArrowLeft': [-1, 0],
            'ArrowRight': [1, 0],
            'k': [0, -1],
            'j': [0, 1],
            'h': [-1, 0],
            'l': [1, 0]
        };

        if (e.key in keyMap) {
            const [dx, dy] = keyMap[e.key];
            const newX = this.x + dx;
            const newY = this.y + dy;
            
            const key = `${newX},${newY}`;
            if (game.map[key] === '.') {
                this.x = newX;
                this.y = newY;
                return true;
            }
        }
        return false;
    }
}

class Monster extends Entity {
    constructor(x, y, data) {
        super(x, y, data.symbol, data.color);
        this.name = data.name;
        this.hp = data.hp;
        this.maxHp = data.maxHp;
        this.attack = data.attack;
        this.defense = data.defense;
        this.exp = data.exp;
    }

    act() {
        // Only act if visible to player
        if (game.isVisible(this.x, this.y)) {
            // Simple random movement
            const dirs = [[0,-1], [1,0], [0,1], [-1,0]];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const newX = this.x + dir[0];
            const newY = this.y + dir[1];
            
            const key = `${newX},${newY}`;
            if (game.map[key] === '.') {
                this.x = newX;
                this.y = newY;
            }
        }
    }
}