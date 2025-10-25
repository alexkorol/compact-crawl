// compact-crawl/monsters.js - Advanced monster behaviors and rendering

class TentacleMonster {
    constructor(monster) {
        this.monster = monster;
        this.segments = [];
        this.initializeSegments();
    }
    
    initializeSegments() {
        const data = MONSTERS[this.monster.type];
        const segmentCount = data.segments || 5;
        
        // Create segments
        this.segments = [{
            x: this.monster.x,
            y: this.monster.y,
            isHead: true
        }];
        
        // Add body segments
        for (let i = 1; i < segmentCount; i++) {
            // Start with segments stacked on the monster position
            // They'll spread out on the first movement
            this.segments.push({
                x: this.monster.x,
                y: this.monster.y,
                isHead: false,
                colorIndex: i % data.tentacleColor.length
            });
        }
    }
    
    moveSegments() {
        const monster = this.monster;
        
        // Move segments from tail to head
        for (let i = this.segments.length - 1; i > 0; i--) {
            // Each segment follows the one in front of it
            this.segments[i].x = this.segments[i-1].x;
            this.segments[i].y = this.segments[i-1].y;
        }
        
        // Head follows the monster
        this.segments[0].x = monster.x;
        this.segments[0].y = monster.y;
    }
    
    moveWithRandomness() {
        const monster = this.monster;
        
        // Move segments from tail to head with some randomness
        for (let i = this.segments.length - 1; i > 0; i--) {
            if (ROT.RNG.getUniform() < 0.7) {
                // Regular following
                this.segments[i].x = this.segments[i-1].x;
                this.segments[i].y = this.segments[i-1].y;
            } else {
                // Random wiggling
                const directions = [
                    [-1, -1], [0, -1], [1, -1],
                    [-1,  0],          [1,  0],
                    [-1,  1], [0,  1], [1,  1]
                ];
                
                const [dx, dy] = directions[Math.floor(ROT.RNG.getUniform() * directions.length)];
                
                // Make sure we stay within reasonable distance of the previous segment
                const prevSegment = this.segments[i-1];
                const newX = this.segments[i].x + dx;
                const newY = this.segments[i].y + dy;
                
                const distance = calculateDistance(
                    newX, newY, 
                    prevSegment.x, prevSegment.y
                );
                
                if (distance <= 2 && this.isValidPosition(newX, newY)) {
                    this.segments[i].x = newX;
                    this.segments[i].y = newY;
                } else {
                    // Fall back to regular following
                    this.segments[i].x = this.segments[i-1].x;
                    this.segments[i].y = this.segments[i-1].y;
                }
            }
        }
        
        // Head follows the monster
        this.segments[0].x = monster.x;
        this.segments[0].y = monster.y;
    }
    
    moveHydraSegments() {
        const monster = this.monster;
        const monsterData = MONSTERS[monster.type];
        
        // Find all head segments
        const headIndices = [0]; // Main head
        for (let i = 1; i < this.segments.length; i++) {
            if (this.segments[i].isHead) {
                headIndices.push(i);
            }
        }
        
        // Move non-head segments toward the closest head
        for (let i = 0; i < this.segments.length; i++) {
            // Skip head segments
            if (headIndices.includes(i)) continue;
            
            // Find the closest head
            let closestHeadIdx = 0;
            let closestDist = Infinity;
            
            for (const headIdx of headIndices) {
                const head = this.segments[headIdx];
                const dist = calculateDistance(
                    this.segments[i].x, this.segments[i].y,
                    head.x, head.y
                );
                
                if (dist < closestDist) {
                    closestDist = dist;
                    closestHeadIdx = headIdx;
                }
            }
            
            // Move toward closest head
            const head = this.segments[closestHeadIdx];
            const dx = Math.sign(head.x - this.segments[i].x);
            const dy = Math.sign(head.y - this.segments[i].y);
            
            if (Math.random() < 0.7) {
                // Regular movement
                const newX = this.segments[i].x + dx;
                const newY = this.segments[i].y + dy;
                
                if (this.isValidPosition(newX, newY)) {
                    this.segments[i].x = newX;
                    this.segments[i].y = newY;
                }
            } else {
                // Random wiggle
                const newX = this.segments[i].x + (Math.random() < 0.5 ? dx : 0);
                const newY = this.segments[i].y + (Math.random() < 0.5 ? 0 : dy);
                
                if (this.isValidPosition(newX, newY)) {
                    this.segments[i].x = newX;
                    this.segments[i].y = newY;
                }
            }
        }
    }
    
    isValidPosition(x, y) {
        // Check map bounds
        if (x < 0 || x >= game.mapWidth || y < 0 || y >= game.mapHeight) {
            return false;
        }
        
        // Check for walls
        const key = `${x},${y}`;
        if (key in game.map && game.map[key] === '#') {
            return false;
        }
        
        return true;
    }
    
    draw() {
        const monster = this.monster;
        const data = MONSTERS[monster.type];
        const game = window.game;

        if (!game || !game.isVisible(monster.x, monster.y)) return;
        
        // Draw segments from tail to head
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            if (!game.isVisible(segment.x, segment.y)) continue;
            
            // Choose color based on segment index
            let color;
            if (segment.isHead) {
                color = data.color;
            } else if (i === this.segments.length - 1) {
                // Tail segment
                color = data.tentacleColor ? 
                    data.tentacleColor[data.tentacleColor.length - 1] : 
                    '#555';
            } else {
                // Body segment
                const colorIndex = i % data.tentacleColor.length;
                color = data.tentacleColor ? 
                    data.tentacleColor[colorIndex] : 
                    '#777';
            }
            
            // Draw segment
            game.display.draw(
                segment.x, segment.y, 
                i === 0 ? data.symbol : '*', 
                color
            );
        }
    }
}

// Register monster rendering extensions
function setupMonsterRenderers() {
    const monsterRenderers = {};
    
    // Create renderers for special monsters
    for (const [key, data] of Object.entries(MONSTERS)) {
        if (data.behavior === 'serpentine' || 
            data.behavior === 'tentacle' || 
            data.behavior === 'multi_tentacle') {
            
            monsterRenderers[key] = TentacleMonster;
        }
    }
    
    return monsterRenderers;
}

// Shoggoth special ability: splitting
class Shoggoth extends TentacleMonster {
    constructor(monster) {
        super(monster);
        this.splitCooldown = 0;
    }
    
    update() {
        super.moveWithRandomness();
        
        // Attempt to split when below half health and not on cooldown
        if (this.monster.hp < this.monster.maxHp / 2 && this.splitCooldown === 0) {
            this.attemptSplit();
        }
        
        // Reduce cooldown
        if (this.splitCooldown > 0) {
            this.splitCooldown--;
        }
    }
    
    attemptSplit() {
        // 10% chance to split when damaged
        if (Math.random() < 0.1) {
            // Create a smaller shoggoth
            const babyData = Object.assign({}, MONSTERS.shoggoth);
            babyData.hp = Math.floor(this.monster.hp / 2);
            babyData.maxHp = babyData.hp;
            babyData.segments = Math.floor(this.segments.length / 2);
            babyData.attack = Math.floor(this.monster.attack * 0.7);
            
            // Find valid position for baby shoggoth
            for (const direction of [[0,1], [1,0], [0,-1], [-1,0]]) {
                const [dx, dy] = direction;
                const newX = this.monster.x + dx;
                const newY = this.monster.y + dy;
                
                if (this.isValidPosition(newX, newY)) {
                    // Create and add the new shoggoth
                    const baby = new Monster(newX, newY, babyData);
                    baby.name = "Shoggoth Spawn";
                    if (typeof game.addMonster === 'function') {
                        game.addMonster(baby);
                    } else {
                        game.entities.add(baby);
                        if (game.scheduler) {
                            game.scheduler.add(baby, false);
                        }
                    }
                    
                    // Reduce parent shoggoth's HP
                    this.monster.hp = Math.floor(this.monster.hp / 2);
                    
                    // Add message
                    game.addMessage("The shoggoth splits in two!", CONFIG.colors.ui.warning);
                    
                    // Start cooldown
                    this.splitCooldown = 30;
                    break;
                }
            }
        }
    }
}

// Hydra special ability: growing new heads
class Hydra extends TentacleMonster {
    constructor(monster) {
        super(monster);
        this.regrowCooldown = 0;
        this.maxHeads = 5;
    }
    
    update() {
        super.moveHydraSegments();
        
        // Try to regrow heads when damaged
        if (this.monster.hp < this.monster.maxHp * 0.75 && this.regrowCooldown === 0) {
            this.attemptRegrow();
        }
        
        // Reduce cooldown
        if (this.regrowCooldown > 0) {
            this.regrowCooldown--;
        }
    }
    
    attemptRegrow() {
        // Count existing heads
        let headCount = 0;
        for (const segment of this.segments) {
            if (segment.isHead) headCount++;
        }
        
        // Can regrow if below max heads
        if (headCount < this.maxHeads && Math.random() < 0.15) {
            // Find a non-head segment to convert
            for (let i = 1; i < this.segments.length; i++) {
                if (!this.segments[i].isHead) {
                    // Convert to head
                    this.segments[i].isHead = true;
                    
                    // Increase monster stats
                    this.monster.attack += 1;
                    this.monster.hp += 3;
                    this.monster.maxHp += 3;
                    
                    // Add message
                    game.addMessage("The hydra grows a new head!", CONFIG.colors.ui.warning);
                    
                    // Start cooldown
                    this.regrowCooldown = 20;
                    break;
                }
            }
        }
    }
}

// Register monster behaviors
const monsterBehaviors = {
    shoggoth: Shoggoth,
    hydra: Hydra
};

// Export functions
window.setupMonsterRenderers = setupMonsterRenderers;
window.monsterBehaviors = monsterBehaviors;
