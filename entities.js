// compact-crawl/entities.js - Player, monster, and item definitions
class Entity {
    constructor(x, y, symbol, color) {
        this.x = x;
        this.y = y;
        this.symbol = symbol;
        this.color = color;
    }
    
    draw() {
        game.display.draw(this.x, this.y, this.symbol, this.color);
    }
    
    moveTo(x, y) {
        // Check if the target position is walkable
        const key = `${x},${y}`;
        if (game.map[key] === '.') {
            this.x = x;
            this.y = y;
            return true;
        }
        return false;
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, '@', '#ff0');
        this.hp = 30;
        this.maxHp = 30;
        this.attack = 5;
        this.defense = 2;
        this.level = 1;
        this.exp = 0;
        this.inventory = [];
    }
    
    act() {
        game.engine.lock();
        // Player's turn is managed by the input handler
    }
    
    handleInput(e) {
        const keyMap = {
            'ArrowUp': 0,
            'ArrowRight': 1,
            'ArrowDown': 2,
            'ArrowLeft': 3,
            'k': 0,
            'l': 1,
            'j': 2,
            'h': 3
        };
        
        // Movement
        if (e.key in keyMap) {
            const dir = keyMap[e.key];
            const dirs = [
                [0, -1],  // up
                [1, 0],   // right
                [0, 1],   // down
                [-1, 0]   // left
            ];
            
            const [dx, dy] = dirs[dir];
            const newX = this.x + dx;
            const newY = this.y + dy;
            
            if (this.moveTo(newX, newY)) {
                game.addMessage(`You move ${['up', 'right', 'down', 'left'][dir]}.`);
                return true;
            } else {
                game.addMessage("There's a wall in the way.");
                return false;
            }
        }
        
        return false;
    }
}

class Monster extends Entity {
    constructor(x, y, type, name, symbol, color, hp, attack) {
        super(x, y, symbol, color);
        this.type = type;
        this.name = name;
        this.hp = hp;
        this.attack = attack;
    }
    
    act() {
        // Simple random movement for now
        const dirs = [
            [0, -1],  // up
            [1, 0],   // right
            [0, 1],   // down
            [-1, 0]   // left
        ];
        
        const dir = Math.floor(Math.random() * 4);
        const [dx, dy] = dirs[dir];
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        this.moveTo(newX, newY);
    }
}