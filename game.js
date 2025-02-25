// compact-crawl/game.js - Core game engine and main loop
class Game {
    constructor() {
        this.calculateDisplaySize();
        
        this.display = new ROT.Display({
            width: this.displayWidth,
            height: this.displayHeight,
            fontSize: this.fontSize,
            fontFamily: "monospace",
            forceSquareRatio: true,
            bg: "#111"
        });
        document.getElementById('game-display').appendChild(this.display.getContainer());
        
        this.scheduler = new ROT.Scheduler.Simple();
        this.engine = new ROT.Engine(this.scheduler);
        this.dungeonGen = new DungeonGenerator(this);
        
        // Setup message log functions
        this.setupMessaging();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        this.init();
    }
    
    calculateDisplaySize() {
        // Get the container dimensions
        const displayEl = document.getElementById('game-display');
        const rect = displayEl.getBoundingClientRect();
        
        // Calculate how many characters can fit
        // Using a slightly smaller size to ensure it fits well
        this.fontSize = Math.floor(rect.height / 30); // Aim for about 30 rows
        
        // Calculate width and height based on container size and font size
        this.displayWidth = Math.floor(rect.width / this.fontSize * 1.6); // Adjust for character width
        this.displayHeight = Math.floor(rect.height / this.fontSize);
        
        // Ensure minimum size
        this.displayWidth = Math.max(40, this.displayWidth);
        this.displayHeight = Math.max(20, this.displayHeight);
        
        console.log(`Display size: ${this.displayWidth}x${this.displayHeight}, Font size: ${this.fontSize}`);
    }
    
    handleResize() {
        // Store old values
        const oldWidth = this.displayWidth;
        const oldHeight = this.displayHeight;
        const oldFontSize = this.fontSize;
        
        // Calculate new display size
        this.calculateDisplaySize();
        
        // Only rebuild if dimensions changed
        if (oldWidth !== this.displayWidth || 
            oldHeight !== this.displayHeight || 
            oldFontSize !== this.fontSize) {
            
            const container = this.display.getContainer();
            container.remove();
            
            this.display = new ROT.Display({
                width: this.displayWidth,
                height: this.displayHeight,
                fontSize: this.fontSize,
                fontFamily: "monospace",
                forceSquareRatio: true,
                bg: "#111"
            });
            document.getElementById('game-display').appendChild(this.display.getContainer());
            
            this.draw();
        }
    }
    
    setupMessaging() {
        this.messages = [];
        
        this.addMessage = (text, color = "#fff") => {
            this.messages.push({ text, color });
            
            // Update UI
            const log = document.getElementById('message-log');
            const messageElement = document.createElement('div');
            messageElement.style.color = color;
            messageElement.textContent = text;
            log.appendChild(messageElement);
            
            // Auto-scroll to bottom
            log.scrollTop = log.scrollHeight;
            
            // Limit number of messages shown
            if (log.childNodes.length > 100) {
                log.removeChild(log.firstChild);
            }
        };
        
        // Add initial message
        this.addMessage("Welcome to the dungeon!", "#ff9");
    }

    init() {
        this.level = 1;
        this.map = {};
        const dungeon = this.dungeonGen.generateStandard(this.displayWidth, this.displayHeight, this.level);
        this.map = dungeon.map;
        
        this.player = new Player(dungeon.startPosition.x, dungeon.startPosition.y);
        this.scheduler.add(this.player, true);
        
        this.entities = new Set([this.player]);
        this.generateMonsters(dungeon.rooms);
        
        this.updateStats();
        this.engine.start();
        this.draw();
    }

    updateStats() {
        const statsElement = document.getElementById('player-stats');
        if (this.player) {
            statsElement.innerHTML = `
                <div>HP: ${this.player.hp}/${this.player.maxHp}</div>
                <div>Attack: ${this.player.attack}</div>
                <div>Defense: ${this.player.defense}</div>
                <div>Level: ${this.player.level}</div>
                <div>Exp: ${this.player.exp}</div>
                <div>Dungeon Level: ${this.level}</div>
            `;
        }
    }

    draw() {
        this.display.clear();
        
        // Draw map
        for (let key in this.map) {
            const [x, y] = key.split(',').map(Number);
            this.display.draw(x, y, this.map[key]);
        }
        
        // Draw entities
        for (let entity of this.entities) {
            entity.draw();
        }
    }

    handleInput(e) {
        if (this.engine.locked) {
            const action = this.player.handleInput(e);
            if (action) {
                this.draw();
                this.updateStats();
                this.engine.unlock();
            }
        }
    }

    generateMonsters(rooms) {
        if (!rooms || rooms.length <= 1) return;
        
        // Skip the first room (player starts there)
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            const roomCenter = room.getCenter();
            
            // 50% chance to place a monster in a room
            if (Math.random() > 0.5) {
                const monster = new Monster(
                    roomCenter.x, 
                    roomCenter.y, 
                    'rat', 
                    'Giant Rat', 
                    'r', 
                    '#a55', 
                    5, 
                    2
                );
                this.entities.add(monster);
                this.scheduler.add(monster, true);
            }
        }
    }
}

// Initialize game
window.addEventListener('load', () => {
    const game = new Game();
    window.game = game;
    
    // Input handling
    window.addEventListener('keydown', (e) => {
        game.handleInput(e);
    });
});