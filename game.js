// compact-crawl/game.js - Core game engine and main loop
class Game {
    constructor() {
        // Game constants (moved from core.js)
        this.FOV_RADIUS = 8;
        this.WALL_TILE = '#';
        this.FLOOR_TILE = '.';
        this.depth = 1;
        this.playerUsedStairs = false;
        this.inventoryOpen = false;
        this.inventoryDropMode = false;
        
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
        this.turns = 0;
        this.depth = 1;
        this.level = 1;
        this.inventoryOpen = false;
        this.inventoryDropMode = false;

        if (typeof toggleInventoryScreen === 'function') {
            toggleInventoryScreen(false);
        } else {
            const inventoryScreen = document.getElementById('inventory-screen');
            if (inventoryScreen) {
                inventoryScreen.style.display = 'none';
            }
        }

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

            if (!this.dungeonGenerator) {
                this.dungeonGenerator = new DungeonGenerator(this);
            }

            this.prepareLevel(this.depth, 'start', { preservePlayer: false });

            // Set up game based on selected mode
            switch(gameMode) {
                case 'main':
                    this.addMessage(`Welcome to the main game mode!`, "#ff0");
                    break;
                case 'arena':
                    this.setupArenaMode();
                    break;
                case 'sandbox':
                    this.setupSandboxMode();
                    break;
            }

            this.updateStats();
            if (typeof updatePlayerStats === 'function') {
                updatePlayerStats();
            }

            this.drawGame();

            // Setup input handler - make sure we bind it and store the bound reference
            this.boundHandleKeyDown = this.handleKeyDown.bind(this);
            document.addEventListener('keydown', this.boundHandleKeyDown);

            // Add welcome message
            this.addMessage("Welcome to the dungeon!", "#ff0");

            // Start the turn engine
            this.engine.start();

            return true;
        } catch (err) {
            console.error('Error in startGame:', err);
            return false;
        }
    }

    prepareLevel(depth, entry = 'start', options = {}) {
        if (!this.mapBounds) {
            throw new Error('Map bounds are not initialized');
        }

        if (!this.dungeonGenerator) {
            this.dungeonGenerator = new DungeonGenerator(this);
        }

        if (this.engine) {
            this.engine.lock();
        }

        const mapWidth = this.mapBounds.maxX - this.mapBounds.minX + 1;
        const mapHeight = this.mapBounds.maxY - this.mapBounds.minY + 1;
        const dungeon = this.dungeonGenerator.generateStandard(mapWidth, mapHeight, depth);

        const toGlobal = ({ x, y }) => ({
            x: x + this.mapBounds.minX,
            y: y + this.mapBounds.minY
        });

        this.map = {};

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const globalX = this.mapBounds.minX + x;
                const globalY = this.mapBounds.minY + y;
                const localKey = `${x},${y}`;
                let tile = dungeon.map[localKey];

                if (!tile) {
                    tile = this.WALL_TILE;
                } else if (tile === this.WALL_TILE) {
                    tile = this.WALL_TILE;
                } else if (tile === '<' || tile === '>' || tile === 'i') {
                    // Preserve special tiles
                } else {
                    tile = this.FLOOR_TILE;
                }

                if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) {
                    tile = this.WALL_TILE;
                }

                this.map[`${globalX},${globalY}`] = tile;
            }
        }

        this.freeCells = dungeon.freeCells.map(cell => toGlobal(cell));
        this.upstairsPosition = dungeon.upstairsPosition ? toGlobal(dungeon.upstairsPosition) : null;
        this.downstairsPosition = dungeon.downstairsPosition ? toGlobal(dungeon.downstairsPosition) : null;

        const rawItems = this.dungeonGenerator.placeItems(depth, dungeon.map, dungeon.freeCells, dungeon.rooms) || [];
        this.items = rawItems.map(item => ({
            ...item,
            x: item.x + this.mapBounds.minX,
            y: item.y + this.mapBounds.minY
        }));

        const spawnLocal = this.determineSpawnLocation(dungeon, entry);
        const spawnGlobal = toGlobal(spawnLocal);

        this.depth = depth;
        this.level = depth;

        const preservePlayer = options.preservePlayer || false;
        if (!preservePlayer || !this.player) {
            this.player = new Player(spawnGlobal.x, spawnGlobal.y);
        } else {
            this.player.x = spawnGlobal.x;
            this.player.y = spawnGlobal.y;
        }

        this.player.visibleTiles = {};
        this.explored = {};

        this.entities = new Set([this.player]);
        this.scheduler = new ROT.Scheduler.Simple();
        this.scheduler.add(this.player, false);

        const monsters = this.createMonstersForDungeon(dungeon, depth, toGlobal, spawnLocal);
        for (const monster of monsters) {
            this.addMonster(monster);
        }

        this.engine = new ROT.Engine(this.scheduler);

        this.player.computeFOV();
        this.drawGame();
        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }

        this.playerUsedStairs = false;

        return { spawn: spawnGlobal, dungeon };
    }

    determineSpawnLocation(dungeon, entry) {
        const fallback = this.normalizePosition(
            dungeon.startPosition ||
            (dungeon.freeCells && dungeon.freeCells.length > 0
                ? dungeon.freeCells[0]
                : { x: 0, y: 0 })
        );

        if (entry === 'down' && dungeon.upstairsPosition) {
            return this.normalizePosition(dungeon.upstairsPosition, fallback);
        }

        if (entry === 'up' && dungeon.downstairsPosition) {
            return this.normalizePosition(dungeon.downstairsPosition, fallback);
        }

        return fallback;
    }

    normalizePosition(position, fallback = { x: 0, y: 0 }) {
        if (!position) {
            return { x: fallback.x, y: fallback.y };
        }

        if (Array.isArray(position)) {
            return { x: position[0], y: position[1] };
        }

        return { x: position.x, y: position.y };
    }

    createMonstersForDungeon(dungeon, depth, toGlobal, spawnLocal) {
        if (!dungeon || !dungeon.rooms) {
            return [];
        }

        const weightEntries = this.getMonsterWeightEntries(depth);
        if (weightEntries.length === 0) {
            return [];
        }

        const monsters = [];
        const blocked = new Set();
        blocked.add(`${spawnLocal.x},${spawnLocal.y}`);

        if (dungeon.upstairsPosition) {
            blocked.add(`${dungeon.upstairsPosition.x},${dungeon.upstairsPosition.y}`);
        }

        if (dungeon.downstairsPosition) {
            blocked.add(`${dungeon.downstairsPosition.x},${dungeon.downstairsPosition.y}`);
        }

        const startRoom = dungeon.rooms[0];
        const candidateRooms = dungeon.rooms.filter(room => room !== startRoom);
        const roomsToUse = candidateRooms.length > 0 ? candidateRooms : dungeon.rooms;
        const monsterCap = Math.min(
            roomsToUse.length * 2,
            Math.max(3, Math.floor(depth * 1.5) + 2)
        );

        for (let i = 0; i < monsterCap; i++) {
            const room = ROT.RNG.getItem(roomsToUse);
            const localPos = this.findSpawnPositionInRoom(room, blocked, dungeon.map);
            if (!localPos) {
                continue;
            }

            const type = this.pickMonsterTypeForDepth(depth, weightEntries);
            if (!type) {
                break;
            }

            const monsterData = MONSTERS[type];
            const globalPos = toGlobal(localPos);
            const monster = new Monster(globalPos.x, globalPos.y, monsterData);
            monster.type = monster.type || type;
            monsters.push(monster);
            blocked.add(`${localPos.x},${localPos.y}`);
        }

        return monsters;
    }

    findSpawnPositionInRoom(room, blocked, map) {
        if (!room) {
            return null;
        }

        for (let attempt = 0; attempt < 10; attempt++) {
            const candidate = this.normalizePosition(room.getRandomPosition());
            const key = `${candidate.x},${candidate.y}`;
            if (blocked.has(key)) {
                continue;
            }

            if (map[key] === this.FLOOR_TILE || map[key] === '.') {
                return candidate;
            }
        }

        const center = this.normalizePosition(room.getCenter());
        const centerKey = `${center.x},${center.y}`;
        if (!blocked.has(centerKey) && (map[centerKey] === this.FLOOR_TILE || map[centerKey] === '.')) {
            return center;
        }

        return null;
    }

    getMonsterWeightEntries(depth) {
        let weights = {};

        if (typeof getMonsterSpawnWeights === 'function') {
            weights = getMonsterSpawnWeights(depth) || {};
        } else if (this.dungeonGenerator && typeof this.dungeonGenerator.calculateMonsterWeights === 'function') {
            weights = this.dungeonGenerator.calculateMonsterWeights(depth) || {};
        }

        return Object.entries(weights).filter(([type, weight]) => weight > 0 && MONSTERS[type]);
    }

    pickMonsterTypeForDepth(depth, weightEntries = null) {
        let entries = weightEntries;
        if (!entries || entries.length === 0) {
            entries = this.getMonsterWeightEntries(depth);
        }

        if (!entries || entries.length === 0) {
            return null;
        }

        const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
        if (total <= 0) {
            return null;
        }

        let roll = Math.floor(ROT.RNG.getUniform() * total);
        for (const [type, weight] of entries) {
            roll -= weight;
            if (roll < 0) {
                return type;
            }
        }

        return entries[0][0];
    }

    // Add new methods for special game modes
    setupArenaMode() {
        // Add arena-specific setup
        this.arenaWave = 1;
        this.arenaScore = 0;
        
        // Clear any existing monsters
        for (const entity of Array.from(this.entities)) {
            if (entity !== this.player) {
                if (this.scheduler) {
                    this.scheduler.remove(entity);
                }
                this.entities.delete(entity);
            }
        }
        
        // Enhance player for arena mode
        this.player.baseStats.maxHp = 20;
        this.player.baseStats.attack = 4;
        this.player.baseStats.defense = 2;
        this.player.recalculateDerivedStats();
        this.player.hp = this.player.maxHp;

        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
        
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
    this.player.baseStats.maxHp = 100;
    this.player.baseStats.attack = 10;
    this.player.baseStats.defense = 5;
    this.player.recalculateDerivedStats();
    this.player.hp = this.player.maxHp;

    this.updateStats();
    if (typeof updatePlayerStats === 'function') {
        updatePlayerStats();
    }
    
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
        let removedCount = 0;
        for (const entity of Array.from(this.entities)) {
            if (entity !== this.player) {
                if (this.scheduler) {
                    this.scheduler.remove(entity);
                }
                this.entities.delete(entity);
                removedCount++;
            }
        }

        this.addMessage(`Removed ${removedCount} monsters`, CONFIG.colors.ui.info);
        this.drawGame();
    }

    healPlayer() {
        this.player.hp = this.player.maxHp;
        this.addMessage("Player fully healed", CONFIG.colors.ui.highlight);
        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
        this.drawGame();
    }

    increasePlayerStats() {
        this.player.baseStats.attack += 2;
        this.player.baseStats.defense += 1;
        this.player.baseStats.maxHp += 10;
        this.player.recalculateDerivedStats();
        this.player.hp = this.player.maxHp;

        this.addMessage(`Stats increased: ATK +2, DEF +1, HP +10`, CONFIG.colors.ui.highlight);
        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
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

    addMonster(monster) {
        this.entities.add(monster);
        if (this.scheduler) {
            this.scheduler.add(monster, false);
        }

        if (monster && Array.isArray(monster.abilities)) {
            if (monster.abilities.includes('regeneration')) {
                this.applyStatusEffect(monster, {
                    type: 'regeneration',
                    duration: Infinity,
                    potency: 1,
                    source: monster.name,
                    silent: true
                });
            }
        }
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
            this.addMonster(monster);
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
                this.addMonster(monster);
                
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
            this.addMonster(goblin);
            
            // Add another goblin above the player
            const goblin2 = new Monster(
                this.player.x,
                this.player.y - 3,  // Place 3 tiles above player
                MONSTERS.goblin
            );
            
            console.log("Spawning second test goblin at", goblin2.x, goblin2.y);
            this.addMonster(goblin2);
            
            // Log total entities
            console.log("Total entities:", this.entities.size);
        } else {
            console.error("ERROR: MONSTERS.goblin is not defined!");
        }
    }

    drawGame() {
        try {
            if (!this.display || !this.player || !this.mapBounds || !this.map) {
                return false;
            }

            this.display.clear();

            const displayWidth = this.display.getOptions().width;
            const displayHeight = this.display.getOptions().height;
            const colors = CONFIG.colors;

            this.drawUIBackground();

            const { minX, maxX, minY, maxY } = this.mapBounds;
            const exploredMap = this.explored || {};
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const key = `${x},${y}`;
                    const tile = this.map[key];
                    const visible = this.isVisible(x, y);
                    const explored = !!exploredMap[key];

                    if (!visible && !explored) {
                        continue;
                    }

                    const glyph = tile === 'i' ? this.FLOOR_TILE : (tile || this.WALL_TILE);
                    const isWall = glyph === this.WALL_TILE;
                    const foreground = isWall
                        ? (visible ? colors.wall.visible : colors.wall.explored)
                        : (visible ? colors.floor.visible : colors.floor.explored);

                    this.display.draw(x, y, glyph, foreground);
                }
            }

            for (const item of this.items || []) {
                if (!this.isVisible(item.x, item.y)) {
                    continue;
                }
                this.display.draw(item.x, item.y, item.symbol, item.color);
            }

            if (this.entities) {
                for (const entity of this.entities) {
                    if (entity === this.player) continue;
                    if (!this.isVisible(entity.x, entity.y)) continue;

                    this.display.draw(entity.x, entity.y, entity.symbol || 'g', entity.color || colors.entities.monster.goblin);
                }
            }

            this.display.draw(this.player.x, this.player.y, this.player.symbol, colors.entities.player);

            const statsText = `HP: ${this.player.hp}/${this.player.maxHp} | Level: ${this.player.level} | XP: ${this.player.exp} | Gold: ${this.player.gold || 0} | Depth: ${this.depth}`;
            this.display.drawText(1, 0, `%c{${colors.ui.text}}%b{#000}${statsText.padEnd(displayWidth - 2)}`);

            for (let x = 0; x < displayWidth; x++) {
                this.display.draw(x, 1, '─', '#555');
                this.display.draw(x, displayHeight - 4, '─', '#555');
            }

            if (this.messages && this.messages.length > 0) {
                for (let i = 0; i < Math.min(3, this.messages.length); i++) {
                    const msg = this.messages[i];
                    const text = msg.text.padEnd(displayWidth - 2);
                    this.display.drawText(1, displayHeight - 3 + i,
                        `%c{${msg.color || colors.ui.text}}%b{#000}${text}`);
                }
            }

            if (this.gameMode === 'sandbox' && this.showGrid) {
                for (let x = minX; x <= maxX; x++) {
                    const isVerticalLine = x % 5 === 0;
                    if (!isVerticalLine) continue;
                    for (let y = minY; y <= maxY; y++) {
                        if (!this.isVisible(x, y) && !exploredMap[`${x},${y}`]) continue;
                        const baseTile = this.map[`${x},${y}`] || this.WALL_TILE;
                        const glyph = baseTile === 'i' ? this.FLOOR_TILE : baseTile;
                        this.display.draw(x, y, glyph, null, '#444');
                    }
                }

                for (let y = minY; y <= maxY; y++) {
                    const isHorizontalLine = y % 5 === 0;
                    if (!isHorizontalLine) continue;
                    for (let x = minX; x <= maxX; x++) {
                        if (!this.isVisible(x, y) && !exploredMap[`${x},${y}`]) continue;
                        const baseTile = this.map[`${x},${y}`] || this.WALL_TILE;
                        const glyph = baseTile === 'i' ? this.FLOOR_TILE : baseTile;
                        this.display.draw(x, y, glyph, null, '#444');
                    }
                }
            }

            this.updateExternalUI();
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

        if (this.inventoryOpen) {
            this.handleInventoryInput(e);
            return;
        }

        if (e.key && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            this.openInventory();
            return;
        }

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
            this.drawGame();
            this.endPlayerTurn();
            return;
        }

        if (e.key in keyMap) {
            const [dx, dy] = keyMap[e.key];
            this.playerUsedStairs = false;

            // Try moving or attacking
            if (this.tryPlayerAction(dx, dy)) {
                if (this.playerUsedStairs) {
                    this.playerUsedStairs = false;
                    return;
                }
                this.endPlayerTurn();
            }
        }
    }

    handleInventoryInput(e) {
        e.preventDefault();

        const key = e.key || '';
        const lower = key.toLowerCase();

        if (this.inventoryDropMode) {
            if (key === 'Escape') {
                this.inventoryDropMode = false;
                return;
            }

            if (lower === 'i') {
                this.closeInventory();
                return;
            }

            if (lower === 'd') {
                this.inventoryDropMode = false;
                return;
            }

            if (/^[1-9]$/.test(key)) {
                const index = parseInt(key, 10) - 1;
                this.dropInventoryItem(index);
                return;
            }

            return;
        }

        if (key === 'Escape' || lower === 'i') {
            this.closeInventory();
            return;
        }

        if (lower === 'd') {
            this.inventoryDropMode = true;
            this.addMessage('Drop which item? Press the item number or Esc to cancel.', CONFIG.colors.ui.info);
            return;
        }

        if (/^[1-9]$/.test(key)) {
            const index = parseInt(key, 10) - 1;
            this.useInventoryItem(index);
        }
    }

    openInventory() {
        if (this.inventoryOpen) {
            if (typeof updateInventoryDisplay === 'function') {
                updateInventoryDisplay();
            }
            return;
        }

        this.inventoryOpen = true;
        this.inventoryDropMode = false;

        if (typeof toggleInventoryScreen === 'function') {
            toggleInventoryScreen(true);
        }

        if (typeof updateInventoryDisplay === 'function') {
            updateInventoryDisplay();
        }
    }

    closeInventory() {
        if (!this.inventoryOpen) {
            return;
        }

        this.inventoryOpen = false;
        this.inventoryDropMode = false;

        if (typeof toggleInventoryScreen === 'function') {
            toggleInventoryScreen(false);
        } else {
            const screen = document.getElementById('inventory-screen');
            if (screen) {
                screen.style.display = 'none';
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
                this.updateStats();
                if (typeof updatePlayerStats === 'function') {
                    updatePlayerStats();
                }
                return true;
            }
        }

        let pickedItem = null;
        let pickedIndex = -1;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (item.x === newX && item.y === newY) {
                pickedItem = item;
                pickedIndex = i;
                break;
            }
        }

        console.log(`Moving player to ${newX},${newY}`);
        this.player.x = newX;
        this.player.y = newY;
        this.turns++;

        if (pickedItem) {
            this.pickUpItem(pickedItem, pickedIndex);
        }

        const tileType = this.map[key];
        let usedStairs = false;
        if (tileType === '>' || tileType === '<') {
            usedStairs = this.useStairs(tileType);
        }

        if (!usedStairs) {
            this.player.computeFOV();
            this.drawGame();
            this.updateStats();
            if (typeof updatePlayerStats === 'function') {
                updatePlayerStats();
            }
        }

        return true;
    }

    useStairs(tileType) {
        if (tileType === '>') {
            const newDepth = this.depth + 1;
            this.prepareLevel(newDepth, 'down', { preservePlayer: true });
            this.addMessage(`You descend to depth ${newDepth}.`, CONFIG.colors.ui.info);
            this.playerUsedStairs = true;
            this.engine.start();
            return true;
        }

        if (tileType === '<') {
            if (this.depth <= 1) {
                this.addMessage('You cannot ascend any further.', CONFIG.colors.ui.warning);
                return false;
            }

            const newDepth = this.depth - 1;
            this.prepareLevel(newDepth, 'up', { preservePlayer: true });
            this.addMessage(`You ascend to depth ${newDepth}.`, CONFIG.colors.ui.info);
            this.playerUsedStairs = true;
            this.engine.start();
            return true;
        }

        return false;
    }

    endPlayerTurn() {
        if (this.scheduler && this.player && this.gameState === 'playing') {
            this.scheduler.add(this.player, false);
        }

        if (this.engine) {
            this.engine.unlock();
        }
    }

    attackEntity(entity) {
        if (!entity) {
            return;
        }

        // Calculate damage
        const damage = Math.max(1, this.player.attack - (entity.defense || 0));
        console.log(`Player attacks ${entity.name} for ${damage} damage`);

        // Apply damage
        entity.hp -= damage;

        // Add message
        this.addMessage(`You hit the ${entity.name || 'monster'} for ${damage} damage.`);

        if (entity.hp <= 0) {
            this.handleMonsterDeath(entity, {
                message: `You killed the ${entity.name || 'monster'}!`
            });
        } else {
            const weapon = this.player.equipment && this.player.equipment.hand;
            if (weapon && weapon.onHitStatus) {
                const statusPayload = this.cloneStatusTemplate(weapon.onHitStatus) || {};
                statusPayload.source = weapon.name || 'your weapon';
                this.applyStatusEffect(entity, statusPayload);
            }

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

        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
    }

    handleMonsterDeath(monster, options = {}) {
        if (!monster || !this.entities.has(monster)) {
            return;
        }

        const name = monster.name || 'monster';
        const {
            message = `The ${name} dies.`,
            silent = false,
            grantRewards = true
        } = options;

        if (!silent) {
            this.addMessage(message, CONFIG.colors.ui.highlight);
        }

        if (this.scheduler) {
            this.scheduler.remove(monster);
        }
        this.entities.delete(monster);

        if (grantRewards && this.player) {
            const exp = monster.exp || 1;
            this.player.exp += exp;
            this.player.gold = (this.player.gold || 0) + Math.floor(Math.random() * exp) + 1;
            this.checkLevelUp();
        }

        if (this.gameMode === 'arena' && this.entitiesCount() === 1) {
            this.completeArenaWave();
        }

        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
    }

    formatStatusName(type) {
        if (!type) {
            return 'Status';
        }
        return type
            .toString()
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    announceStatusMessage(target, text, color = CONFIG.colors.ui.info) {
        if (!text) {
            return;
        }

        if (target === this.player) {
            this.addMessage(text, color);
            return;
        }

        if (this.isEntityVisible(target)) {
            this.addMessage(text, color);
        }
    }

    cloneStatusTemplate(template) {
        if (!template) {
            return null;
        }

        const cloned = {
            type: template.type,
            duration: template.duration,
            potency: template.potency,
            stackable: template.stackable,
            modifiers: template.modifiers ? { ...template.modifiers } : undefined,
            message: template.message,
            expireMessage: template.expireMessage,
            tickMessage: template.tickMessage,
            messageColor: template.messageColor,
            expireMessageColor: template.expireMessageColor,
            silent: template.silent,
            source: template.source
        };

        return cloned;
    }

    applyStatusModifiers(entity, modifiers = {}, direction = 1) {
        if (!entity || !modifiers) {
            return;
        }

        entity.statusBonuses = entity.statusBonuses || {};
        for (const [stat, value] of Object.entries(modifiers)) {
            if (!Number.isFinite(value)) {
                continue;
            }
            entity.statusBonuses[stat] = (entity.statusBonuses[stat] || 0) + value * direction;
        }

        if (typeof entity.recalculateDerivedStats === 'function') {
            entity.recalculateDerivedStats();
        }

        if (entity === this.player) {
            this.updateStats();
            if (typeof updatePlayerStats === 'function') {
                updatePlayerStats();
            }
        }
    }

    applyStatusEffect(target, effectData = {}) {
        if (!target) {
            return null;
        }

        const base = this.cloneStatusTemplate(effectData) || {};
        base.type = base.type || effectData.type;
        if (!base.type) {
            return null;
        }

        const stackable = base.stackable ?? effectData.stackable ?? false;
        base.stackable = stackable;

        let duration = base.duration;
        if (duration === undefined || duration === null) {
            duration = effectData.duration !== undefined ? effectData.duration : 1;
        }
        if (duration === 'permanent') {
            duration = Infinity;
        }
        if (duration !== Infinity) {
            duration = Math.max(1, Math.round(duration));
        }
        base.duration = duration;

        base.potency = base.potency ?? effectData.potency ?? 0;
        const modifierSource = effectData.modifiers || {};
        base.modifiers = base.modifiers || {};
        for (const [key, value] of Object.entries(modifierSource)) {
            base.modifiers[key] = value;
        }
        base.message = base.message ?? effectData.message;
        base.expireMessage = base.expireMessage ?? effectData.expireMessage;
        base.tickMessage = base.tickMessage ?? effectData.tickMessage;
        base.messageColor = base.messageColor ?? effectData.messageColor;
        base.expireMessageColor = base.expireMessageColor ?? effectData.expireMessageColor;
        base.silent = base.silent ?? effectData.silent ?? false;
        base.source = base.source || effectData.source || null;

        target.statusEffects = target.statusEffects || [];
        const existing = !stackable
            ? target.statusEffects.find(effect => effect.type === base.type)
            : null;

        if (existing) {
            if (base.modifiers && Object.keys(base.modifiers).length) {
                const oldModifiers = existing.appliedModifiers || existing.modifiers || {};
                const changed = Object.keys(base.modifiers).some(key => base.modifiers[key] !== oldModifiers[key]);
                if (changed) {
                    this.applyStatusModifiers(target, oldModifiers, -1);
                    existing.modifiers = { ...base.modifiers };
                    existing.appliedModifiers = { ...base.modifiers };
                    this.applyStatusModifiers(target, existing.appliedModifiers, 1);
                }
            }

            if (duration === Infinity) {
                existing.duration = Infinity;
            } else if (existing.duration !== Infinity) {
                existing.duration = Math.max(existing.duration || 0, duration);
            }

            existing.potency = Math.max(existing.potency || 0, base.potency || 0);
            existing.source = base.source || existing.source;

            if (!base.silent && base.message) {
                this.announceStatusMessage(target, base.message, CONFIG.colors.ui.warning);
            }

            return existing;
        }

        const appliedEffect = {
            type: base.type,
            duration,
            potency: base.potency,
            modifiers: base.modifiers ? { ...base.modifiers } : {},
            appliedModifiers: base.modifiers ? { ...base.modifiers } : {},
            stackable,
            source: base.source,
            message: base.message,
            expireMessage: base.expireMessage,
            tickMessage: base.tickMessage,
            messageColor: base.messageColor,
            expireMessageColor: base.expireMessageColor,
            silent: base.silent
        };

        target.statusEffects.push(appliedEffect);

        if (appliedEffect.appliedModifiers && Object.keys(appliedEffect.appliedModifiers).length) {
            this.applyStatusModifiers(target, appliedEffect.appliedModifiers, 1);
        }

        if (!appliedEffect.silent) {
            const defaultName = this.formatStatusName(appliedEffect.type);
            const message = appliedEffect.message ||
                (target === this.player
                    ? `You are affected by ${defaultName}.`
                    : `The ${target.name || 'monster'} is afflicted with ${defaultName}.`);
            const color = appliedEffect.messageColor
                || (target === this.player ? CONFIG.colors.ui.warning : CONFIG.colors.ui.info);
            this.announceStatusMessage(target, message, color);
        }

        return appliedEffect;
    }

    removeStatusEffect(entity, effect, options = {}) {
        if (!entity || !effect || !entity.statusEffects) {
            return;
        }

        const index = entity.statusEffects.indexOf(effect);
        if (index === -1) {
            return;
        }

        entity.statusEffects.splice(index, 1);

        const modifiers = effect.appliedModifiers || effect.modifiers;
        if (modifiers && Object.keys(modifiers).length) {
            this.applyStatusModifiers(entity, modifiers, -1);
        }

        const silent = options.silent ?? effect.silent;
        const expireMessage = options.expireMessage || effect.expireMessage;
        if (!silent && expireMessage) {
            const color = effect.expireMessageColor || CONFIG.colors.ui.info;
            this.announceStatusMessage(entity, expireMessage, color);
        } else if (!silent && entity === this.player && !expireMessage) {
            const statusName = this.formatStatusName(effect.type);
            this.addMessage(`The effects of ${statusName} fade.`, CONFIG.colors.ui.info);
        }
    }

    resolveStatusEffects(entity) {
        if (!entity || !entity.statusEffects || entity.statusEffects.length === 0) {
            return !entity || entity.hp > 0;
        }

        const activeEffects = [...entity.statusEffects];
        let fatalEffect = null;

        for (const effect of activeEffects) {
            if (!entity.statusEffects.includes(effect)) {
                continue;
            }

            switch (effect.type) {
                case 'poison': {
                    const damage = Math.max(1, effect.potency || 1);
                    entity.hp -= damage;
                    const message = entity === this.player
                        ? `You suffer ${damage} poison damage.`
                        : `The ${entity.name || 'monster'} suffers ${damage} poison damage.`;
                    this.announceStatusMessage(entity, message, CONFIG.colors.ui.warning);
                    break;
                }
                case 'regeneration': {
                    const heal = Math.max(1, effect.potency || 1);
                    const previous = entity.hp;
                    entity.hp = Math.min(entity.maxHp, entity.hp + heal);
                    if (entity.hp > previous) {
                        const message = entity === this.player
                            ? `You regenerate ${entity.hp - previous} health.`
                            : `The ${entity.name || 'monster'} knits its wounds.`;
                        this.announceStatusMessage(entity, message, CONFIG.colors.ui.info);
                    }
                    break;
                }
                default: {
                    if (effect.tickMessage) {
                        this.announceStatusMessage(entity, effect.tickMessage, CONFIG.colors.ui.info);
                    }
                    break;
                }
            }

            if (effect.duration !== Infinity) {
                effect.duration = Math.max(0, effect.duration - 1);
            }

            if (effect.duration === 0) {
                this.removeStatusEffect(entity, effect);
            }

            if (entity.hp <= 0 && !fatalEffect) {
                fatalEffect = effect;
            }

            if (entity.hp <= 0) {
                break;
            }
        }

        if (entity === this.player) {
            this.updateStats();
            if (typeof updatePlayerStats === 'function') {
                updatePlayerStats();
            }
        }

        if (entity.hp <= 0) {
            const cause = fatalEffect ? this.formatStatusName(fatalEffect.type) : 'its wounds';
            if (entity === this.player) {
                this.addMessage(`You succumb to ${cause}.`, CONFIG.colors.ui.warning);
                this.gameOver();
            } else {
                const deathMessage = `The ${entity.name || 'monster'} succumbs to ${cause}.`;
                this.handleMonsterDeath(entity, { message: deathMessage });
            }
            return false;
        }

        return true;
    }

    getStatusSummary(entity, maxEntries = 3) {
        if (!entity || !entity.statusEffects || entity.statusEffects.length === 0) {
            return 'None';
        }

        const segments = entity.statusEffects.slice(0, maxEntries).map(effect => {
            const name = this.formatStatusName(effect.type);
            if (effect.duration === Infinity) {
                return `${name}(∞)`;
            }
            if (effect.duration === undefined || effect.duration === null) {
                return name;
            }
            return `${name}(${effect.duration})`;
        });

        if (entity.statusEffects.length > maxEntries) {
            segments.push('…');
        }

        return segments.join(', ');
    }

    applyEquipmentModifiers(modifiers = {}, direction = 1) {
        if (!this.player || !modifiers) {
            return;
        }

        this.player.equipmentBonuses = this.player.equipmentBonuses || {};
        for (const [stat, value] of Object.entries(modifiers)) {
            if (!Number.isFinite(value)) {
                continue;
            }
            this.player.equipmentBonuses[stat] = (this.player.equipmentBonuses[stat] || 0) + value * direction;
        }

        this.player.recalculateDerivedStats();
        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
    }

    extractItemModifiers(item, baseData = {}) {
        if (!item && !baseData) {
            return {};
        }

        const modifiers = { ...((baseData && baseData.modifiers) || {}) };
        const itemModifiers = item && item.modifiers ? item.modifiers : {};
        for (const [key, value] of Object.entries(itemModifiers)) {
            modifiers[key] = value;
        }

        if (item && item.attack != null && modifiers.attack == null) {
            modifiers.attack = item.attack;
        }
        if (item && item.defense != null && modifiers.defense == null) {
            modifiers.defense = item.defense;
        }
        if (item && item.maxHp != null && modifiers.maxHp == null) {
            modifiers.maxHp = item.maxHp;
        }
        if (item && item.maxHpBonus != null && modifiers.maxHp == null) {
            modifiers.maxHp = item.maxHpBonus;
        }

        return modifiers;
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
        const recovery = 5;
        this.player.hp = Math.min(this.player.hp + recovery, this.player.maxHp);
        this.addMessage(`You recover 5 HP between waves.`, CONFIG.colors.ui.info);

        // Every 3 waves, upgrade player stats
        if (this.arenaWave % 3 === 0) {
            this.player.baseStats.maxHp += 5;
            this.player.baseStats.attack += 1;
            this.player.recalculateDerivedStats();
            this.player.hp = this.player.maxHp;
            this.addMessage(`Your powers grow! Max HP +5, Attack +1`, CONFIG.colors.ui.highlight);
        }

        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
        
        // Spawn next wave after a short delay
        setTimeout(() => {
            this.addMessage(`Wave ${this.arenaWave} begins...`, CONFIG.colors.ui.warning);
            this.spawnArenaWave();
        }, 1500);
    }

    pickUpItem(item, index) {
        if (!item || !this.player) {
            return false;
        }

        const mapKey = `${item.x},${item.y}`;
        if (this.map && this.map[mapKey] === 'i') {
            this.map[mapKey] = this.FLOOR_TILE;
        }

        if (typeof index === 'number' && index >= 0) {
            this.items.splice(index, 1);
        }

        const inventoryItem = this.createInventoryItem(item);
        let addedToExistingStack = false;

        if (inventoryItem.stackable) {
            const existing = this.player.inventory.find(inv => inv.id === inventoryItem.id);
            if (existing) {
                existing.quantity = (existing.quantity || 1) + (inventoryItem.quantity || 1);
                addedToExistingStack = true;
            }
        }

        if (!addedToExistingStack) {
            this.player.inventory.push(inventoryItem);
        }

        const itemName = inventoryItem.quantity && inventoryItem.quantity > 1
            ? `${inventoryItem.quantity} ${inventoryItem.name}`
            : `the ${inventoryItem.name}`;
        this.addMessage(`You pick up ${itemName}.`, CONFIG.colors.ui.info);

        if (this.inventoryOpen && typeof updateInventoryDisplay === 'function') {
            updateInventoryDisplay();
        }

        return true;
    }

    createInventoryItem(item) {
        const baseId = item.id || item.itemKey || null;
        let baseData = null;
        if (typeof ITEMS !== 'undefined') {
            if (baseId && ITEMS[baseId]) {
                baseData = ITEMS[baseId];
            } else if (!baseId && item.name) {
                const match = Object.entries(ITEMS).find(([, data]) => data.name === item.name);
                if (match) {
                    baseData = match[1];
                }
            }
        }

        const id = baseId || (baseData && baseData.id) ||
            (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `item-${Date.now()}`);

        const dataSource = baseData ? { ...baseData } : {};

        const modifiers = this.extractItemModifiers(item, dataSource);
        const onHitStatus = item.onHitStatus
            ? this.cloneStatusTemplate(item.onHitStatus)
            : this.cloneStatusTemplate(dataSource.onHitStatus);
        const duration = item.duration ?? dataSource.duration ?? null;

        return {
            id,
            name: item.name || dataSource.name || 'Unknown Item',
            symbol: item.symbol || dataSource.symbol || '?',
            color: item.color || dataSource.color || '#fff',
            type: item.type || dataSource.type || 'misc',
            effect: item.effect ?? dataSource.effect,
            power: item.power ?? dataSource.power ?? 0,
            attack: item.attack ?? dataSource.attack ?? 0,
            defense: item.defense ?? dataSource.defense ?? 0,
            slot: item.slot ?? dataSource.slot ?? null,
            stackable: item.stackable ?? dataSource.stackable ?? false,
            nutrition: item.nutrition ?? dataSource.nutrition ?? 0,
            quantity: item.quantity != null ? item.quantity : 1,
            equipped: false,
            duration,
            modifiers,
            onHitStatus
        };
    }

    createGroundItem(item) {
        const base = typeof ITEMS !== 'undefined' && item.id && ITEMS[item.id]
            ? ITEMS[item.id]
            : null;

        return {
            x: this.player.x,
            y: this.player.y,
            id: item.id,
            name: item.name || (base && base.name) || 'Item',
            symbol: item.symbol || (base && base.symbol) || '?',
            color: item.color || (base && base.color) || '#fff',
            type: item.type || (base && base.type) || 'misc',
            effect: item.effect ?? (base ? base.effect : undefined),
            power: item.power ?? (base ? base.power : undefined),
            attack: item.attack ?? (base ? base.attack : undefined),
            defense: item.defense ?? (base ? base.defense : undefined),
            slot: item.slot ?? (base ? base.slot : undefined),
            stackable: item.stackable ?? (base ? base.stackable : false),
            nutrition: item.nutrition ?? (base ? base.nutrition : undefined)
        };
    }

    consumeInventoryItem(index, amount = 1) {
        if (!this.player || !this.player.inventory) return;

        const item = this.player.inventory[index];
        if (!item) return;

        if (item.stackable) {
            const current = item.quantity || 1;
            const newQuantity = current - amount;
            if (newQuantity > 0) {
                item.quantity = newQuantity;
                return;
            }
        }

        this.player.inventory.splice(index, 1);
    }

    afterInventoryAction() {
        this.closeInventory();

        if (this.player) {
            this.player.computeFOV();
        }

        this.drawGame();
        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }

        this.endPlayerTurn();
    }

    useInventoryItem(index) {
        if (!this.player || !this.player.inventory) {
            return false;
        }

        const item = this.player.inventory[index];
        if (!item) {
            this.addMessage('That inventory slot is empty.', CONFIG.colors.ui.warning);
            return false;
        }

        let actionTaken = false;
        let consumeItem = false;

        switch (item.type) {
            case 'potion':
                actionTaken = this.usePotionItem(item);
                consumeItem = actionTaken;
                break;
            case 'food':
                actionTaken = this.useFoodItem(item);
                consumeItem = actionTaken;
                break;
            case 'scroll':
                actionTaken = this.useScrollItem(item);
                consumeItem = actionTaken;
                break;
            case 'weapon':
            case 'armor':
                actionTaken = this.toggleEquipItem(item);
                consumeItem = false;
                break;
            default:
                this.addMessage(`You are unsure how to use the ${item.name}.`, CONFIG.colors.ui.warning);
                return false;
        }

        if (!actionTaken) {
            return false;
        }

        if (consumeItem) {
            this.consumeInventoryItem(index, 1);
        }

        this.afterInventoryAction();
        return true;
    }

    dropInventoryItem(index) {
        if (!this.player || !this.player.inventory) {
            return false;
        }

        const item = this.player.inventory[index];
        if (!item) {
            this.addMessage('That inventory slot is empty.', CONFIG.colors.ui.warning);
            return false;
        }

        const occupied = this.items.some(existing => existing.x === this.player.x && existing.y === this.player.y);
        if (occupied) {
            this.addMessage('There is already an item here.', CONFIG.colors.ui.warning);
            this.inventoryDropMode = false;
            return false;
        }

        if (item.equipped) {
            this.unequipItem(item, { silent: true });
        }

        const groundItem = this.createGroundItem(item);
        this.items.push(groundItem);
        if (this.map) {
            this.map[`${groundItem.x},${groundItem.y}`] = 'i';
        }

        this.consumeInventoryItem(index, 1);
        this.addMessage(`You drop the ${groundItem.name}.`, CONFIG.colors.ui.info);

        this.inventoryDropMode = false;
        this.afterInventoryAction();
        return true;
    }

    usePotionItem(item) {
        const effect = item.effect || 'heal';

        if (effect === 'heal') {
            const healAmount = item.power || Math.max(5, Math.floor(this.player.maxHp / 2));
            const missing = this.player.maxHp - this.player.hp;

            if (missing <= 0) {
                this.addMessage('You are already at full health.', CONFIG.colors.ui.warning);
                return false;
            }

            const restored = Math.min(healAmount, missing);
            this.player.hp += restored;
            this.addMessage(`You drink the ${item.name} and recover ${restored} HP.`, CONFIG.colors.ui.info);
            this.updateStats();
            if (typeof updatePlayerStats === 'function') {
                updatePlayerStats();
            }
            return true;
        }

        if (effect === 'strength') {
            const bonus = item.power || 1;
            const duration = item.duration || 10;
            this.applyStatusEffect(this.player, {
                type: 'strength',
                duration,
                modifiers: { attack: bonus },
                source: item.name,
                message: `You feel a surge of strength! Attack +${bonus}.`,
                messageColor: CONFIG.colors.ui.highlight,
                expireMessage: 'Your surge of strength fades.'
            });
            return true;
        }

        this.addMessage(`The ${item.name} has no noticeable effect.`, CONFIG.colors.ui.warning);
        return true;
    }

    useFoodItem(item) {
        const restore = Math.max(1, Math.floor((item.nutrition || 50) / 60));
        const missing = this.player.maxHp - this.player.hp;

        if (missing <= 0) {
            this.addMessage('You are not hungry enough to benefit from that right now.', CONFIG.colors.ui.warning);
            return false;
        }

        const healed = Math.min(restore, missing);
        this.player.hp += healed;
        this.addMessage(`You eat the ${item.name} and recover ${healed} HP.`, CONFIG.colors.ui.info);
        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
        return true;
    }

    useScrollItem(item) {
        const effect = item.effect;

        if (effect === 'teleport') {
            this.addMessage(`You read the ${item.name}.`, CONFIG.colors.ui.info);
            this.teleportPlayer();
            return true;
        }

        if (effect === 'magic_mapping') {
            this.addMessage('The scroll reveals the layout of the dungeon!', CONFIG.colors.ui.highlight);
            this.revealDungeonMap();
            return true;
        }

        this.addMessage(`Mysterious runes fade from the ${item.name} with no effect.`, CONFIG.colors.ui.warning);
        return true;
    }

    toggleEquipItem(item) {
        if (!item.slot) {
            this.addMessage(`You cannot equip the ${item.name}.`, CONFIG.colors.ui.warning);
            return false;
        }

        if (!this.player.equipment) {
            this.player.equipment = { hand: null, body: null };
        }

        if (item.equipped) {
            return this.unequipItem(item);
        }

        return this.equipItem(item);
    }

    equipItem(item, options = {}) {
        if (!item || !item.slot) {
            this.addMessage(`You cannot equip the ${item ? item.name : 'item'}.`, CONFIG.colors.ui.warning);
            return false;
        }

        const slot = item.slot;
        const current = this.player.equipment[slot];
        if (current === item) {
            return true;
        }

        if (current) {
            this.unequipItem(current, { silent: true });
        }

        this.player.equipment[slot] = item;
        item.equipped = true;

        const modifiers = item.modifiers ? { ...item.modifiers } : this.extractItemModifiers(item);
        item.appliedModifiers = modifiers;
        if (modifiers && Object.keys(modifiers).length) {
            this.applyEquipmentModifiers(modifiers, 1);
        }

        if (!options.silent) {
            this.addMessage(`You equip the ${item.name}.`, CONFIG.colors.ui.info);
        }

        return true;
    }

    unequipItem(item, options = {}) {
        if (!item || !item.slot || !this.player.equipment) {
            return false;
        }

        const slot = item.slot;
        if (this.player.equipment[slot] !== item) {
            item.equipped = false;
            return true;
        }

        this.player.equipment[slot] = null;

        const modifiers = item.appliedModifiers || (item.modifiers ? { ...item.modifiers } : this.extractItemModifiers(item));
        if (modifiers && Object.keys(modifiers).length) {
            this.applyEquipmentModifiers(modifiers, -1);
        }

        delete item.appliedModifiers;

        item.equipped = false;

        if (!options.silent) {
            this.addMessage(`You remove the ${item.name}.`, CONFIG.colors.ui.info);
        }

        return true;
    }

    revealDungeonMap() {
        if (!this.map) {
            return;
        }

        if (!this.explored) {
            this.explored = {};
        }

        for (const key of Object.keys(this.map)) {
            this.explored[key] = true;
        }

        if (this.player) {
            this.player.computeFOV();
        }

        this.drawGame();
    }

    rebuildInventoryFromSave(inventoryData = [], equipmentData = {}) {
        if (!this.player) {
            return;
        }

        this.player.inventory = [];
        this.player.equipment = this.player.equipment || { hand: null, body: null };
        this.player.equipment.hand = null;
        this.player.equipment.body = null;

        if (Array.isArray(inventoryData)) {
            inventoryData.forEach(entry => {
                if (!entry) return;
                const base = (typeof ITEMS !== 'undefined' && entry.id && ITEMS[entry.id]) ? ITEMS[entry.id] : {};
                const itemData = {
                    id: entry.id,
                    name: base.name || entry.id || 'Unknown Item',
                    symbol: base.symbol,
                    color: base.color,
                    type: base.type,
                    effect: base.effect,
                    power: base.power,
                    attack: base.attack,
                    defense: base.defense,
                    slot: base.slot,
                    stackable: base.stackable,
                    nutrition: base.nutrition,
                    quantity: entry.quantity || 1,
                    modifiers: base.modifiers,
                    onHitStatus: base.onHitStatus,
                    duration: base.duration
                };

                const inventoryItem = this.createInventoryItem(itemData);
                inventoryItem.quantity = entry.quantity || 1;
                inventoryItem.equipped = false;
                this.player.inventory.push(inventoryItem);
            });
        }

        if (equipmentData && typeof equipmentData === 'object') {
            Object.entries(equipmentData).forEach(([slot, itemId]) => {
                if (!slot || !itemId) return;
                const found = this.player.inventory.find(inv => inv.id === itemId);
                if (found) {
                    this.equipItem(found, { silent: true });
                }
            });
        }

        this.player.recalculateDerivedStats();
        this.updateStats();
        if (typeof updatePlayerStats === 'function') {
            updatePlayerStats();
        }
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
            this.player.baseStats.maxHp += 2;
            this.player.baseStats.attack += 1;
            this.player.recalculateDerivedStats();
            this.player.hp = this.player.maxHp;
            this.addMessage(`You reached level ${this.player.level}!`, CONFIG.colors.ui.highlight);
            this.updateStats();
            if (typeof updatePlayerStats === 'function') {
                updatePlayerStats();
            }
        }
    }

    draw() {
        return this.drawGame();
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
        const attack = this.player.getStatBreakdown ? this.player.getStatBreakdown('attack') : {
            base: this.player.attack,
            equipment: 0,
            status: 0,
            total: this.player.attack
        };
        const defense = this.player.getStatBreakdown ? this.player.getStatBreakdown('defense') : {
            base: this.player.defense,
            equipment: 0,
            status: 0,
            total: this.player.defense
        };
        const statusSummary = this.getStatusSummary(this.player, 2);

        let statsText = `HP: ${this.player.hp}/${this.player.maxHp}`;
        statsText += ` | Atk: ${attack.total} (B${attack.base}/G${attack.equipment}/S${attack.status})`;
        statsText += ` | Def: ${defense.total} (B${defense.base}/G${defense.equipment}/S${defense.status})`;
        statsText += ` | Status: ${statusSummary}`;
        statsText += ` | Lvl: ${this.player.level} | XP: ${this.player.exp} | Gold: ${this.player.gold || 0} | Depth: ${this.depth}`;
        this.display.drawText(1, 0, `%c{${CONFIG.colors.ui.text}}${statsText}`);
    }

    updateStats() {
        const statsElement = document.getElementById('player-stats');
        if (!statsElement) {
            return;
        }

        if (this.player) {
            const attack = this.player.getStatBreakdown ? this.player.getStatBreakdown('attack') : {
                base: this.player.attack,
                equipment: 0,
                status: 0,
                total: this.player.attack
            };
            const defense = this.player.getStatBreakdown ? this.player.getStatBreakdown('defense') : {
                base: this.player.defense,
                equipment: 0,
                status: 0,
                total: this.player.defense
            };
            const statusSummary = this.getStatusSummary(this.player);

            statsElement.innerHTML = `
                <div>HP: ${this.player.hp}/${this.player.maxHp}</div>
                <div>Attack: ${attack.total} (Base ${attack.base} | Gear ${attack.equipment} | Status ${attack.status})</div>
                <div>Defense: ${defense.total} (Base ${defense.base} | Gear ${defense.equipment} | Status ${defense.status})</div>
                <div>Status: ${statusSummary}</div>
                <div>Level: ${this.player.level}</div>
                <div>Exp: ${this.player.exp}</div>
                <div>Depth: ${this.depth}</div>
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
        if (!this.player || !this.player.visibleTiles) {
            return false;
        }

        const key = `${x},${y}`;
        return !!this.player.visibleTiles[key];
    }

    removeMonster(monster) {
        this.entities.delete(monster);
        if (this.scheduler) {
            this.scheduler.remove(monster);
        }
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
        
        // Redraw game to show the new message once the map is ready
        const mapReady = this.map && this.mapBounds && Object.keys(this.map).length > 0;
        const fovReady = this.player && this.player.visibleTiles &&
            Object.keys(this.player.visibleTiles).length > 0;
        if (mapReady && fovReady) {
            this.drawGame();
        }
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