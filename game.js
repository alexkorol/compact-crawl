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
            bg: "#111",
            forceSquareRatio: true   // <-- Added to force square tiles
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
                this.showGameModeMenu();
                // We'll remove the listener when a game actually starts
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
            "            \u00A0\u00A0                   |_|              ",                   
            "",
            "\u00A0\u00A0\u00A0          ____                    _           ",
            "\u00A0\u00A0\u00A0         / ___|_ __ __ ___      _| |           ",
            "\u00A0\u00A0\u00A0        | |   | '__/ _` \\ \\ /\\ / / |          ",
            "\u00A0\u00A0\u00A0        | |___| | | (_| |\\ V  V /| |          ",
            "\u00A0\u00A0\u00A0         \\____|_|  \\__,_| \\_/\\_/ |_|          ",
            "",
            "",
            "\u00A0      @ PRESS ANY KEY TO CONTINUE @"
        ];
        
        const columns = this.display.getOptions().width;
        const shift = 18; // Adjust shift to move the art further left
        const startY = Math.floor((this.display.getOptions().height - titleArt.length) / 2);
        titleArt.forEach((line, i) => {
            // Subtract a fixed shift value from the center offset
            const x = Math.max(0, Math.floor((columns - line.length) / 2) - shift);
            this.display.drawText(x, startY + i, `%c{#ff9}${line}`);
        });

        // Add help text below the "PRESS ANY KEY" line
        const helpText = "(R to restart after game over)";
        const helpX = Math.max(0, Math.floor((this.display.getOptions().width - helpText.length) / 2));
        this.display.drawText(helpX, startY + titleArt.length + 1, `%c{#999}${helpText}`);
    }
    
    // New method to display game mode selection menu
    showGameModeMenu() {
        this.gameState = 'menu';
        this.display.clear();
        
        const menuTitle = "SELECT GAME MODE";
        const menuOptions = [
            "1) Main Game - Explore the dungeon",
            "2) Arena Mode - Fight waves of monsters",
            "3) Sandbox - Experiment with game mechanics"
        ];
        
        const columns = this.display.getOptions().width;
        const centerX = Math.floor(columns / 2);
        const startY = Math.floor(this.display.getOptions().height / 3);
        
        // Draw menu title
        this.display.drawText(
            Math.floor(centerX - menuTitle.length / 2),
            startY - 3,
            `%c{#fff}${menuTitle}`
        );
        
        // Draw menu options
        menuOptions.forEach((option, i) => {
            this.display.drawText(
                Math.floor(centerX - option.length / 2),
                startY + i * 2,
                `%c{#ff9}${option}`
            );
        });
        
        // Add instructions
        this.display.drawText(
            Math.floor(centerX - 20 / 2),
            startY + menuOptions.length * 2 + 2,
            '%c{#999}Press 1, 2, or 3 to select'
        );
        
        // Update input handler for menu selection
        window.removeEventListener('keydown', this.titleInputHandler);
        this.menuInputHandler = (e) => {
            if (this.gameState !== 'menu') return;
            
            console.log('Menu selection key:', e.key);
            switch(e.key) {
                case '1':
                    this.startGame('main');
                    break;
                case '2':
                    this.startGame('arena');
                    break;
                case '3':
                    this.startGame('sandbox');
                    break;
                default:
                    // Ignore other keys
                    break;
            }
        };
        
        window.addEventListener('keydown', this.menuInputHandler);
    }

    // Update startGame to handle different game modes
    startGame(gameMode = 'main') {
        console.log(`Starting new game in ${gameMode} mode`);
        
        // Remove menu input handler
        window.removeEventListener('keydown', this.menuInputHandler);
        
        // Change state first
        this.gameState = 'playing';
        this.gameMode = gameMode;
        
        // Dispatch event for mode change
        const event = new CustomEvent('gameModeChanged', {
            detail: { mode: gameMode }
        });
        document.dispatchEvent(event);
        
        // Clear the display and reset game state
        this.display.clear();
        this.entities = new Set();
        this.items = [];
        this.explored = {};
        this.messages = [];
        
        try {
            // Get display dimensions
            const displayWidth = this.display.getOptions().width;
            const displayHeight = this.display.getOptions().height;
            
            // Calculate actual playable area (accounting for UI)
            const topUIHeight = 2;  // Status bar (2 rows at top)
            const bottomUIHeight = 4;  // Message box (3 rows at bottom) + divider (1 row)
            
            // Fix the right wall coordinate to 42 now
            const rightWallX = 42;
            
            // Calculate bounds - note these are INCLUSIVE
            this.mapBounds = {
                minX: 0,
                maxX: rightWallX, // Set right boundary at x=42
                minY: topUIHeight,
                maxY: displayHeight - bottomUIHeight - 1
            };
            
            console.log("Map bounds:", this.mapBounds);
            
            // Create the map with proper boundaries
            this.map = {};
            
            // Fill entire playable area
            for (let y = 0; y < displayHeight; y++) {
                for (let x = 0; x <= rightWallX; x++) { // Only go up to x=42
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
            
            // Verify right wall is at x=42
            console.log("Right wall coordinates (should all be at x=42):");
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
            
            // Set up game based on selected mode
            switch(gameMode) {
                case 'main':
                    // Normal game setup - already handled by existing code
                    this.spawnTestMonsters();
                    this.addMessage(`Welcome to the main game mode!`, "#ff0");
                    break;
                case 'arena':
                    // Arena mode setup
                    this.setupArenaMode();
                    break;
                case 'sandbox':
                    // Sandbox mode setup
                    this.setupSandboxMode();
                    break;
            }
            
            // Setup input handler - make sure we bind it and store the bound reference
            this.boundHandleKeyDown = this.handleKeyDown.bind(this);
            document.addEventListener('keydown', this.boundHandleKeyDown);
            
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
    
    // Add new methods for special game modes
    setupArenaMode() {
        // Add arena-specific setup
        this.arenaWave = 1;
        this.arenaScore = 0;
        
        // Clear any existing monsters
        for (const entity of this.entities) {
            if (entity !== this.player) {
                this.entities.delete(entity);
            }
        }
        
        // Enhance player for arena mode
        this.player.hp = 20;
        this.player.maxHp = 20;
        this.player.attack = 4;
        this.player.defense = 2;
        
        // Spawn first wave of monsters
        this.spawnArenaWave();
        
        // Add arena welcome message
        this.addMessage(`Arena Mode: Survive as many waves as you can!`, "#ff0");
        this.addMessage(`Wave ${this.arenaWave} begins...`, "#f55");
    }

    // Fix sandbox mode font detection error

// Update the setupSandboxMode method to properly access font detection functions
setupSandboxMode() {
    // Sandbox mode with enhanced player and testing features
    this.player.hp = 100;
    this.player.maxHp = 100;
    this.player.attack = 10;
    this.player.defense = 5;
    
    // Get available fonts using the global function
    try {
        // Check if the font detection function is available globally
        if (typeof window.detectSystemFonts === 'function') {
            // Use the global function
            this.availableFonts = window.detectSystemFonts();
        } else if (typeof window.isFontAvailable === 'function') {
            // Fallback to filtering with isFontAvailable if available
            const defaultFonts = [
                "monospace", 
                "Courier New", 
                "Consolas", 
                "DejaVu Sans Mono",
                "Lucida Console", 
                "Monaco",
                "Fira Code",
                "Source Code Pro",
                "Roboto Mono",
                "Ubuntu Mono",
                "Inconsolata"
            ];
            
            this.availableFonts = defaultFonts.filter(font => 
                window.isFontAvailable(font)
            );
            
            // Add special system-specific fonts
            if (navigator.userAgent.indexOf("Windows") !== -1) {
                ["Cascadia Code", "Fixedsys", "Terminal"].forEach(font => {
                    if (window.isFontAvailable(font)) this.availableFonts.push(font);
                });
            } else if (navigator.userAgent.indexOf("Mac") !== -1) {
                ["Menlo", "SF Mono", "Andale Mono"].forEach(font => {
                    if (window.isFontAvailable(font)) this.availableFonts.push(font);
                });
            } else {
                ["Liberation Mono", "Noto Mono", "FreeMono"].forEach(font => {
                    if (window.isFontAvailable(font)) this.availableFonts.push(font);
                });
            }
        } else {
            // Fallback to basic fonts if no font detection is available
            console.warn("Font detection functions not available - using basic fonts");
            this.availableFonts = [
                "monospace", 
                "Courier New", 
                "Consolas", 
                "DejaVu Sans Mono",
                "Lucida Console"
            ];
        }
    } catch (err) {
        console.error("Error detecting fonts:", err);
        // Fallback to just monospace
        this.availableFonts = ["monospace"];
    }
    
    console.log("Available fonts:", this.availableFonts);
    
    this.currentFontIndex = 0;
    
    // Font sizes to test
    this.availableFontSizes = [12, 14, 16, 18, 20, 22, 24];
    this.currentFontSizeIndex = 2; // Start with 16px
    
    // Initialize sandbox control panel
    this.showSandboxControls();
    
    // Spawn various monster types for testing
    this.spawnTestMonsterPack();
    
    // Add sandbox welcome message
    this.addMessage(`Sandbox Mode: Test game mechanics freely.`, "#ff0");
    this.addMessage(`Press [F1] to show sandbox controls`, "#5cf");
    this.addMessage(`You have enhanced stats for testing.`, "#5cf");
}

    showSandboxControls() {
        // Create sandbox control panel if it doesn't exist
        let sandboxPanel = document.getElementById('sandbox-panel');
        
        if (!sandboxPanel) {
            sandboxPanel = document.createElement('div');
            sandboxPanel.id = 'sandbox-panel';
            sandboxPanel.style.cssText = 'position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.8); border: 1px solid #555; padding: 10px; z-index: 1000; color: #fff; font-family: monospace;';
            
            document.body.appendChild(sandboxPanel);
        }
        
        // Create font preview section
        let fontPreviewDiv = document.getElementById('font-preview');
        if (!fontPreviewDiv) {
            fontPreviewDiv = document.createElement('div');
            fontPreviewDiv.id = 'font-preview';
            fontPreviewDiv.style.cssText = 'position: fixed; bottom: 10px; left: 10px; width: 300px; background: rgba(0,0,0,0.8); border: 1px solid #555; padding: 10px; z-index: 1000; color: #fff; display: none;';
            document.body.appendChild(fontPreviewDiv);
        }
        
        sandboxPanel.innerHTML = `
            <h3>Sandbox Controls</h3>
            <div>
                <h4>Font Options</h4>
                <div>
                    <label>Font Family:</label>
                    <select id="font-family-select">
                        ${this.availableFonts.map((font, index) => 
                            `<option value="${index}" ${index === this.currentFontIndex ? 'selected' : ''}>${font}</option>`
                        ).join('')}
                    </select>
                    <button onclick="window.game.changeFont()">Apply Font</button>
                    <button onclick="window.game.toggleFontPreview()">Show Preview</button>
                </div>
                <div style="margin-top: 10px;">
                    <label>Font Size:</label>
                    <select id="font-size-select">
                        ${this.availableFontSizes.map((size, index) => 
                            `<option value="${index}" ${index === this.currentFontSizeIndex ? 'selected' : ''}>${size}px</option>`
                        ).join('')}
                    </select>
                    <button onclick="window.game.changeFontSize()">Apply Size</button>
                </div>
                <div id="current-font-info" style="margin-top: 5px; font-size: 12px;">
                    Current: ${this.availableFonts[this.currentFontIndex]} ${this.availableFontSizes[this.currentFontSizeIndex]}px
                </div>
            </div>
            <div style="margin-top: 15px;">
                <h4>Monster & Environment</h4>
                <button onclick="window.game.spawnTestMonsterPack()">Spawn Monsters</button>
                <button onclick="window.game.clearMonsters()">Clear Monsters</button>
                <button onclick="window.game.generateNewMap()">Generate New Map</button>
            </div>
            <div style="margin-top: 15px;">
                <h4>Player Options</h4>
                <button onclick="window.game.healPlayer()">Heal Player</button>
                <button onclick="window.game.increasePlayerStats()">Buff Stats</button>
                <button onclick="window.game.teleportPlayer()">Random Teleport</button>
            </div>
            <div style="margin-top: 15px;">
                <h4>Display Options</h4>
                <div>
                    <label>
                        <input type="checkbox" id="show-fov" checked onchange="window.game.toggleFOV(this.checked)">
                        Show FOV
                    </label>
                </div>
                <div>
                    <label>
                        <input type="checkbox" id="show-grid" onchange="window.game.toggleGrid(this.checked)">
                        Show Grid
                    </label>
                </div>
            </div>
            <div style="margin-top: 10px;">
                <button onclick="document.getElementById('sandbox-panel').style.display='none'">Hide Panel</button>
                <small style="display: block; margin-top: 5px;">Press F1 to show panel again</small>
            </div>
        `;
        
        // Set up event listeners for the panel's selects
        document.getElementById('font-family-select').addEventListener('change', (e) => {
            this.currentFontIndex = parseInt(e.target.value);
            document.getElementById('current-font-info').textContent = 
                `Current: ${this.availableFonts[this.currentFontIndex]} ${this.availableFontSizes[this.currentFontSizeIndex]}px`;
        });
        
        document.getElementById('font-size-select').addEventListener('change', (e) => {
            this.currentFontSizeIndex = parseInt(e.target.value);
            document.getElementById('current-font-info').textContent = 
                `Current: ${this.availableFonts[this.currentFontIndex]} ${this.availableFontSizes[this.currentFontSizeIndex]}px`;
        });
    }

    changeFont() {
        const newFont = this.availableFonts[this.currentFontIndex];
        console.log(`Changing font to: ${newFont}`);
        
        // Create a new display with the same options but different font
        const oldOptions = this.display.getOptions();
        const newOptions = {...oldOptions, fontFamily: newFont};
        
        // Replace the display
        this.replaceDisplay(newOptions);
        this.addMessage(`Font changed to ${newFont}`, CONFIG.colors.ui.highlight);
        
        // Update current font info
        const fontInfoElement = document.getElementById('current-font-info');
        if (fontInfoElement) {
            fontInfoElement.textContent = `Current: ${newFont} ${this.availableFontSizes[this.currentFontSizeIndex]}px`;
        }
        
        // Update font preview if visible
        const previewDiv = document.getElementById('font-preview');
        if (previewDiv && previewDiv.style.display !== 'none') {
            this.updateFontPreview();
        }
    }

    changeFontSize() {
        const newSize = this.availableFontSizes[this.currentFontSizeIndex];
        console.log(`Changing font size to: ${newSize}px`);
        
        // Create a new display with the same options but different font size
        const oldOptions = this.display.getOptions();
        const newOptions = {...oldOptions, fontSize: newSize};
        
        // Replace the display
        this.replaceDisplay(newOptions);
        this.addMessage(`Font size changed to ${newSize}px`, CONFIG.colors.ui.highlight);
        
        // Update current font info
        const fontInfoElement = document.getElementById('current-font-info');
        if (fontInfoElement) {
            fontInfoElement.textContent = 
                `Current: ${this.availableFonts[this.currentFontIndex]} ${newSize}px`;
        }
    }

    replaceDisplay(newOptions) {
        // Store current state
        const currentState = {
            entities: this.entities,
            player: this.player,
            map: this.map,
            mapBounds: this.mapBounds,
            messages: this.messages,
            gameState: this.gameState,
            gameMode: this.gameMode
        };
        
        // Remove old display
        const displayContainer = document.getElementById('game-display');
        displayContainer.innerHTML = '';
        
        // Create new display with new options
        this.display = new ROT.Display(newOptions);
        displayContainer.appendChild(this.display.getContainer());
        
        // Restore state
        this.entities = currentState.entities;
        this.player = currentState.player;
        this.map = currentState.map;
        this.mapBounds = currentState.mapBounds;
        this.messages = currentState.messages;
        this.gameState = currentState.gameState;
        this.gameMode = currentState.gameMode;
        
        // Redraw everything
        this.player.computeFOV();
        this.drawGame();
    }

    clearMonsters() {
        // Remove all entities except player
        const entities = new Set();
        entities.add(this.player);
        
        const removedCount = this.entities.size - 1;
        this.entities = entities;
        
        this.addMessage(`Removed ${removedCount} monsters`, CONFIG.colors.ui.info);
        this.drawGame();
    }

    healPlayer() {
        this.player.hp = this.player.maxHp;
        this.addMessage("Player fully healed", CONFIG.colors.ui.highlight);
        this.drawGame();
    }

    increasePlayerStats() {
        this.player.attack += 2;
        this.player.defense += 1;
        this.player.maxHp += 10;
        this.player.hp = this.player.maxHp;
        
        this.addMessage(`Stats increased: ATK +2, DEF +1, HP +10`, CONFIG.colors.ui.highlight);
        this.drawGame();
    }

    generateNewMap() {
        // Generate a different map layout
        this.addMessage("Generating new map...", CONFIG.colors.ui.info);
        
        // Clear entities except player
        this.clearMonsters();
        
        // Clear the map
        this.map = {};
        
        // Create a new map with cellular automata for interesting cave-like structures
        const mapGen = new ROT.Map.Cellular(this.mapBounds.maxX, this.mapBounds.maxY - this.mapBounds.minY);
        mapGen.randomize(0.5);
        
        // Run several generations to smooth the map
        for (let i = 0; i < 3; i++) {
            mapGen.create();
        }
        
        // Convert the map
        mapGen.create((x, y, value) => {
            const actualY = y + this.mapBounds.minY;
            
            // Skip positions outside the playable area
            if (actualY < this.mapBounds.minY || actualY > this.mapBounds.maxY) return;
            if (x < 0 || x > this.mapBounds.maxX) return;
            
            const key = `${x},${actualY}`;
            this.map[key] = value ? '#' : '.';
        });
        
        // Ensure map edges are walls
        for (let x = 0; x <= this.mapBounds.maxX; x++) {
            this.map[`${x},${this.mapBounds.minY}`] = '#';
            this.map[`${x},${this.mapBounds.maxY}`] = '#';
        }
        
        for (let y = this.mapBounds.minY; y <= this.mapBounds.maxY; y++) {
            this.map[`0,${y}`] = '#';
            this.map[`${this.mapBounds.maxX},${y}`] = '#';
        }
        
        // Find a valid position for the player
        let validPosition = false;
        while (!validPosition) {
            const x = Math.floor(Math.random() * (this.mapBounds.maxX - 2)) + 1;
            const y = Math.floor(Math.random() * (this.mapBounds.maxY - this.mapBounds.minY - 2)) + this.mapBounds.minY + 1;
            
            const key = `${x},${y}`;
            if (this.map[key] === '.') {
                this.player.x = x;
                this.player.y = y;
                validPosition = true;
            }
        }
        
        // Reset FOV and explored areas
        this.explored = {};
        this.player.computeFOV();
        
        // Spawn some monsters
        this.spawnTestMonsterPack();
        
        this.addMessage("New map generated", CONFIG.colors.ui.highlight);
        this.drawGame();
    }

    toggleFOV(show) {
        this.showFOV = show;
        
        if (!show) {
            // Show entire map
            for (const key in this.map) {
                this.explored[key] = true;
                this.player.visibleTiles[key] = true;
            }
        } else {
            // Reset and recompute FOV
            this.player.visibleTiles = {};
            this.player.computeFOV();
        }
        
        this.drawGame();
        this.addMessage(`FOV ${show ? 'enabled' : 'disabled'}`, CONFIG.colors.ui.info);
    }

    toggleGrid(show) {
        this.showGrid = show;
        this.drawGame();
        this.addMessage(`Grid ${show ? 'enabled' : 'disabled'}`, CONFIG.colors.ui.info);
    }

    spawnArenaWave() {
        const monsterCount = Math.min(5 + this.arenaWave, 15); // Cap at 15 monsters
        
        // Calculate monster positions around the arena
        for (let i = 0; i < monsterCount; i++) {
            // Select monster type based on arena wave
            let monsterType;
            if (this.arenaWave <= 2) {
                monsterType = 'rat'; // Early waves
            } else if (this.arenaWave <= 5) {
                monsterType = ROT.RNG.getItem(['rat', 'snake', 'goblin']);
            } else {
                monsterType = ROT.RNG.getItem(['goblin', 'orc', 'troll']);
            }
            
            // Get monster data
            const monsterData = MONSTERS[monsterType];
            
            // Calculate position (along edges of arena)
            let x, y;
            const margin = 3;
            const side = Math.floor(Math.random() * 4); // 0-3 for top, right, bottom, left
            
            switch(side) {
                case 0: // Top
                    x = Math.floor(Math.random() * (this.mapBounds.maxX - 2 * margin)) + margin;
                    y = this.mapBounds.minY + margin;
                    break;
                case 1: // Right
                    x = this.mapBounds.maxX - margin;
                    y = Math.floor(Math.random() * (this.mapBounds.maxY - 2 * margin)) + margin;
                    break;
                case 2: // Bottom
                    x = Math.floor(Math.random() * (this.mapBounds.maxX - 2 * margin)) + margin;
                    y = this.mapBounds.maxY - margin;
                    break;
                case 3: // Left
                    x = margin;
                    y = Math.floor(Math.random() * (this.mapBounds.maxY - 2 * margin)) + margin;
                    break;
            }
            
            // Scale monster stats based on wave
            const scaleFactor = 1 + (this.arenaWave - 1) * 0.2; // +20% per wave
            const monster = new Monster(x, y, {
                ...monsterData,
                hp: Math.round(monsterData.hp * scaleFactor),
                maxHp: Math.round(monsterData.maxHp * scaleFactor),
                attack: Math.round(monsterData.attack * scaleFactor)
            });
            
            console.log(`Spawning arena monster: ${monster.name} at ${x},${y}`);
            this.entities.add(monster);
        }
    }

    spawnTestMonsterPack() {
        // Spawn one of each monster type for testing
        let x = this.player.x + 5;
        let y = this.player.y;
        
        // Make sure MONSTERS is defined
        if (!MONSTERS) {
            console.error("MONSTERS not defined - can't spawn test monsters");
            return;
        }
        
        const monsterTypes = Object.keys(MONSTERS);
        if (monsterTypes.length === 0) {
            console.error("No monster types found in MONSTERS");
            return;
        }
        
        // Limit to 5 monsters to prevent overcrowding
        const typesToSpawn = monsterTypes.slice(0, 5);
        
        for (const monsterType of typesToSpawn) {
            const monsterData = MONSTERS[monsterType];
            
            // Create the monster
            try {
                const monster = new Monster(x, y, monsterData);
                console.log(`Spawning test monster: ${monsterType} at ${x},${y}`);
                this.entities.add(monster);
                
                // Adjust position for next monster
                y += 2;
                if (y > this.mapBounds.maxY - 3) {
                    y = this.player.y;
                    x += 3;
                }
            } catch (err) {
                console.error(`Error spawning ${monsterType}:`, err);
            }
        }
        
        // Log count of entities for debugging
        console.log("Total entities after spawning:", this.entities.size);
    }

    // Add this new method to spawn test monsters
    spawnTestMonsters() {
        // Create test goblin to the right of player
        if (MONSTERS && MONSTERS.goblin) {
            const goblin = new Monster(
                this.player.x + 5,  // Place 5 tiles to the right of player
                this.player.y,
                MONSTERS.goblin
            );
            
            console.log("Spawning test goblin at", goblin.x, goblin.y);
            this.entities.add(goblin);
            
            // Add another goblin above the player
            const goblin2 = new Monster(
                this.player.x,
                this.player.y - 3,  // Place 3 tiles above player
                MONSTERS.goblin
            );
            
            console.log("Spawning second test goblin at", goblin2.x, goblin2.y);
            this.entities.add(goblin2);
            
            // Log total entities
            console.log("Total entities:", this.entities.size);
        } else {
            console.error("ERROR: MONSTERS.goblin is not defined!");
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
            console.log("Drawing entities:", this.entities.size);
            for (const entity of this.entities) {
                if (entity === this.player) continue; // Draw player last
                
                console.log("Drawing entity at", entity.x, entity.y, 
                            "Symbol:", entity.symbol || '?', 
                            "Is visible:", !!this.player.visibleTiles[`${entity.x},${entity.y}`]);
                
                // Make sure entity is within map bounds
                if (entity.x <= this.mapBounds.maxX && 
                    entity.y <= this.mapBounds.maxY &&
                    entity.x >= this.mapBounds.minX &&
                    entity.y >= this.mapBounds.minY) {
                        
                    const key = `${entity.x},${entity.y}`;
                    if (key in this.player.visibleTiles) {
                        this.display.draw(entity.x, entity.y, entity.symbol || 'g', entity.color || '#5aa');
                    }
                } else {
                    console.warn("Entity out of bounds:", entity);
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
            
            // Draw grid lines for sandbox mode
            if (this.gameMode === 'sandbox' && this.showGrid) {
                // Draw vertical grid lines
                for (let x = 0; x <= this.mapBounds.maxX; x++) {
                    for (let y = this.mapBounds.minY; y <= this.mapBounds.maxY; y++) {
                        // Draw a light vertical line
                        this.display.draw(x, y, this.map[`${x},${y}`], null, x % 5 === 0 ? '#444' : '#333');
                    }
                }
                
                // Draw horizontal grid lines
                for (let y = this.mapBounds.minY; y <= this.mapBounds.maxY; y++) {
                    for (let x = 0; x <= this.mapBounds.maxX; x++) {
                        // Draw a light horizontal line
                        if (y % 5 === 0) {
                            const tile = this.map[`${x},${y}`];
                            this.display.draw(x, y, tile, null, '#444');
                        }
                    }
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
        
        // Help screen
        if (e.key === '?' || e.key === '/') {
            this.showHelpScreen();
            return;
        }
        
        // If the key is 'r' during game over, restart the game immediately
        if (e.key === 'r' && this.gameState === 'gameover') {
            this.startGame(this.gameMode); // Restart in same mode
            return;
        }
        
        // Mode-specific keys
        if (this.gameMode === 'arena') {
            // 'n' for next wave in arena mode (debug feature)
            if (e.key === 'n' && e.ctrlKey) {
                this.completeArenaWave();
                return;
            }
        }
        
        if (this.gameMode === 'sandbox') {
            // 'h' for heal in sandbox mode
            if (e.key === 'h' && e.ctrlKey) {
                this.player.hp = this.player.maxHp;
                this.addMessage("DEBUG: Health restored", CONFIG.colors.ui.info);
                this.drawGame();
                return;
            }
            
            // 'm' for spawn monster in sandbox mode
            if (e.key === 'm' && e.ctrlKey) {
                this.spawnTestMonsters();
                this.addMessage("DEBUG: Spawned test monsters", CONFIG.colors.ui.info);
                this.drawGame();
                return;
            }

            // F1 to toggle sandbox control panel
            if (e.key === 'F1') {
                e.preventDefault(); // Prevent browser default F1 behavior
                
                const panel = document.getElementById('sandbox-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                } else {
                    this.showSandboxControls();
                }
                return;
            }
        }
        
        const keyMap = {
            'ArrowUp': [0, -1],
            'ArrowDown': [0, 1],
            'ArrowLeft': [-1, 0],
            'ArrowRight': [1, 0],
            'k': [0, -1],
            'j': [0, 1],
            'h': [-1, 0],
            'l': [1, 0],
            // Add diagonal movement
            'y': [-1, -1],
            'u': [1, -1],
            'b': [-1, 1],
            'n': [1, 1]
        };
        
        // Wait command (space or period)
        if (e.key === '.' || e.key === ' ') {
            this.addMessage("You wait a turn...", CONFIG.colors.ui.info);
            this.moveMonsters();
            return;
        }
        
        if (e.key in keyMap) {
            const [dx, dy] = keyMap[e.key];
            
            // Try moving or attacking
            if (this.tryPlayerAction(dx, dy)) {
                // After player action, give monsters their turn
                this.moveMonsters();
            }
        }
    }

    // New method to handle player movement and attacks
    tryPlayerAction(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        const key = `${newX},${newY}`;
        
        // Check if outside map or into a wall
        if (!(key in this.map) || this.map[key] === this.WALL_TILE) {
            console.log(`Cannot move to ${newX},${newY} - wall or out of bounds`);
            return false;
        }
        
        // Check for monster at target position
        for (const entity of this.entities) {
            if (entity !== this.player && entity.x === newX && entity.y === newY) {
                console.log(`Found monster at ${newX},${newY}, attacking!`);
                this.attackEntity(entity);
                this.drawGame(); // Redraw after combat
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
        
        // No obstacles, move player
        console.log(`Moving player to ${newX},${newY}`);
        this.player.x = newX;
        this.player.y = newY;
        this.player.computeFOV();
        this.turns++;
        this.drawGame(); // Redraw after movement
        
        return true;
    }

    moveMonsters() {
        console.log("Processing monster turns...");
        
        // Loop through all entities and move monsters that are visible
        for (const entity of this.entities) {
            if (entity === this.player) continue;
            
            const key = `${entity.x},${entity.y}`;
            const isVisible = key in this.player.visibleTiles;
            
            console.log(`Processing monster at ${entity.x},${entity.y}, visible: ${isVisible}`);
            
            if (isVisible) {
                // Check if monster is adjacent to player
                const dx = this.player.x - entity.x;
                const dy = this.player.y - entity.y;
                const isAdjacent = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
                
                if (isAdjacent) {
                    // Attack player
                    const damage = Math.max(1, entity.attack - this.player.defense);
                    this.player.hp -= damage;
                    this.addMessage(`The ${entity.name || "monster"} attacks you for ${damage} damage.`, CONFIG.colors.ui.warning);
                    
                    if (this.player.hp <= 0) {
                        this.gameOver();
                    }
                    continue;
                }
                
                // Try to find path to player
                const astar = new ROT.Path.AStar(
                    this.player.x, this.player.y,
                    (x, y) => {
                        // Check if position is walkable
                        const k = `${x},${y}`;
                        if (!(k in this.map) || this.map[k] === '#') return false;
                        
                        // Check for other entities
                        for (const other of this.entities) {
                            if (other !== entity && other !== this.player && 
                                other.x === x && other.y === y) {
                                return false;
                            }
                        }
                        
                        return true;
                    },
                    { topology: 4 }
                );
                
                const path = [];
                astar.compute(entity.x, entity.y, (x, y) => {
                    path.push([x, y]);
                });
                
                // Move one step along path if available
                if (path.length > 1) {
                    const [newX, newY] = path[1];
                    
                    // Make sure we're not moving onto the player or another monster
                    let canMove = true;
                    for (const other of this.entities) {
                        if (other !== entity && other.x === newX && other.y === newY) {
                            canMove = false;
                            break;
                        }
                    }
                    
                    if (canMove) {
                        console.log(`Moving monster from (${entity.x},${entity.y}) to (${newX},${newY})`);
                        entity.x = newX;
                        entity.y = newY;
                    } else {
                        console.log(`Monster can't move to occupied position (${newX},${newY})`);
                    }
                }
            }
        }
        
        // Redraw the game after all monsters have moved
        this.drawGame();
    }

    attackEntity(entity) {
        // Calculate damage
        const damage = Math.max(1, this.player.attack - (entity.defense || 0));
        
        console.log(`Player attacks ${entity.name} for ${damage} damage`);
        
        // Apply damage
        entity.hp -= damage;
        
        // Add message
        this.addMessage(`You hit the ${entity.name || 'monster'} for ${damage} damage.`);
        
        // Check if entity is dead
        if (entity.hp <= 0) {
            this.addMessage(`You killed the ${entity.name || 'monster'}!`, CONFIG.colors.ui.highlight);
            
            // Remove entity
            this.entities.delete(entity);
            
            // Gain experience and gold
            this.player.exp += entity.exp || 1;
            this.player.gold = (this.player.gold || 0) + Math.floor(Math.random() * (entity.exp || 1)) + 1;
            
            // Check for level up
            this.checkLevelUp();
            
            // In arena mode, check if all monsters are dead
            if (this.gameMode === 'arena' && this.entitiesCount() === 1) {
                this.completeArenaWave();
            }
        } else {
            // Entity attacks back
            const entityDamage = Math.max(1, (entity.attack || 1) - this.player.defense);
            this.player.hp -= entityDamage;
            
            // Add messages
            this.addMessage(`The ${entity.name || 'monster'} hits you for ${entityDamage} damage.`, CONFIG.colors.ui.warning);
            
            // Check if player is dead
            if (this.player.hp <= 0) {
                this.gameOver();
            }
        }
    }

    // Helper function to count remaining entities
    entitiesCount() {
        return this.entities.size;
    }

    // Handle completion of an arena wave
    completeArenaWave() {
        // Increment arena score
        this.arenaScore += this.arenaWave * 10;
        
        // Show wave completion message
        this.addMessage(`Wave ${this.arenaWave} completed!`, CONFIG.colors.ui.highlight);
        this.addMessage(`Score: ${this.arenaScore}`, CONFIG.colors.ui.highlight);
        
        // Increase wave counter
        this.arenaWave++;
        
        // Give player rewards
        this.player.hp = Math.min(this.player.hp + 5, this.player.maxHp);
        this.addMessage(`You recover 5 HP between waves.`, CONFIG.colors.ui.info);
        
        // Every 3 waves, upgrade player stats
        if (this.arenaWave % 3 === 0) {
            this.player.maxHp += 5;
            this.player.hp += 5;
            this.player.attack += 1;
            this.addMessage(`Your powers grow! Max HP +5, Attack +1`, CONFIG.colors.ui.highlight);
        }
        
        // Spawn next wave after a short delay
        setTimeout(() => {
            this.addMessage(`Wave ${this.arenaWave} begins...`, CONFIG.colors.ui.warning);
            this.spawnArenaWave();
        }, 1500);
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
                this.display.draw(x, y, tile, tile === this.WALL_TILE ? CONFIG.colors.wall.visible : CONFIG.colors.floor.visible);
            } else if (key in this.explored) {
                // Explored but not visible tiles
                this.display.draw(x, y, tile, tile === this.WALL_TILE ? CONFIG.colors.wall.explored : CONFIG.colors.floor.explored);
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

    getMonsterAt(x, y) {
        for (let entity of this.entities) {
            if (entity !== this.player && entity instanceof Monster && 
                entity.x === x && entity.y === y) {
                return entity;
            }
        }
        return null;
    }

    isVisible(x, y) {
        const key = `${x},${y}`;
        return this.player.visibleTiles[key];
    }

    removeMonster(monster) {
        this.entities.delete(monster);
        this.scheduler.remove(monster);
    }

    processMonsterTurn() {
        console.log("Processing monster turns...");
        this.resetMonsterMoves();
        for (const entity of this.entities) {
            if (entity === this.player) continue;
            if (entity.hasMoved) continue;
            entity.act();
            entity.hasMoved = true;
        }
        this.player.computeFOV();
        this.drawGame();
    }

    resetMonsterMoves() {
        for (const entity of this.entities) {
            if (entity !== this.player) {
                entity.hasMoved = false;
            }
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        
        // Add specific game over messages based on game mode
        if (this.gameMode === 'arena') {
            this.addMessage(`Game over! You reached wave ${this.arenaWave}.`, CONFIG.colors.ui.warning);
            this.addMessage(`Final score: ${this.arenaScore}`, CONFIG.colors.ui.highlight);
        } else {
            this.addMessage("You died!", CONFIG.colors.ui.warning);
            this.addMessage("Game over...", CONFIG.colors.ui.warning);
        }
        
        // Draw final state using drawGame() for consistency
        this.drawGame();
        
        // Show game over message
        const gameOverY = Math.floor(this.display.getOptions().height / 2);
        this.display.drawText(0, gameOverY, `%c{${CONFIG.colors.ui.warning}}%b{#000}${"GAME OVER".padStart(40)}`);
        
        // Remove any existing input handlers to prevent duplicates
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Reset after delay
        setTimeout(() => {
            this.gameState = 'title';
            this.showTitleScreen();
            
            // Re-add the title input handler that was removed when starting the game
            this.titleInputHandler = (e) => {
                if (this.gameState === 'title') {
                    console.log('Key pressed on title screen:', e.key);
                    this.showGameModeMenu();
                    // We'll remove the listener when a game actually starts
                }
            };
            window.addEventListener('keydown', this.titleInputHandler);
        }, 2000);
    }

    // Help function for displaying game controls when needed
    showHelpScreen() {
        if (this.gameState !== 'playing') return;
        
        // Store previous state to return to
        this.previousState = this.gameState;
        this.gameState = 'help';
        
        // Clear display
        this.display.clear();
        
        // Title
        const title = "CONTROLS & HELP";
        this.display.drawText(
            Math.floor((this.display.getOptions().width - title.length) / 2),
            2,
            `%c{${CONFIG.colors.ui.highlight}}${title}`
        );
        
        // Draw help content
        const helpLines = [
            "",
            "MOVEMENT",
            "Arrow Keys: Move in cardinal directions",
            "h/j/k/l: Move left/down/up/right (vi keys)",
            "",
            "COMBAT",
            "Move into enemies to attack them",
            "",
            "SPECIAL CONTROLS",
            "Space or . : Wait a turn",
            "? : Show/hide this help screen",
            "Esc : Return to game",
            "",
            `CURRENT MODE: ${this.gameMode.toUpperCase()}`,
            "",
            "Press any key to return to game"
        ];
        
        helpLines.forEach((line, i) => {
            const color = line.startsWith("MOVEMENT") || line.startsWith("COMBAT") || 
                          line.startsWith("SPECIAL") || line.startsWith("CURRENT MODE") 
                          ? CONFIG.colors.ui.highlight : '#fff';
            
            this.display.drawText(5, 4 + i, `%c{${color}}${line}`);
        });
        
        // Help screen input handler
        this.helpInputHandler = (e) => {
            // Any key returns to game
            this.gameState = this.previousState;
            this.drawGame();
            
            // Remove help input handler
            window.removeEventListener('keydown', this.helpInputHandler);
            return;
        };
        
        window.addEventListener('keydown', this.helpInputHandler);
    }

    // Add more detailed addMessage for debugging
    addMessage(text, color = "#fff") {
        console.log(`[MESSAGE] ${text}`);
        
        // Add to message queue
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
        
        // Redraw game to show the new message
        this.drawGame();
    }

    toggleFontPreview() {
        const previewDiv = document.getElementById('font-preview');
        if (!previewDiv) return;
        
        if (previewDiv.style.display === 'none') {
            previewDiv.style.display = 'block';
            this.updateFontPreview();
        } else {
            previewDiv.style.display = 'none';
        }
    }

    updateFontPreview() {
        const previewDiv = document.getElementById('font-preview');
        if (!previewDiv) return;
        
        // Get current font
        const currentFont = this.availableFonts[this.currentFontIndex];
        
        // Clear the preview
        previewDiv.innerHTML = '';
        
        // Create title
        const title = document.createElement('h4');
        title.textContent = "Font Sample: " + currentFont;
        previewDiv.appendChild(title);
        
        // Create sample with current font
        this.createFontPreviewSample(currentFont, previewDiv);
        
        // Add comparison with default monospace
        if (currentFont !== 'monospace') {
            const comparisonTitle = document.createElement('h4');
            comparisonTitle.textContent = "Comparison with monospace:";
            comparisonTitle.style.marginTop = '10px';
            previewDiv.appendChild(comparisonTitle);
            this.createFontPreviewSample('monospace', previewDiv);
        }
        
        // Add button to compare all fonts
        const compareButton = document.createElement('button');
        compareButton.textContent = "Compare All Fonts";
        compareButton.style.marginTop = '10px';
        compareButton.onclick = () => this.showAllFontsComparison();
        previewDiv.appendChild(compareButton);
    }

    createFontPreviewSample(fontName, container) {
        const sample = document.createElement('div');
        sample.style.fontFamily = fontName;
        sample.style.fontSize = '14px';
        sample.style.border = '1px solid #444';
        sample.style.padding = '5px';
        sample.style.marginTop = '5px';
        sample.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${fontName}</div>
            <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
            <div>abcdefghijklmnopqrstuvwxyz</div>
            <div>0123456789</div>
            <div>!@#$%^&*()-_=+[]{}|;:',.<>/?</div>
            <div style="margin-top: 5px;">The quick brown fox jumps over the lazy dog.</div>
            <div>Game symbols: @.#</div>
        `;
        container.appendChild(sample);
        return sample;
    }

    showAllFontsComparison() {
        // Create a modal dialog to compare all fonts
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 800px;
            height: 80%;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #555;
            padding: 20px;
            z-index: 2000;
            color: white;
            font-family: monospace;
            overflow-y: auto;
        `;
        
        // Add header
        const header = document.createElement('h3');
        header.textContent = 'All Available Fonts Comparison';
        modal.appendChild(header);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background: #333;
            color: white;
            border: 1px solid #555;
        `;
        closeBtn.onclick = () => document.body.removeChild(modal);
        modal.appendChild(closeBtn);
        
        // Add all fonts
        this.availableFonts.forEach(font => {
            this.createFontPreviewSample(font, modal);
        });
        
        // Add side-by-side game symbols comparison
        const symbolsHeader = document.createElement('h4');
        symbolsHeader.textContent = 'Game Symbols Comparison';
        symbolsHeader.style.marginTop = '20px';
        modal.appendChild(symbolsHeader);
        
        const symbolsGrid = document.createElement('div');
        symbolsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
        `;
        
        this.availableFonts.forEach(font => {
            const cell = document.createElement('div');
            cell.style.fontFamily = font;
            cell.style.border = '1px solid #444';
            cell.style.padding = '5px';
            cell.innerHTML = `
                <div style="font-weight: bold; font-size: 12px;">${font}</div>
                <div style="font-size: 24px;">@.#</div>
            `;
            symbolsGrid.appendChild(cell);
        });
        
        modal.appendChild(symbolsGrid);
        document.body.appendChild(modal);
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