// compact-crawl/game.js - Core game engine and main loop
class Game {
    constructor() {
        this.display = new ROT.Display({
            width: 80,
            height: 30,
            fontSize: 16,
            fontFamily: "monospace",
            spacing: 1.0,
            bg: "#111"
        });

        const displayContainer = document.getElementById('game-display');
        displayContainer.innerHTML = '';
        displayContainer.appendChild(this.display.getContainer());

        this.gameState = 'title';
        this.showTitleScreen();

        // Single event listener for all game states
        window.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key, 'Game state:', this.gameState);
            
            if (this.gameState === 'title') {
                console.log('Starting game...');
                this.startGame();
            } else if (this.gameState === 'playing' && this.engine.locked) {
                console.log('Processing player input...');
                const action = this.player.handleInput(e);
                if (action) {
                    this.player.computeFOV();
                    this.draw();
                    this.updateStats();
                    this.engine.unlock();
                }
            }
        });
    }

    showTitleScreen() {
        this.display.clear();
        
        const titleArt = [
            "____                                 _ ",
            "/ ___|___  _ __ ___  _ __   __ _  ___| |_ ",
            "| |   / _ \\| '_ ` _ \\| '_ \\ / _` |/ __| __|",
            "| |__| (_) | | | | | | |_) | (_| | (__| |_ ",
            "\\____\\___/|_| |_| |_| .__/ \\__,_|\\___|\\__|",
            "            ____                       |_|              ",                      
            "",
            "          ____                    _       ",
            "         / ___|_ __ __ ___      _| |        ",
            "        | |   | '__/ _` \\ \\ /\\ / / |         ",
            "        | |__ | | | (_| |\\ V  V /| |          ",
            "         \\____|_|  \\__,_| \\_/\\_/ |_|        ",
            "",
            "",
            "        @ PRESS ANY KEY TO DESCEND @"
        ];
        
        const startY = Math.floor((this.display.getOptions().height - titleArt.length) / 2) - 2;
        
        // Draw title with shadow effect
        titleArt.forEach((line, i) => {
            const x = Math.floor((this.display.getOptions().width - line.length) / 2);
            // Draw shadow
            this.display.drawText(x + 1, startY + i + 1, `%c{#222}${line}`);
            // Draw main text
            this.display.drawText(x, startY + i, `%c{#ff9}${line}`);
        });
        
        // Make press key message blink
        let visible = true;
        const blink = setInterval(() => {
            if (this.gameState !== 'title') {
                clearInterval(blink);
                return;
            }
            const message = "        @ PRESS ANY KEY TO DESCEND @";
            const messageX = Math.floor((this.display.getOptions().width - message.length) / 2);
            const messageY = startY + titleArt.length - 1;
            this.display.drawText(messageX, messageY, 
                visible ? `%c{#fff}${message}` : " ".repeat(message.length));
            visible = !visible;
        }, 500);
    }

    startGame() {
        console.log('Initializing new game');
        this.gameState = 'playing';

        // Initialize core systems
        this.scheduler = new ROT.Scheduler.Simple();
        this.engine = new ROT.Engine(this.scheduler);
        this.dungeonGen = new DungeonGenerator(this);
        this.entities = new Set();
        this.level = 1;
        this.explored = {};

        // Generate initial dungeon
        const dungeon = this.dungeonGen.generateStandard(80, 30, this.level);
        console.log('Dungeon generated:', dungeon);
        this.map = dungeon.map;

        // Create player
        this.player = new Player(dungeon.startPosition.x, dungeon.startPosition.y);
        this.entities.add(this.player);
        this.scheduler.add(this.player, true);
        
        // Initial FOV computation
        this.player.computeFOV();
        
        // Start game systems
        this.setupMessaging();
        this.addMessage("Welcome to the dungeon!", "#ff9");
        this.updateStats();
        this.draw();
        
        console.log('Starting game engine');
        this.engine.start();
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
        console.log('Initializing game world');
        
        // Generate dungeon with proper dimensions
        const dungeon = this.dungeonGen.generateStandard(
            this.display.getOptions().width,
            this.display.getOptions().height,
            this.level
        );
        
        console.log("Generated dungeon:", dungeon);
        console.log("Map data:", Object.keys(dungeon.map).length, "cells");
        console.log("Start position:", dungeon.startPosition);
        
        this.map = dungeon.map;
        
        // Create player at start position
        this.player = new Player(dungeon.startPosition.x, dungeon.startPosition.y);
        
        console.log("Player created at", this.player.x, this.player.y);
        
        this.entities.add(this.player);
        this.scheduler.add(this.player, true);
        
        // Compute initial FOV
        this.player.computeFOV();
        
        // Start game engine
        this.engine.start();
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
        if (this.gameState !== 'playing') return;
        
        console.log('Drawing game state');
        this.display.clear();
        
        // Draw the map (floors and walls)
        for (let key in this.map) {
            const [x, y] = key.split(',').map(Number);
            const tile = this.map[key];
            
            // Always draw tiles for debugging
            this.display.draw(x, y, tile, tile === '#' ? '#666' : '#aaa');
        }
        
        // Draw the player
        this.display.draw(this.player.x, this.player.y, '@', '#ff0');
        
        console.log('Draw complete');
    }

    handleInput(e) {
        if (this.engine.locked) {
            const action = this.player.handleInput(e);
            if (action) {
                // Recompute FOV after movement
                this.player.computeFOV();
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

    isVisible(x, y) {
        const key = `${x},${y}`;
        return this.player.visibleTiles[key];
    }
    
    getMonsterAt(x, y) {
        for (let entity of this.entities) {
            if (entity !== this.player && entity instanceof Monster && 
                entity.x === x && entity.y === y) {
                return entity;
            }
        }
        return null;
    }
    
    removeMonster(monster) {
        this.entities.delete(monster);
        this.scheduler.remove(monster);
    }
    
    gameOver() {
        this.addMessage("Game Over!", CONFIG.colors.ui.warning);
        this.gameData.deleteSaveData();
        this.engine.lock();
        // Could add restart option here
    }
}

// Simple distance calculator function
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Initialize game
window.addEventListener('load', () => {
    console.log('Creating new game instance');
    window.game = new Game();
});