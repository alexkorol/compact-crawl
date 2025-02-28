// compact-crawl/game.js - Core game engine and main loop
class Game {
    constructor() {
        // Game constants (moved from core.js)
        this.FOV_RADIUS = 8;
        this.WALL_TILE = '#';
        this.FLOOR_TILE = '.';
        
        // Initialize display
        this.display = new ROT.Display({
            width: 80,
            height: 30,
            fontSize: 16,
            fontFamily: "monospace",
            spacing: 1.0,
            bg: "#111"
        });

        // Add display to container
        const displayContainer = document.getElementById('game-display');
        displayContainer.innerHTML = '';
        displayContainer.appendChild(this.display.getContainer());

        // Start with title screen
        this.gameState = 'title';
        this.showTitleScreen();

        // Fix: Create a dedicated handler for title screen input
        this.titleInputHandler = (e) => {
            if (this.gameState === 'title') {
                console.log('Key pressed on title screen:', e.key);
                this.startGame();
                // Remove this listener once game starts
                window.removeEventListener('keydown', this.titleInputHandler);
            }
        };
        
        // Add the title input handler
        window.addEventListener('keydown', this.titleInputHandler);
    }

    showTitleScreen() {
        this.display.clear();
        
        const titleArt = [
            "____                                 _ ",
            "/ ___|___  _ __ ___  _ __   __ _  ___| |_ ",
            "| |   / _ \\| '_ ` _ \\| '_ \\ / _` |/ __| __|",
            "| |__| (_) | | | | | | |_) | (_| | (__| |_ ",
            "\\____\\___/|_| |_| |_| .__/ \\__,_|\\___|\\__|",
            "            \u00A0\u00A0\u00A0\u00A0                       |_|              ",                   
            "",
            "\u00A0\u00A0\u00A0          ____                    _           ",
            "\u00A0\u00A0\u00A0         / ___|_ __ __ ___      _| |           ",
            "\u00A0\u00A0\u00A0        | |   | '__/ _` \\ \\ /\\ / / |          ",
            "\u00A0\u00A0\u00A0        | |___| | | (_| |\\ V  V /| |          ",
            "\u00A0\u00A0\u00A0         \\____|_|  \\__,_| \\_/\\_/ |_|          ",
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
        console.log('Starting new game from title screen');
        
        // Change state first
        this.gameState = 'playing';
        
        // Clear the display
        this.display.clear();
        
        try {
            // Get display dimensions
            const displayWidth = this.display.getOptions().width;
            const displayHeight = this.display.getOptions().height;
            
            // Calculate actual playable area (accounting for UI)
            const topUIHeight = 2;  // Status bar (2 rows at top)
            const bottomUIHeight = 4;  // Message box (3 rows at bottom) + divider (1 row)
            
            // Fix the right wall coordinate to 75
            const rightWallX = 75;
            
            // Calculate bounds - note these are INCLUSIVE
            this.mapBounds = {
                minX: 0,
                maxX: rightWallX, // Set right boundary at x=75
                minY: topUIHeight,
                maxY: displayHeight - bottomUIHeight - 1
            };
            
            console.log("Map bounds:", this.mapBounds);
            
            // Create the map with proper boundaries
            this.map = {};
            
            // Fill entire playable area
            for (let y = 0; y < displayHeight; y++) {
                for (let x = 0; x <= rightWallX; x++) { // Only go up to x=75
                    // Is this within the game area?
                    if (y >= this.mapBounds.minY && y <= this.mapBounds.maxY) {
                        // We're in the game area
                        
                        // Add walls at the boundaries
                        if (x === 0 || x === rightWallX || y === this.mapBounds.minY || y === this.mapBounds.maxY) {
                            this.map[`${x},${y}`] = '#'; // Wall
                            if (x === rightWallX) {
                                console.log(`Right wall at ${x},${y}`);
                            }
                        } else {
                            this.map[`${x},${y}`] = '.'; // Floor
                        }
                    }
                }
            }
            
            // Verify right wall is at x=75
            console.log("Right wall coordinates (should all be at x=75):");
            for (let y = this.mapBounds.minY; y <= this.mapBounds.maxY; y++) {
                const key = `${rightWallX},${y}`;
                console.log(`  ${key}: ${this.map[key] || 'undefined'}`);
            }
            
            // Place player in center of gameplay area
            const centerX = Math.floor(rightWallX / 2);
            const centerY = Math.floor((this.mapBounds.minY + this.mapBounds.maxY) / 2);
            
            this.player = {
                x: centerX,
                y: centerY,
                hp: 10,
                maxHp: 10,
                attack: 2,
                defense: 1,
                level: 1,
                exp: 0,
                gold: 0,
                visibleTiles: {}
            };
            
            console.log(`Player placed at ${centerX},${centerY}`);
            
            // Add visible tiles calculation
            this.player.computeFOV = () => {
                this.player.visibleTiles = {};
                
                // Simple visibility - everything within radius 8 is visible
                for (let dx = -8; dx <= 8; dx++) {
                    for (let dy = -8; dy <= 8; dy++) {
                        if (dx*dx + dy*dy <= 64) { // Circle with radius 8
                            const x = this.player.x + dx;
                            const y = this.player.y + dy;
                            const key = `${x},${y}`;
                            
                            if (key in this.map) {
                                this.player.visibleTiles[key] = true;
                                this.explored[key] = true;
                            }
                        }
                    }
                }
                return this.player.visibleTiles;
            };
            
            // Initialize game state
            this.entities = new Set([this.player]);
            this.items = [];
            this.explored = {};
            this.level = 1;
            this.turns = 0;
            this.messages = [];
            
            // Add dummy monster for testing
            const monster = {
                x: 45,
                y: 15,
                name: "Test Monster",
                symbol: "M",
                color: "#f00",
                hp: 5,
                attack: 1,
                defense: 0
            };
            this.entities.add(monster);
            
            // Setup input handler
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            
            // Compute initial FOV
            this.player.computeFOV();
            
            // Draw initial state
            this.drawGame();
            
            // Setup message log
            this.addMessage = (text, color = "#fff") => {
                console.log("Message:", text);
                this.messages.unshift({text, color});
                if (this.messages.length > 50) this.messages.pop();
                
                // Update UI if any
                const msgOverlay = document.getElementById('message-overlay');
                if (msgOverlay) {
                    const msg = document.createElement('div');
                    msg.style.color = color;
                    msg.textContent = text;
                    msgOverlay.appendChild(msg);
                    
                    if (msgOverlay.children.length > 10) {
                        msgOverlay.removeChild(msgOverlay.firstChild);
                    }
                    
                    msgOverlay.scrollTop = msgOverlay.scrollHeight;
                }
            };
            
            // Add welcome message
            this.addMessage("DEBUG: Simple map created for testing", "#ff0");
            this.addMessage("Welcome to the dungeon!", "#ff0");
            
            return true;
        } catch (err) {
            console.error('Error in startGame:', err);
            return false;
        }
    }
    
    drawGame() {
        console.log('Drawing game state');
        
        try {
            this.display.clear();
            
            const displayWidth = this.display.getOptions().width;
            const displayHeight = this.display.getOptions().height;
            
            // Draw UI elements first (background layer)
            this.drawUIBackground();
            
            // Calculate visible area edge tiles for debugging
            const visibleEdges = {
                top: [],
                right: [],
                bottom: [],
                left: []
            };
            
            // Draw the map
            for (let y = this.mapBounds.minY; y <= this.mapBounds.maxY; y++) {
                for (let x = 0; x <= this.mapBounds.maxX; x++) {
                    const key = `${x},${y}`;
                    
                    // If this is an edge, add it to our debug tracker
                    if (y === this.mapBounds.minY) visibleEdges.top.push(key);
                    if (y === this.mapBounds.maxY) visibleEdges.bottom.push(key);
                    if (x === 0) visibleEdges.left.push(key);
                    if (x === this.mapBounds.maxX) visibleEdges.right.push(key);
                    
                    // Draw the tile if it exists
                    if (key in this.map) {
                        const tile = this.map[key];
                        
                        if (key in this.player.visibleTiles) {
                            // Visible tile
                            this.display.draw(x, y, tile, tile === '#' ? '#666' : '#aaa');
                        } else if (key in this.explored) {
                            // Explored but not visible
                            this.display.draw(x, y, tile, tile === '#' ? '#444' : '#666');
                        } 
                        // Always draw walls for debugging
                        else if (tile === '#') {
                            this.display.draw(x, y, tile, '#444');
                        }
                    }
                }
            }
            
            // Log edge tiles for debugging
            console.log("Edge tiles:");
            for (const edge in visibleEdges) {
                console.log(`  ${edge}: ${visibleEdges[edge].length} tiles`);
            }
            
            // Draw entities
            for (const entity of this.entities) {
                if (entity === this.player) continue; // Draw player last
                
                const key = `${entity.x},${entity.y}`;
                if (this.player.visibleTiles[key]) {
                    this.display.draw(entity.x, entity.y, entity.symbol || 'E', entity.color || '#f00');
                }
            }
            
            // Draw player
            this.display.draw(this.player.x, this.player.y, '@', '#ff0');
            
            // Draw Stats Header
            const statsText = `HP: ${this.player.hp}/${this.player.maxHp} | Level: ${this.player.level} | XP: ${this.player.exp} | Gold: ${this.player.gold || 0}`;
            this.display.drawText(1, 0, `%c{#fff}%b{#000}${statsText.padEnd(displayWidth - 2)}`);
            
            // Draw top divider
            for (let x = 0; x < displayWidth; x++) {
                this.display.draw(x, 1, '─', '#555');
            }
            
            // Draw bottom divider
            for (let x = 0; x < displayWidth; x++) {
                this.display.draw(x, displayHeight - 4, '─', '#555');
            }
            
            // Draw messages
            if (this.messages && this.messages.length > 0) {
                for (let i = 0; i < Math.min(3, this.messages.length); i++) {
                    const msg = this.messages[i];
                    const text = msg.text.padEnd(displayWidth - 2);
                    this.display.drawText(1, displayHeight - 3 + i, 
                        `%c{${msg.color || '#fff'}}%b{#000}${text}`);
                }
            }
            
            // Update external UI state (keep it hidden)
            this.updateExternalUI();
            
            console.log('Draw complete');
            return true;
        } catch (err) {
            console.error('Error in drawGame:', err);
            return false;
        }
    }
    
    drawUIBackground() {
        const displayWidth = this.display.getOptions().width;
        const displayHeight = this.display.getOptions().height;
        
        // Top stats bar background (2 rows)
        for (let x = 0; x < displayWidth; x++) {
            for (let y = 0; y < 2; y++) {
                this.display.draw(x, y, ' ', '#fff', '#000');
            }
        }
        
        // Bottom message area background (4 rows counting divider)
        for (let x = 0; x < displayWidth; x++) {
            for (let y = displayHeight - 4; y < displayHeight; y++) {
                this.display.draw(x, y, ' ', '#fff', '#000');
            }
        }
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        
        console.log('Key pressed:', e.key);
        
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
            const newX = this.player.x + dx;
            const newY = this.player.y + dy;
            const key = `${newX},${newY}`;
            
            // Improved movement validation
            console.log(`Attempted move to ${newX},${newY}`);
            
            // Check if movement is within map bounds - BELT AND SUSPENDERS
            if (newX < this.mapBounds.minX || newX > this.mapBounds.maxX || 
                newY < this.mapBounds.minY || newY > this.mapBounds.maxY) {
                console.log(`Movement outside map bounds (${this.mapBounds.minX},${this.mapBounds.minY})-(${this.mapBounds.maxX},${this.mapBounds.maxY})`);
                return;
            }
            
            // Check if the tile exists in our map (it should, but double check)
            if (!this.map[key]) {
                console.log(`Movement to undefined tile at ${key}`);
                return;
            }
            
            // Check if the tile is walkable (not a wall)
            if (this.map[key] !== '.') {
                console.log(`Movement to non-floor tile: ${this.map[key]}`);
                return;
            }
            
            // Move is valid, update player position
            this.player.x = newX;
            this.player.y = newY;
            this.player.computeFOV();
            this.drawGame();
            
            console.log(`Player moved to ${this.player.x},${this.player.y}`);
        }
    }
    
    placeEntities(rooms) {
        // Place monsters in rooms (except first room)
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            
            // 60% chance to place monster
            if (Math.random() > 0.4) {
                // Choose monster type based on level
                let monsterTypes = Object.keys(MONSTERS);
                let monsterType;
                
                // Simple level-based selection
                if (this.level <= 2) {
                    // Only basic monsters on early levels
                    monsterType = monsterTypes[Math.floor(Math.random() * 2)];
                } else if (this.level <= 4) {
                    // No high-level monsters yet
                    monsterType = monsterTypes[Math.floor(Math.random() * (monsterTypes.length - 1))];
                } else {
                    // All monster types
                    monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
                }
                
                // Get monster data
                const monsterData = MONSTERS[monsterType];
                
                // Place monster at random position in room
                const x = Math.floor(Math.random() * (room.getRight() - room.getLeft() - 2)) + room.getLeft() + 1;
                const y = Math.floor(Math.random() * (room.getBottom() - room.getTop() - 2)) + room.getTop() + 1;
                
                // Create monster
                const monster = new Monster(x, y, monsterData);
                this.entities.add(monster);
                this.scheduler.add(monster, true);
            }
            
            // Place items (30% chance)
            if (Math.random() > 0.7) {
                // Choose random item type
                const itemTypes = Object.keys(ITEMS);
                const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                const itemData = ITEMS[itemType];
                
                // Random position in room
                const x = Math.floor(Math.random() * (room.getRight() - room.getLeft() - 2)) + room.getLeft() + 1;
                const y = Math.floor(Math.random() * (room.getBottom() - room.getTop() - 2)) + room.getTop() + 1;
                
                // Add item
                this.items.push({
                    x,
                    y,
                    type: itemType,
                    ...itemData
                });
            }
        }
    }
    
    setupGameInputHandler() {
        // Handle keyboard input for gameplay
        this.gameInputHandler = (e) => {
            if (this.gameState !== 'playing' || !this.engine) return;
            
            if (!this.engine.locked) return;
            
            const keyMap = {
                'ArrowUp': [0, -1],
                'ArrowDown': [0, 1],
                'ArrowLeft': [-1, 0],
                'ArrowRight': [1, 0],
                'k': [0, -1],
                'j': [0, 1],
                'h': [-1, 0],
                'l': [1, 0],
                'y': [-1, -1],
                'u': [1, -1],
                'b': [-1, 1],
                'n': [1, 1]
            };
            
            let moved = false;
            
            if (e.key in keyMap) {
                const [dx, dy] = keyMap[e.key];
                moved = this.movePlayer(dx, dy);
            }
            
            // Wait with space or period
            if (e.key === '.' || e.key === ' ') {
                this.turns++;
                this.moveMonsters();
                moved = true;
            }
            
            if (moved) {
                this.draw();
                this.updateStats();
            }
        };
        
        window.addEventListener('keydown', this.gameInputHandler);
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

    movePlayer(dx, dy) {
        // Calculate new position
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        const key = `${newX},${newY}`;
        
        // Check if position is valid
        if (!(key in this.map)) return false;
        
        // Check for wall
        if (this.map[key] === this.WALL_TILE) return false;
        
        // Check for entity
        for (const entity of this.entities) {
            if (entity !== this.player && entity.x === newX && entity.y === newY) {
                // Attack entity
                this.attackEntity(entity);
                return true;
            }
        }
        
        // Check for item
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (item.x === newX && item.y === newY) {
                // Pick up item
                this.pickUpItem(item, i);
                return true;
            }
        }
        
        // Move player
        this.player.x = newX;
        this.player.y = newY;
        this.player.computeFOV();
        this.turns++;
        
        // Process monsters
        this.moveMonsters();
        
        return true;
    }
    
    attackEntity(entity) {
        // Calculate damage
        const damage = Math.max(1, this.player.attack - entity.defense);
        
        // Apply damage
        entity.hp -= damage;
        
        // Add message
        this.addMessage(`You hit the ${entity.name} for ${damage} damage.`);
        
        // Check if entity is dead
        if (entity.hp <= 0) {
            this.addMessage(`You killed the ${entity.name}!`, CONFIG.colors.ui.highlight);
            
            // Remove entity
            this.entities.delete(entity);
            this.scheduler.remove(entity);
            
            // Gain experience and gold
            this.player.exp += entity.exp;
            this.player.gold = (this.player.gold || 0) + Math.floor(Math.random() * entity.exp) + 1;
            
            // Check for level up
            this.checkLevelUp();
        } else {
            // Entity attacks back
            const entityDamage = Math.max(1, entity.attack - this.player.defense);
            this.player.hp -= entityDamage;
            
            // Add message
            this.addMessage(`The ${entity.name} hits you for ${entityDamage} damage.`, CONFIG.colors.ui.warning);
            
            // Check if player is dead
            if (this.player.hp <= 0) {
                this.gameOver();
            }
        }
    }
    
    pickUpItem(item, index) {
        switch (item.type) {
            case 'potion':
                // Heal player
                const healAmount = Math.floor(this.player.maxHp / 2);
                this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
                this.addMessage(`You drink a healing potion and recover ${healAmount} HP.`);
                break;
            case 'gold':
                // Add gold
                this.player.gold = (this.player.gold || 0) + item.value;
                this.addMessage(`You pick up ${item.value} gold.`);
                break;
            case 'weapon':
                // Increase attack
                this.player.attack += item.attack || 1;
                this.addMessage(`You equip a weapon and gain ${item.attack || 1} attack.`);
                break;
            case 'armor':
                // Increase defense
                this.player.defense += item.defense || 1;
                this.addMessage(`You equip armor and gain ${item.defense || 1} defense.`);
                break;
            case 'scroll':
                // Random effect based on scroll type
                if (item.effect === 'teleport') {
                    this.teleportPlayer();
                } else {
                    // Generic buff
                    this.player.attack += 1;
                    this.addMessage(`You read a mysterious scroll and feel stronger!`);
                }
                break;
        }
        
        // Remove item from game
        this.items.splice(index, 1);
    }
    
    teleportPlayer() {
        // Find a random floor tile
        const floorTiles = [];
        for (const key in this.map) {
            if (this.map[key] === this.FLOOR_TILE) {
                const [x, y] = key.split(',').map(Number);
                floorTiles.push({x, y});
            }
        }
        
        if (floorTiles.length > 0) {
            const pos = floorTiles[Math.floor(Math.random() * floorTiles.length)];
            this.player.x = pos.x;
            this.player.y = pos.y;
            this.player.computeFOV();
            this.addMessage('You teleport to a new location!', CONFIG.colors.ui.highlight);
        }
    }
    
    moveMonsters() {
        // Process monster movement
        for (const entity of this.entities) {
            if (entity === this.player) continue;
            
            // Only move if in FOV
            const key = `${entity.x},${entity.y}`;
            if (!(key in this.player.visibleTiles)) continue;
            
            // Simple path to player
            const astar = new ROT.Path.AStar(this.player.x, this.player.y, (x, y) => {
                const key = `${x},${y}`;
                return key in this.map && this.map[key] !== this.WALL_TILE;
            });
            
            const path = [];
            astar.compute(entity.x, entity.y, (x, y) => {
                path.push([x, y]);
            });
            
            // Skip first position (current)
            if (path.length > 1) {
                const [newX, newY] = path[1];
                
                // Check if new position is player
                if (newX === this.player.x && newY === this.player.y) {
                    // Attack player
                    const damage = Math.max(1, entity.attack - this.player.defense);
                    this.player.hp -= damage;
                    
                    this.addMessage(`The ${entity.name} hits you for ${damage} damage.`, CONFIG.colors.ui.warning);
                    
                    // Check if player is dead
                    if (this.player.hp <= 0) {
                        this.gameOver();
                    }
                } else {
                    // Check if position is available
                    let canMove = true;
                    
                    // Check for other entities
                    for (const other of this.entities) {
                        if (other !== entity && other.x === newX && other.y === newY) {
                            canMove = false;
                            break;
                        }
                    }
                    
                    // Move if position is available
                    if (canMove) {
                        entity.x = newX;
                        entity.y = newY;
                    }
                }
            }
        }
    }
    
    checkLevelUp() {
        // Simple level up formula
        const nextLevel = this.player.level * 10;
        
        if (this.player.exp >= nextLevel) {
            this.player.level++;
            this.player.maxHp += 2;
            this.player.hp = this.player.maxHp;
            this.player.attack += 1;
            
            this.addMessage(`You reached level ${this.player.level}!`, CONFIG.colors.ui.highlight);
        }
    }

    draw() {
        if (this.gameState !== 'playing') return;
        
        console.log('Drawing game state');
        this.display.clear();
        
        // Draw map with FOV
        for (let key in this.map) {
            const [x, y] = key.split(',').map(Number);
            const tile = this.map[key];
            
            if (key in this.player.visibleTiles) {
                // Visible tiles
                this.display.draw(x, y, tile, tile === this.WALL_TILE ? 
                    CONFIG.colors.wall.visible : CONFIG.colors.floor.visible);
            } else if (key in this.explored) {
                // Explored but not visible tiles
                this.display.draw(x, y, tile, tile === this.WALL_TILE ? 
                    CONFIG.colors.wall.explored : CONFIG.colors.floor.explored);
            }
        }
        
        // Draw items (only if visible)
        for (const item of this.items) {
            const key = `${item.x},${item.y}`;
            if (key in this.player.visibleTiles) {
                this.display.draw(item.x, item.y, item.symbol, item.color);
            }
        }
        
        // Draw entities (only if visible)
        for (const entity of this.entities) {
            if (entity === this.player) continue; // Player drawn last

            const key = `${entity.x},${entity.y}`;
            if (key in this.player.visibleTiles) {
                this.display.draw(entity.x, entity.y, entity.symbol, entity.color);
            }
        }
        
        // Draw player
        this.display.draw(this.player.x, this.player.y, '@', CONFIG.colors.entities.player);
        
        // Draw messages and stats
        this.drawMessages();
        this.drawStats();
    }
    
    drawMessages() {
        // Show recent messages at bottom
        const recentMessages = this.messages.slice(0, 3);
        for (let i = 0; i < recentMessages.length; i++) {
            const msg = recentMessages[i];
            this.display.drawText(1, this.display.getOptions().height - 4 + i, 
                `%c{${msg.color || CONFIG.colors.ui.text}}${msg.text}`);
        }
    }
    
    drawStats() {
        // Draw player stats at top
        let statsText = `HP: ${this.player.hp}/${this.player.maxHp} | Atk: ${this.player.attack} | Def: ${this.player.defense}`;
        statsText += ` | Lvl: ${this.player.level} | XP: ${this.player.exp} | Gold: ${this.player.gold || 0}`;
        
        this.display.drawText(1, 0, `%c{${CONFIG.colors.ui.text}}${statsText}`);
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

    addMessage(text, color = CONFIG.colors.ui.text) {
        // Only update internal message array, don't use DOM elements
        console.log("Message:", text);
        this.messages.unshift({text, color});
        if (this.messages.length > 50) this.messages.pop();
        
        // Redraw game to show the new message
        this.drawGame();
    }

    gameOver() {
        this.gameState = 'gameover';
        this.addMessage("You died!", CONFIG.colors.ui.warning);
        this.addMessage("Game over...", CONFIG.colors.ui.warning);
        
        // Draw final state
        this.draw();
        
        // Show game over message
        const gameOverY = Math.floor(this.display.getOptions().height / 2);
        this.display.drawText(0, gameOverY, `%c{${CONFIG.colors.ui.warning}}%b{#000}GAME OVER`.padStart(40));
        
        // Reset after delay
        setTimeout(() => {
            this.gameState = 'title';
            this.showTitleScreen();
        }, 3000);
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

    updateExternalUI() {
        // Hide the external UI elements as we're using the in-game versions
        const statsOverlay = document.getElementById('stats-overlay');
        if (statsOverlay) {
            statsOverlay.style.display = 'none';
        }
        
        const messageOverlay = document.getElementById('message-overlay');
        if (messageOverlay) {
            messageOverlay.style.display = 'none';
        }
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