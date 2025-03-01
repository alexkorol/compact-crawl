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
        this.behavior = data.behavior || "melee";
        this.abilities = data.abilities || [];
        this.speed = data.speed || 100;
        this.segments = [];
        this.tentacleColors = data.tentacleColor || ["#f00"]; // Default red
        
        // Initialize segments for snake-like monsters
        if (this.behavior === "serpentine" || this.behavior === "tentacle" || this.behavior === "multi_tentacle") {
            this.initializeSegments(data.segments || 3, data.heads || 1);
        }
    }

    act() {
        // Only act if visible to player
        if (game.isVisible(this.x, this.y)) {
            switch (this.behavior) {
                case "melee":
                    this.meleeMovement();
                    break;
                case "random":
                    this.randomMovement();
                    break;
                case "serpentine":
                    this.serpentineMovement();
                    break;
                case "tentacle":
                    this.tentacleMovement();
                    break;
                case "multi_tentacle":
                    this.multiTentacleMovement();
                    break;
                default:
                    this.meleeMovement();
            }
        }
    }

    initializeSegments(length, heads = 1) {
        this.segments = [];
        
        // Main body/head
        this.segments.push({ x: this.x, y: this.y, isHead: true });
        
        // For multi-headed monsters, create additional heads branching from the main body
        if (this.behavior === "multi_tentacle" && heads > 1) {
            // Create initial body segment that all tentacles connect to
            let direction = ROT.RNG.getUniform() < 0.5 ? 0 : 1; // 0: horizontal, 1: vertical
            let mainBodyX = this.x + (direction === 0 ? 1 : 0);
            let mainBodyY = this.y + (direction === 1 ? 1 : 0);
            
            // Make sure the body segment is on a valid tile
            if (!this.isValidMove(mainBodyX, mainBodyY)) {
                mainBodyX = this.x;
                mainBodyY = this.y;
            }
            
            this.segments.push({ x: mainBodyX, y: mainBodyY, isHead: false });
            
            // Create each head with its own tentacle segments
            for (let i = 0; i < heads; i++) {
                let headDirection = Math.floor(ROT.RNG.getUniform() * 4); // 0: up, 1: right, 2: down, 3: left
                let curX = mainBodyX;
                let curY = mainBodyY;
                
                // Create segments for this tentacle/head
                for (let j = 0; j < length - 2; j++) {
                    switch (headDirection) {
                        case 0: curY--; break;
                        case 1: curX++; break;
                        case 2: curY++; break;
                        case 3: curX--; break;
                    }
                    
                    // Make sure we don't go to invalid tiles
                    if (!this.isValidMove(curX, curY)) {
                        break;
                    }
                    
                    // Last segment is a head
                    this.segments.push({ 
                        x: curX, 
                        y: curY, 
                        isHead: j === length - 3,
                        headIndex: i + 1 // Mark which head this is
                    });
                }
            }
        } else {
            // For single-tentacle/snake monsters
            let direction = ROT.RNG.getUniform() < 0.5 ? 0 : 2; // 0: up, 2: down
            let prevX = this.x;
            let prevY = this.y;
            
            // Create body segments in a line
            for (let i = 1; i < length; i++) {
                let dx = 0, dy = 0;
                
                switch (direction) {
                    case 0: dy = -1; break; // Up
                    case 1: dx = 1; break;  // Right
                    case 2: dy = 1; break;  // Down
                    case 3: dx = -1; break; // Left
                }
                
                let nextX = prevX + dx;
                let nextY = prevY + dy;
                
                // Make sure the segment is on a valid tile
                if (!this.isValidMove(nextX, nextY)) {
                    // Change direction if we hit something
                    direction = (direction + 2) % 4;
                    dx = -dx;
                    dy = -dy;
                    nextX = prevX + dx;
                    nextY = prevY + dy;
                }
                
                if (!this.isValidMove(nextX, nextY)) {
                    // If we still can't move, just stack the segments
                    nextX = prevX;
                    nextY = prevY;
                }
                
                this.segments.push({ x: nextX, y: nextY, isHead: false });
                prevX = nextX;
                prevY = nextY;
            }
        }
    }

    meleeMovement() {
        // Simple straight-line movement toward player
        const path = this.getPathToPlayer();
        if (path && path.length > 1) {
            const [nextX, nextY] = path[1];
            
            // Attack player if adjacent
            if (nextX === game.player.x && nextY === game.player.y) {
                this.attackPlayer();
            } else if (this.isValidMove(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            }
        }
    }

    randomMovement() {
        // Move in a random direction
        const directions = [
            [0, -1], [1, -1], [1, 0], [1, 1],
            [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];
        
        const [dx, dy] = ROT.RNG.getItem(directions);
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (this.isValidMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
    }

    serpentineMovement() {
        // Snake-like movement with body following head
        const head = this.segments[0];
        let newX = head.x;
        let newY = head.y;
        
        // Get path to player
        const path = this.getPathToPlayer();
        if (path && path.length > 1) {
            [newX, newY] = path[1];
            
            // Attack player if adjacent
            if (newX === game.player.x && newY === game.player.y) {
                this.attackPlayer();
                return;
            }
        } else {
            // Random movement if no path
            const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            const [dx, dy] = ROT.RNG.getItem(directions);
            newX = head.x + dx;
            newY = head.y + dy;
        }
        
        // Only move if valid
        if (this.isValidMove(newX, newY)) {
            // Move head to new position
            head.x = newX;
            head.y = newY;
            
            // Update entity position to match head
            this.x = newX;
            this.y = newY;
            
            // Move each segment to position of previous segment
            for (let i = this.segments.length - 1; i > 0; i--) {
                this.segments[i].x = this.segments[i - 1].x;
                this.segments[i].y = this.segments[i - 1].y;
            }
        }
    }

    tentacleMovement() {
        // Kraken/shoggoth movement - writhing tentacles with more random behavior
        const head = this.segments[0];
        
        // 75% chance to move toward player, 25% chance for random movement
        let newX = head.x;
        let newY = head.y;
        
        if (ROT.RNG.getUniform() < 0.75) {
            // Get path to player
            const path = this.getPathToPlayer();
            if (path && path.length > 1) {
                [newX, newY] = path[1];
                
                // Attack player if adjacent
                if (newX === game.player.x && newY === game.player.y) {
                    this.attackPlayer();
                    return;
                }
            }
        } else {
            // Random movement with slight preference for directions that contort the tentacle
            const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            const [dx, dy] = ROT.RNG.getItem(directions);
            newX = head.x + dx;
            newY = head.y + dy;
        }
        
        // Only move if valid
        if (this.isValidMove(newX, newY)) {
            // Move head to new position
            head.x = newX;
            head.y = newY;
            
            // Update entity position to match head
            this.x = newX;
            this.y = newY;
            
            // Move tentacle segments with some randomization
            // Each segment has a chance to wiggle instead of directly following
            for (let i = this.segments.length - 1; i > 0; i--) {
                if (ROT.RNG.getUniform() < 0.7) {
                    // Normal following behavior
                    this.segments[i].x = this.segments[i - 1].x;
                    this.segments[i].y = this.segments[i - 1].y;
                } else {
                    // Wiggle randomly adjacent to previous position
                    const prevSegment = this.segments[i - 1];
                    const dirs = [
                        [0, -1], [1, -1], [1, 0], [1, 1],
                        [0, 1], [-1, 1], [-1, 0], [-1, -1]
                    ];
                    
                    let wiggleDir = dirs[Math.floor(ROT.RNG.getUniform() * dirs.length)];
                    let wiggleX = this.segments[i].x + wiggleDir[0];
                    let wiggleY = this.segments[i].y + wiggleDir[1];
                    
                    // Ensure segment stays close to the previous segment
                    const distance = calculateDistance(wiggleX, wiggleY, prevSegment.x, prevSegment.y);
                    if (distance <= 1.5 && this.isValidMove(wiggleX, wiggleY)) {
                        this.segments[i].x = wiggleX;
                        this.segments[i].y = wiggleY;
                    } else {
                        // Fall back to normal following
                        this.segments[i].x = prevSegment.x;
                        this.segments[i].y = prevSegment.y;
                    }
                }
            }
        }
    }

    multiTentacleMovement() {
        // Hydra/multi-headed movement
        // Each head moves somewhat independently
        
        // First, move the main body/head
        const head = this.segments[0];
        let newX = head.x;
        let newY = head.y;
        
        // 60% chance to move toward player, 40% chance for random
        if (ROT.RNG.getUniform() < 0.6) {
            // Get path to player
            const path = this.getPathToPlayer();
            if (path && path.length > 1) {
                [newX, newY] = path[1];
                
                // Attack player if adjacent
                if (newX === game.player.x && newY === game.player.y) {
                    this.attackPlayer();
                    return;
                }
            }
        } else {
            // Random movement
            const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            const [dx, dy] = ROT.RNG.getItem(directions);
            newX = head.x + dx;
            newY = head.y + dy;
        }
        
        // Only move if valid
        if (this.isValidMove(newX, newY)) {
            // Move head to new position
            head.x = newX;
            head.y = newY;
            
            // Update entity position to match head
            this.x = newX;
            this.y = newY;
            
            // Now move each head independently
            // Find all segments that are heads (except the main one)
            const headSegments = this.segments.filter(s => s.isHead && s !== this.segments[0]);
            
            for (const headSeg of headSegments) {
                // 70% chance to move toward player, 30% random
                if (ROT.RNG.getUniform() < 0.7) {
                    const headPath = new ROT.Path.AStar(
                        game.player.x, game.player.y,
                        (x, y) => this.isValidMove(x, y)
                    );
                    
                    const headNewPath = [];
                    headPath.compute(headSeg.x, headSeg.y, (x, y) => {
                        headNewPath.push([x, y]);
                    });
                    
                    if (headNewPath.length > 1) {
                        const [headNextX, headNextY] = headNewPath[1];
                        
                        // Attack if adjacent to player
                        if (headNextX === game.player.x && headNextY === game.player.y) {
                            this.attackPlayer();
                        } else if (this.isValidMove(headNextX, headNextY)) {
                            headSeg.x = headNextX;
                            headSeg.y = headNextY;
                        }
                    }
                } else {
                    // Random movement
                    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                    const [dx, dy] = ROT.RNG.getItem(directions);
                    const headNextX = headSeg.x + dx;
                    const headNextY = headSeg.y + dy;
                    
                    if (this.isValidMove(headNextX, headNextY)) {
                        headSeg.x = headNextX;
                        headSeg.y = headNextY;
                    }
                }
            }
            
            // Now move all non-head segments to follow their respective heads
            // We need to figure out which segments belong to which head
            // For this demo, we'll use a simple algorithm - move toward whichever
            // head segment is closest
            
            const nonHeadSegments = this.segments.filter(s => !s.isHead);
            
            for (const segment of nonHeadSegments) {
                // Find closest head
                let closestHead = this.segments[0]; // Default to main head
                let closestDist = calculateDistance(segment.x, segment.y, closestHead.x, closestHead.y);
                
                for (const headSeg of headSegments) {
                    const dist = calculateDistance(segment.x, segment.y, headSeg.x, headSeg.y);
                    if (dist < closestDist) {
                        closestHead = headSeg;
                        closestDist = dist;
                    }
                }
                
                // Move toward closest head with some wiggle
                if (closestDist > 1.5) {
                    const dx = Math.sign(closestHead.x - segment.x);
                    const dy = Math.sign(closestHead.y - segment.y);
                    
                    // Add some randomness to movement
                    const newX = segment.x + dx + (ROT.RNG.getUniform() < 0.3 ? Math.floor(ROT.RNG.getUniform() * 3) - 1 : 0);
                    const newY = segment.y + dy + (ROT.RNG.getUniform() < 0.3 ? Math.floor(ROT.RNG.getUniform() * 3) - 1 : 0);
                    
                    if (this.isValidMove(newX, newY)) {
                        segment.x = newX;
                        segment.y = newY;
                    }
                }
            }
        }
    }

    attackPlayer() {
        // Calculate damage
        const damage = Math.max(1, this.attack - game.player.defense);
        
        // Apply damage
        game.player.hp -= damage;
        
        // Add message based on monster type
        if (this.behavior === "tentacle" || this.behavior === "multi_tentacle") {
            let attackVerb = "whips";
            if (this.name.includes("Kraken")) attackVerb = "constricts";
            if (this.name.includes("Shoggoth")) attackVerb = "engulfs";
            if (this.name.includes("Hydra")) attackVerb = "strikes";
            
            game.addMessage(`The ${this.name} ${attackVerb} you for ${damage} damage!`, CONFIG.colors.ui.warning);
        } else if (this.behavior === "serpentine") {
            game.addMessage(`The ${this.name} bites you for ${damage} damage!`, CONFIG.colors.ui.warning);
        } else {
            game.addMessage(`The ${this.name} attacks you for ${damage} damage!`, CONFIG.colors.ui.warning);
        }
        
        // Check for special abilities
        if (this.abilities.includes("poison") && ROT.RNG.getUniform() < 0.3) {
            game.player.hp--; // Additional poison damage
            game.addMessage("You are poisoned!", CONFIG.colors.ui.warning);
        }
        
        if (this.abilities.includes("dissolve") && ROT.RNG.getUniform() < 0.2) {
            // Shoggoth special ability
            game.player.defense = Math.max(0, game.player.defense - 1);
            game.addMessage("Your armor is dissolving!", CONFIG.colors.ui.warning);
        }
        
        // Check if player is dead
        if (game.player.hp <= 0) {
            game.gameOver();
        }
    }

    getPathToPlayer() {
        // Create a pathfinding instance
        const astar = new ROT.Path.AStar(
            game.player.x, game.player.y,
            (x, y) => this.isValidMove(x, y)
        );
        
        // Compute path
        const path = [];
        astar.compute(this.x, this.y, (x, y) => {
            path.push([x, y]);
        });
        
        return path;
    }

    isValidMove(x, y) {
        // Use key lookup on game.map (which is an object)
        const key = `${x},${y}`;
        // If tile is undefined or a wall, move is invalid.
        if (!(key in game.map)) return false;
        if (game.map[key] === '#') return false;
        // Allow moving into player tile for special behaviors
        if (x === game.player.x && y === game.player.y) {
            return this.behavior === "tentacle" || this.behavior === "multi_tentacle";
        }
        return true;
    }

    draw(ctx, offsetX, offsetY, tileSize) {
        super.draw(ctx, offsetX, offsetY, tileSize);
        
        // Draw segments for snake/tentacle monsters
        if (this.segments.length > 0 && 
           (this.behavior === "serpentine" || 
            this.behavior === "tentacle" || 
            this.behavior === "multi_tentacle")) {
            
            for (let i = this.segments.length - 1; i >= 0; i--) {
                const segment = this.segments[i];
                
                // Skip if not visible
                if (!game.isVisible(segment.x, segment.y)) continue;
                
                const screenX = (segment.x - offsetX) * tileSize;
                const screenY = (segment.y - offsetY) * tileSize;
                
                // Choose color based on segment index
                let color;
                if (segment.isHead) {
                    // Head segment uses monster's main color
                    color = this.color;
                } else {
                    // Body segments use tentacle color palette
                    const colorIndex = Math.min(i % this.tentacleColors.length, this.tentacleColors.length - 1);
                    color = this.tentacleColors[colorIndex];
                }
                
                // Draw the segment
                ctx.fillStyle = color;
                ctx.fillRect(screenX, screenY, tileSize, tileSize);
                
                // For head segments, add some detail
                if (segment.isHead) {
                    // Add eyes or other details
                    ctx.fillStyle = "#fff"; // White eyes
                    
                    // Draw eyes as small rectangles
                    const eyeSize = tileSize / 5;
                    ctx.fillRect(screenX + tileSize/4, screenY + tileSize/3, eyeSize, eyeSize);
                    ctx.fillRect(screenX + tileSize*3/4 - eyeSize, screenY + tileSize/3, eyeSize, eyeSize);
                }
            }
        }
    }
}